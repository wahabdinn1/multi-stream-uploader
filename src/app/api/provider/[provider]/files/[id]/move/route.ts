import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, isAllowedProvider } from '../../../../../../../lib/keyStorage';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; id: string }> }
) {
  try {
    const { folder_id } = await request.json();
    const { provider, id } = await params;

    if (!isAllowedProvider(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    if (!folder_id) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    const apiKey = await getApiKey(provider);
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
        // DoodStream doesn't have file move in docs
        return NextResponse.json(
          { error: 'File move not supported for DoodStream' },
          { status: 400 }
        );
      
      case 'streamtape':
        const [login, key] = apiKey.split(':');
        if (!login || !key) {
          return NextResponse.json(
            { error: 'StreamTape API key must be in format "login:key"' },
            { status: 400 }
          );
        }
        apiUrl = `https://api.streamtape.com/file/move?login=${login}&key=${key}&file=${id}&folder=${folder_id}`;
        break;
      
      case 'vidguard':
        apiUrl = `https://api.vidguard.to/v1/video/move?key=${apiKey}&id=${id}&folder=${folder_id}`;
        break;
      
      case 'bigwarp':
        // BigWarp doesn't have file move in docs
        return NextResponse.json(
          { error: 'File move not supported for BigWarp' },
          { status: 400 }
        );
      
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
    if (provider === 'streamtape') {
      success = data.status === 200;
    } else if (provider === 'vidguard') {
      success = data.msg === "Done" && data.status === 200;
    }

    if (!success) {
      return NextResponse.json(
        { error: data.msg || 'Move failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('File move error:', error);
    return NextResponse.json(
      { error: 'Failed to move file' },
      { status: 500 }
    );
  }
}
