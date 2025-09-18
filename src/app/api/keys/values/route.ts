import { NextResponse } from 'next/server';
import { getApiKey, ALLOWED_PROVIDERS } from '@/lib/keyStorage';

export async function GET() {
  try {
    const keys: Record<string, string | null> = {};
    
    for (const provider of ALLOWED_PROVIDERS) {
      try {
        const key = await getApiKey(provider);
        keys[provider] = key || null;
      } catch (error) {
        keys[provider] = null;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      keys 
    });
  } catch (error) {
    console.error('Error getting API keys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get API keys' },
      { status: 500 }
    );
  }
}
