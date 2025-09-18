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

export async function DELETE(
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

    const { provider, id: folderId } = await params;

    if (!isAllowedProvider(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
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
        apiUrl = `https://doodapi.com/api/folder/delete?key=${apiKey}&fld_id=${folderId}`;
        break;
      
      case 'streamtape':
        const [login, key] = apiKey.split(':');
        if (!login || !key) {
          return NextResponse.json(
            { error: 'StreamTape API key must be in format "login:key"' },
            { status: 400 }
          );
        }
        apiUrl = `https://api.streamtape.com/file/deletefolder?login=${login}&key=${key}&folder=${folderId}`;
        break;
      
      case 'vidguard':
        apiUrl = `https://api.vidguard.to/v1/folder/delete?key=${apiKey}&id=${folderId}`;
        break;
      
      case 'bigwarp':
        apiUrl = `https://bigwarp.io/api/folder/delete?key=${apiKey}&fld_id=${folderId}`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    const response = await fetch(apiUrl, { headers });
    const data = await response.json();

    if (!response.ok || (data.status && data.status !== 200)) {
      return NextResponse.json(
        { error: data.msg || data.message || 'Failed to delete folder' },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
