import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

/**
 * Daily cron job that processes venture briefs scheduled for today.
 * Triggered by Vercel Cron Jobs or external scheduler.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
      }
    );

    const today = new Date().toISOString().split('T')[0];

    // Find briefs scheduled for today
    const { data: briefs } = await supabase
      .from('venture_briefs')
      .select('*')
      .eq('scheduled_date', today)
      .not('status', 'eq', 'published');

    const results: { id: string; title: string; status: string }[] = [];

    for (const brief of briefs || []) {
      try {
        // If draft and has Google Doc URL, mark as ready
        if (brief.status === 'draft' && brief.google_doc_url) {
          await supabase
            .from('venture_briefs')
            .update({ status: 'draft_ready' })
            .eq('id', brief.id);
          results.push({ id: brief.id, title: brief.title, status: 'advanced_to_ready' });
        } else {
          results.push({ id: brief.id, title: brief.title, status: brief.status });
        }
      } catch (err) {
        results.push({ id: brief.id, title: brief.title, status: 'error' });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      date: today,
      results,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
