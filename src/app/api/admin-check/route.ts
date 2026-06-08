import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nidora_admin_session')?.value;
  const isAdmin = token === 'secure_admin_token_2026';
  
  return NextResponse.json({ isAdmin });
}
