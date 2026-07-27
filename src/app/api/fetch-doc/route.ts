import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return Response.json({ error: 'url required' }, { status: 400 });
    }

    // Extract document ID from Google Docs URL
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return Response.json({ error: 'Invalid Google Docs URL' }, { status: 400 });
    }

    const docId = match[1];

    // For now, return a placeholder since Google Docs API needs OAuth setup
    // Once Google OAuth is configured in Supabase, we'll use the user's access token
    return Response.json({
      success: true,
      docId,
      content: 'Google Docs API integration pending. Configure Google OAuth in Supabase Auth providers to enable document fetching.',
      note: 'Document ID extracted. Full content fetching requires Google Docs API enabled and OAuth scopes configured.',
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
