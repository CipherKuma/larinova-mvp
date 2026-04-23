import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Test database query
    const { data: doctors, error } = await supabase
      .from('larinova_doctors')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      doctors,
      error: error ? error.message : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
