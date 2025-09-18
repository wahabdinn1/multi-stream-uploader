import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const ALLOWED_PROVIDERS = [
  'doodstream',
  'streamtape', 
  'vidguard',
  'bigwarp'
];

function isAllowedProvider(provider: string): boolean {
  return ALLOWED_PROVIDERS.includes(provider);
}

async function getApiKey(provider: string, userId: string): Promise<string | null> {
  try {
    const providerKey = await prisma.providerKey.findFirst({
      where: {
        userId: userId,
        provider: provider
      },
      select: {
        apiKey: true
      }
    });
    
    return providerKey?.apiKey || null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name } = await request.json();
    const { provider, id: folderId } = await params;

    if (!isAllowedProvider(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const apiKey = await getApiKey(provider, session.user.id);
    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for ${provider}` },
        { status: 401 }
      );
    }

    let apiUrl = '';
    let headers: Record<string, string> = {};

    switch (provider) {
      case 'doodstream':
        apiUrl = `https://doodapi.com/api/folder/rename?key=${apiKey}&fld_id=${folderId}&name=${encodeURIComponent(name)}`;
        break;
      
      case 'streamtape':
        const [login, key] = apiKey.split(':');
        if (!login || !key) {
          return NextResponse.json(
            { error: 'StreamTape API key must be in format "login:key"' },
            { status: 400 }
          );
        }
        apiUrl = `https://api.streamtape.com/folder/rename?login=${login}&key=${key}&folder=${folderId}&name=${encodeURIComponent(name)}`;
        break;
      
      case 'vidguard':
        apiUrl = `https://api.vidguard.to/v1/folder/rename?key=${apiKey}&id=${folderId}&name=${encodeURIComponent(name)}`;
        break;
      
      case 'bigwarp':
        apiUrl = `https://bigwarp.io/api/folder/rename?key=${apiKey}&fld_id=${folderId}&name=${encodeURIComponent(name)}`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Check success based on provider response format
    let success = false;
    if (provider === 'doodstream') {
      success = data.status === 200;
    } else if (provider === 'streamtape') {
      success = data.status === 200;
    } else if (provider === 'vidguard') {
      success = data.msg === "Done" && data.status === 200;
    } else if (provider === 'bigwarp') {
      success = data.msg === "OK" && data.status === 200;
    }

    if (!success) {
      return NextResponse.json(
        { error: data.msg || 'Rename failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Folder rename error:', error);
    return NextResponse.json(
      { error: 'Failed to rename folder' },
      { status: 500 }
    );
  }
}
