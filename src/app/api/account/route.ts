import { NextRequest, NextResponse } from 'next/server';
import { readApiKeys } from '@/lib/keyStorage';
import { getProvider } from '@/lib/providers';

export async function GET(request: NextRequest) {
  try {
    const apiKeys = await readApiKeys();
    const accounts: Record<string, any> = {};
    
    // Get account info for each configured provider
    for (const [provider, key] of Object.entries(apiKeys)) {
      if (key) {
        try {
          const providerInstance = getProvider(provider as any);
          const accountInfo = await providerInstance.getAccountInfo();
          accounts[provider] = accountInfo;
        } catch (error) {
          console.error(`Error getting account info for ${provider}:`, error);
          accounts[provider] = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Error in account API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch account information'
      },
      { status: 500 }
    );
  }
}
