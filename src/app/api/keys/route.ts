import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Define allowed providers directly in the API route
const ALLOWED_PROVIDERS = [
  'doodstream',
  'streamtape', 
  'vidguard',
  'bigwarp'
];

function isAllowedProvider(provider: string): boolean {
  return ALLOWED_PROVIDERS.includes(provider);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const providerKeys = await prisma.providerKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        createdAt: true,
      }
    });

    const status: Record<string, boolean> = {};
    ALLOWED_PROVIDERS.forEach(provider => {
      status[provider] = providerKeys.some(key => key.provider === provider);
    });

    return NextResponse.json({ 
      success: true, 
      providers: status,
      keys: providerKeys
    });
  } catch (error) {
    console.error('Error getting key status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get key status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, key } = body;

    if (!provider || !key) {
      return NextResponse.json(
        { success: false, error: 'Provider and key are required' },
        { status: 400 }
      );
    }

    if (!isAllowedProvider(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Allowed providers: ${ALLOWED_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof key !== 'string' || key.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Key must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if key already exists for this user and provider
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
        data: { apiKey: key }
      });
    } else {
      // Create new key
      await prisma.providerKey.create({
        data: {
          provider,
          apiKey: key,
          userId: session.user.id
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `API key for ${provider} updated successfully`,
      provider 
    });
  } catch (error) {
    console.error('Error setting API key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, id } = body;

    if (!provider && !id) {
      return NextResponse.json(
        { success: false, error: 'Provider or ID is required' },
        { status: 400 }
      );
    }

    if (provider && !isAllowedProvider(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Allowed providers: ${ALLOWED_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    // Delete by ID or by provider
    if (id) {
      await prisma.providerKey.delete({
        where: {
          id: id,
          userId: session.user.id // Ensure user can only delete their own keys
        }
      });
    } else {
      await prisma.providerKey.deleteMany({
        where: {
          provider: provider,
          userId: session.user.id
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `API key deleted successfully`,
      provider 
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
