import { promises as fs } from 'fs';
import path from 'path';

const KEYS_FILE_PATH = path.join(process.cwd(), 'config', 'apiKeys.json');

export interface ApiKeys {
  [provider: string]: string;
}

export const ALLOWED_PROVIDERS = ['vidguard', 'bigwarp', 'doodstream', 'streamtape'] as const;
export type AllowedProvider = typeof ALLOWED_PROVIDERS[number];

export function isAllowedProvider(provider: string): provider is AllowedProvider {
  return ALLOWED_PROVIDERS.includes(provider as AllowedProvider);
}

export async function readApiKeys(): Promise<ApiKeys> {
  try {
    const data = await fs.readFile(KEYS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, return empty object
      return {};
    }
    throw error;
  }
}

export async function writeApiKeys(keys: ApiKeys): Promise<void> {
  try {
    // Ensure config directory exists
    await fs.mkdir(path.dirname(KEYS_FILE_PATH), { recursive: true });
    
    // Atomic write: write to temp file then rename
    const tempPath = `${KEYS_FILE_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(keys, null, 2), 'utf-8');
    await fs.rename(tempPath, KEYS_FILE_PATH);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(`${KEYS_FILE_PATH}.tmp`);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export async function setApiKey(provider: AllowedProvider, key: string): Promise<void> {
  if (!key || key.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  const keys = await readApiKeys();
  keys[provider] = key.trim();
  await writeApiKeys(keys);
}

export async function deleteApiKey(provider: AllowedProvider): Promise<void> {
  const keys = await readApiKeys();
  delete keys[provider];
  await writeApiKeys(keys);
}

export async function getApiKey(provider: AllowedProvider): Promise<string | undefined> {
  const keys = await readApiKeys();
  return keys[provider];
}

export async function getKeyStatus(): Promise<Record<AllowedProvider, boolean>> {
  const keys = await readApiKeys();
  const status: Record<AllowedProvider, boolean> = {} as any;
  
  for (const provider of ALLOWED_PROVIDERS) {
    status[provider] = !!(keys[provider] && keys[provider].trim().length > 0);
  }
  
  return status;
}
