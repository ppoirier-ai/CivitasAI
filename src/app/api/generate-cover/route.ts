import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { CoverJSX } from '@/components/cover-jsx';

// We need React for createElement since route handlers can't use JSX
import React from 'react';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // VULN-01 fix: require an authenticated admin session (edge-safe cookie read).
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user || (user.app_metadata?.role !== 'admin' && !isAdminEmail(user.email))) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { briefId } = await request.json();
    if (!briefId) {
      return Response.json({ error: 'briefId required' }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient();

    const { data: brief } = await supabase
      .from('venture_briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (!brief) {
      return Response.json({ error: 'Brief not found' }, { status: 404 });
    }

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const imageRes = new ImageResponse(
      React.createElement(CoverJSX, { brief, today }),
      {
        width: 1200,
        height: 1554,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );

    const imageBuffer = await imageRes.arrayBuffer();
    const fileName = `covers/${briefId}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('venture_assets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      // A3 fix: never report success when the asset did not land in storage.
      console.error('Upload error:', uploadError);
      await supabase.from('venture_briefs').update({ status: 'generating_cover' }).eq('id', briefId);
      return Response.json(
        { success: false, error: 'Cover upload failed. Please try again.' },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage.from('venture_assets').getPublicUrl(fileName);

    await supabase
      .from('venture_briefs')
      .update({ cover_image_url: publicUrl, status: 'cover_ready' })
      .eq('id', briefId);

    await supabase.from('approvals').insert({ brief_id: briefId, step: 'cover_ready', approved: false });

    return Response.json({ success: true, cover_url: publicUrl });
  } catch (error) {
    console.error('Cover generation error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
