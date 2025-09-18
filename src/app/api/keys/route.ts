import { NextRequest, NextResponse } from 'next/server';
import { getKeyStatus, setApiKey, deleteApiKey, isAllowedProvider, ALLOWED_PROVIDERS } from '@/lib/keyStorage';

export async function GET() {
  try {
    const status = await getKeyStatus();
    return NextResponse.json({ success: true, providers: status });
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

    await setApiKey(provider, key);
    
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
    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    if (!isAllowedProvider(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Allowed providers: ${ALLOWED_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    await deleteApiKey(provider);
    
    return NextResponse.json({ 
      success: true, 
      message: `API key for ${provider} deleted successfully`,
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
