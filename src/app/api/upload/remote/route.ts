import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';
import { readApiKeys } from '@/lib/keyStorage';

export async function POST(request: NextRequest) {
  try {
    const { url, providers } = await request.json();

    if (!url || !providers || !Array.isArray(providers) || providers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'URL and providers are required'
      }, { status: 400 });
    }

    // Check if API keys are configured for selected providers
    const apiKeys = await readApiKeys();
    const missingKeys = providers.filter(providerName => !apiKeys[providerName]);
    
    if (missingKeys.length > 0) {
      return NextResponse.json({
        success: false,
        error: `API keys not configured for: ${missingKeys.join(', ')}`
      }, { status: 400 });
    }

    const results = [];

    // Upload to each provider
    for (const providerName of providers) {
      try {
        const provider = getProvider(providerName);
        if (!provider) {
          results.push({
            provider: providerName,
            success: false,
            error: 'Provider not found'
          });
          continue;
        }

        console.log(`Starting remote upload to ${providerName} for URL: ${url}`);
        
        const result = await provider.uploadRemote(url);
        results.push(result);

        console.log(`Remote upload result for ${providerName}:`, result);
      } catch (error) {
        console.error(`Remote upload error for ${providerName}:`, error);
        results.push({
          provider: providerName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const hasSuccess = results.some(r => r.success);
    
    return NextResponse.json({
      success: hasSuccess,
      results,
      message: hasSuccess ? 'Remote upload completed' : 'All remote uploads failed'
    });

  } catch (error) {
    console.error('Remote upload API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
