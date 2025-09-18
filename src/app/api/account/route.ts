import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/providers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get API keys from Prisma database
    const providerKeys = await prisma.providerKey.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        apiKey: true,
      }
    });

    const accounts: Record<string, any> = {};
    
    // Get account info for each configured provider
    for (const keyRecord of providerKeys) {
      const { provider, apiKey } = keyRecord;
      if (apiKey) {
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
