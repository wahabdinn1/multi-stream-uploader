import { NextResponse } from 'next/server';

// Define allowed providers directly in the API route
const ALLOWED_PROVIDERS = [
  'doodstream',
  'streamtape', 
  'vidguard',
  'bigwarp'
];

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    providers: ALLOWED_PROVIDERS 
  });
}
