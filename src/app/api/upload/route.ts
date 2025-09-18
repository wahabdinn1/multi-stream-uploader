import { NextRequest, NextResponse } from 'next/server';
import { getProvider, UploadResult } from '@/lib/providers';
import { isAllowedProvider, AllowedProvider } from '@/lib/keyStorage';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const providersParam = formData.get('providers') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!providersParam) {
      return NextResponse.json(
        { success: false, error: 'No providers specified' },
        { status: 400 }
      );
    }

    let providers: string[];
    try {
      providers = JSON.parse(providersParam);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid providers format' },
        { status: 400 }
      );
    }

    if (!Array.isArray(providers) || providers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Providers must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate providers
    for (const provider of providers) {
      if (!isAllowedProvider(provider)) {
        return NextResponse.json(
          { success: false, error: `Invalid provider: ${provider}` },
          { status: 400 }
        );
      }
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} has unsupported type: ${file.type}` },
          { status: 400 }
        );
      }
    }

    // Process uploads
    const results: Array<{
      filename: string;
      uploads: UploadResult[];
    }> = [];

    for (const file of files) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileResults: UploadResult[] = [];

      // Upload to each provider in parallel
      const uploadPromises = providers.map(async (providerName) => {
        try {
          const provider = getProvider(providerName as AllowedProvider);
          return await provider.upload(fileBuffer, file.name, {
            filename: file.name,
            description: `Uploaded via multi-provider uploader`,
          });
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: providerName,
          } as UploadResult;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      fileResults.push(...uploadResults);

      results.push({
        filename: file.name,
        uploads: fileResults,
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${files.length} file(s) with ${providers.length} provider(s)`,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during upload' },
      { status: 500 }
    );
  }
}
