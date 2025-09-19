import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export interface ApiKeys {
  [provider: string]: string;
}

export const ALLOWED_PROVIDERS = ['bigwarp', 'doodstream', 'streamtape', 'vidguard'] as const;
export type AllowedProvider = typeof ALLOWED_PROVIDERS[number];

export function isAllowedProvider(provider: string): provider is AllowedProvider {
  return ALLOWED_PROVIDERS.includes(provider as AllowedProvider);
}

export async function readApiKeys(): Promise<ApiKeys> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {};
    }

    const providerKeys = await prisma.providerKey.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        apiKey: true,
      }
    });

    const keys: ApiKeys = {};
    for (const keyRecord of providerKeys) {
      keys[keyRecord.provider] = keyRecord.apiKey;
    }
    
    return keys;
  } catch (error) {
    console.error('Error reading API keys from database:', error);
    return {};
  }
}

export async function writeApiKeys(keys: ApiKeys): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Delete existing keys for this user
    await prisma.providerKey.deleteMany({
      where: { userId: session.user.id }
    });

    // Insert new keys
    const keyEntries = Object.entries(keys).map(([provider, apiKey]) => ({
      provider,
      apiKey,
      userId: session.user.id
    }));

    if (keyEntries.length > 0) {
      await prisma.providerKey.createMany({
        data: keyEntries
      });
    }
  } catch (error) {
    console.error('Error writing API keys to database:', error);
    throw error;
  }
}

export async function setApiKey(provider: AllowedProvider, key: string): Promise<void> {
  if (!key || key.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  // First try to find existing key
  const existingKey = await prisma.providerKey.findFirst({
    where: {
      userId: session.user.id,
      provider: provider
    }
  });

  if (existingKey) {
    // Update existing key
    await prisma.providerKey.update({
      where: { id: existingKey.id },
      data: { apiKey: key.trim() }
    });
  } else {
    // Create new key
    await prisma.providerKey.create({
      data: {
        provider: provider,
        apiKey: key.trim(),
        userId: session.user.id
      }
    });
  }
}

export async function deleteApiKey(provider: AllowedProvider): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  await prisma.providerKey.deleteMany({
    where: {
      userId: session.user.id,
      provider: provider
    }
  });
}

export async function getApiKey(provider: AllowedProvider): Promise<string | undefined> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return undefined;
    }

    const providerKey = await prisma.providerKey.findFirst({
      where: {
        userId: session.user.id,
        provider: provider
      },
      select: {
        apiKey: true
      }
    });

    return providerKey?.apiKey;
  } catch (error) {
    console.error(`Error getting API key for ${provider}:`, error);
    return undefined;
  }
}

export async function getKeyStatus(): Promise<Record<AllowedProvider, boolean>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const status: Record<AllowedProvider, boolean> = {} as any;
      for (const provider of ALLOWED_PROVIDERS) {
        status[provider] = false;
      }
      return status;
    }

    const providerKeys = await prisma.providerKey.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        apiKey: true,
      }
    });

    const status: Record<AllowedProvider, boolean> = {} as any;
    
    for (const provider of ALLOWED_PROVIDERS) {
      const keyRecord = providerKeys.find(k => k.provider === provider);
      status[provider] = !!(keyRecord?.apiKey && keyRecord.apiKey.trim().length > 0);
    }
    
    return status;
  } catch (error) {
    console.error('Error getting key status:', error);
    const status: Record<AllowedProvider, boolean> = {} as any;
    for (const provider of ALLOWED_PROVIDERS) {
      status[provider] = false;
    }
    return status;
  }
}
