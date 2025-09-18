import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, isAllowedProvider } from '@/lib/keyStorage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; id: string }> }
) {
  try {
    const { provider, id: fileId } = await params;

    if (!isAllowedProvider(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
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
        apiUrl = `https://doodapi.com/api/file/delete?key=${apiKey}&file_code=${fileId}`;
        break;
      
      case 'streamtape':
        const [login, key] = apiKey.split(':');
        if (!login || !key) {
          return NextResponse.json(
            { error: 'StreamTape API key must be in format "login:key"' },
            { status: 400 }
          );
        }
        apiUrl = `https://api.streamtape.com/file/delete?login=${login}&key=${key}&file=${fileId}`;
        break;
      
      case 'vidguard':
        apiUrl = `https://api.vidguard.to/v1/video/delete?key=${apiKey}&id=${fileId}`;
        break;
      
      case 'bigwarp':
        apiUrl = `https://bigwarp.io/api/file/delete?key=${apiKey}&file_code=${fileId}`;
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
        { error: data.msg || data.message || 'Failed to delete file' },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
