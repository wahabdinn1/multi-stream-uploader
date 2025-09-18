import { NextResponse } from 'next/server';
import { ALLOWED_PROVIDERS } from '@/lib/keyStorage';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    providers: ALLOWED_PROVIDERS 
  });
}
