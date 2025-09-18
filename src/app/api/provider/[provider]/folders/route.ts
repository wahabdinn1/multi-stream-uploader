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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folder_id') || '0';
    const { provider } = await params;

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

    switch (provider as string) {
      case 'doodstream':
        // Use both folder and file listing endpoints
        apiUrl = `https://doodapi.com/api/folder/list?key=${apiKey}&fld_id=${folderId}&only_folders=0`;
        break;
      
      case 'streamtape':
        const [login, key] = apiKey.split(':');
        if (!login || !key) {
          return NextResponse.json(
            { error: 'StreamTape API key must be in format "login:key"' },
            { status: 400 }
          );
        }
        apiUrl = `https://api.streamtape.com/file/listfolder?login=${login}&key=${key}&folder=${folderId}`;
        break;
      
      case 'vidguard':
        // VidGuard has separate endpoints for folders and files
        apiUrl = `https://api.vidguard.to/v1/folder/list?key=${apiKey}&folder=${folderId}`;
        break;
      
      case 'bigwarp':
        // BigWarp folder list endpoint with files included
        apiUrl = `https://bigwarp.io/api/folder/list?key=${apiKey}&fld_id=${folderId}&files=1`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    let response, data;
    let files: any[] = [];
    let folders: any[] = [];

    // For VidGuard, we need to make separate calls for folders and files
    if (provider === 'vidguard') {
      // Get folders
      const folderResponse = await fetch(apiUrl, { headers });
      if (folderResponse.ok) {
        const folderData = await folderResponse.json();
        if (folderData.status === 200 && folderData.result) {
          folders = folderData.result.map((f: any) => ({
            id: f.ID.toString(),
            name: f.name,
            type: 'folder',
            created: f.CreatedAt
          }));
        }
      }

      // Get files in the folder
      const fileApiUrl = `https://api.vidguard.to/v1/video/list?key=${apiKey}&folder=${folderId}&limit=100&deleted=0`;
      const fileResponse = await fetch(fileApiUrl, { headers });
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        if (fileData.msg === "Done" && fileData.status === 200 && fileData.result) {
          files = fileData.result.map((f: any) => ({
            id: f.HashID,
            name: f.Name,
            type: 'file',
            size: f.Size || 0,
            url: `https://vidguard.to/v/${f.HashID}`,
            created: f.CreatedAt,
            thumbnail: f.Poster,
            views: f.Views || 0,
            duration: f.Duration
          }));
        }
      }

      return NextResponse.json({
        folders,
        files,
        total: folders.length + files.length
      });
    }

    // For other providers, use the single endpoint
    response = await fetch(apiUrl, { headers });
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('API returned non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    data = await response.json();

    // Normalize response format across providers
    switch (provider as string) {
      case 'doodstream':
        if (data.status === 200 && data.result) {
          folders = data.result.folders?.map((f: any) => ({
            id: f.fld_id,
            name: f.name,
            type: 'folder'
          })) || [];
          files = data.result.files?.map((f: any) => ({
            id: f.file_code,
            name: f.title,
            type: 'file',
            size: parseInt(f.length) || 0,
            url: f.download_url,
            created: f.uploaded,
            thumbnail: f.single_img,
            views: parseInt(f.views) || 0,
            duration: f.duration
          })) || [];
        }
        break;
      
      case 'streamtape':
        if (data.status === 200 && data.result) {
          folders = data.result.folders?.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: 'folder'
          })) || [];
          files = data.result.files?.map((f: any) => ({
            id: f.linkid,
            name: f.name,
            type: 'file',
            size: f.size || 0,
            url: f.link,
            created: new Date(f.created_at).toISOString(),
            thumbnail: f.thumbnail,
            views: f.downloads || 0,
            duration: f.duration
          })) || [];
        }
        break;
      
      // VidGuard is handled separately above
      case 'vidguard':
        // Already handled in separate API calls above
        break;
      
      case 'bigwarp':
        if (data.status === 200 && data.result) {
          // BigWarp folder list returns both folders and files
          folders = data.result.folders?.map((f: any) => ({
            id: f.fld_id,
            name: f.name,
            type: 'folder'
          })) || [];
          files = data.result.files?.map((f: any) => ({
            id: f.file_code,
            name: f.title,
            type: 'file',
            size: parseInt(f.size) || parseInt(f.length) || 0,
            url: f.link,
            created: f.uploaded,
            thumbnail: f.thumbnail,
            views: parseInt(f.views) || 0,
            duration: f.length
          })) || [];
        }
        break;
    }

    return NextResponse.json({ 
      folders, 
      files,
      total: folders.length + files.length,
      provider: provider
    });

  } catch (error) {
    console.error('Folder list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder contents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, parent_id } = await request.json();
    const { provider } = await params;

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
        apiUrl = `https://doodapi.com/api/folder/create?key=${apiKey}&name=${encodeURIComponent(name)}&parent_id=${parent_id || '0'}`;
        break;
      
      case 'streamtape':
        const [login, key] = apiKey.split(':');
        if (!login || !key) {
          return NextResponse.json(
            { error: 'StreamTape API key must be in format "login:key"' },
            { status: 400 }
          );
        }
        apiUrl = `https://api.streamtape.com/file/createfolder?login=${login}&key=${key}&name=${encodeURIComponent(name)}&pid=${parent_id || ''}`;
        break;
      
      case 'vidguard':
        apiUrl = `https://api.vidguard.to/v1/folder/new?key=${apiKey}&name=${encodeURIComponent(name)}&folder=${parent_id || '0'}`;
        break;
      
      case 'bigwarp':
        apiUrl = `https://bigwarp.io/api/folder/create?key=${apiKey}&name=${encodeURIComponent(name)}&parent_id=${parent_id || '0'}`;
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
        { error: data.msg || data.message || 'Failed to create folder' },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
