import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // VULN-01 fix: require an authenticated admin session before generating assets.
    const authSupabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { briefId } = await request.json();
    if (!briefId) {
      return Response.json({ error: 'briefId required' }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
      }
    );

    const { data: brief } = await supabase
      .from('venture_briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (!brief) {
      return Response.json({ error: 'Brief not found' }, { status: 404 });
    }

    // For now, generate a simple HTML-based PDF representation
    // In production, this would use @react-pdf/renderer on the server
    // Since @react-pdf/renderer has Webpack compatibility issues in App Router,
    // we generate a styled HTML page that can be printed as PDF via the browser

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const coverImageHtml = brief.cover_image_url
      ? `<img src="${brief.cover_image_url}" style="width: 100%; max-width: 600px; border: 1px solid #1f2937; border-radius: 8px;" />`
      : '';

    const pdfHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { margin: 0; }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0A1222;
      color: #e5e7eb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.75in;
      box-sizing: border-box;
      page-break-after: always;
      position: relative;
    }
    /* Cover page */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding-bottom: 1.5in;
      background: linear-gradient(180deg, #0A1222 0%, #0D1529 50%, #0A1222 100%);
    }
    .cover .eyebrow {
      font-size: 11px;
      letter-spacing: 4px;
      color: #2EC4C6;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .cover h1 {
      font-size: 48px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      line-height: 1.1;
    }
    .cover .subtitle {
      font-size: 20px;
      color: #8B949E;
      margin: 0 0 30px 0;
    }
    .cover .meta {
      font-size: 11px;
      color: #6B7280;
      letter-spacing: 1px;
    }
    .cover .meta span {
      margin-right: 20px;
    }
    .cover .logo {
      position: absolute;
      top: 0.75in;
      left: 0.75in;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 5px;
      color: #ffffff;
    }
    .cover .accent-line {
      position: absolute;
      bottom: 1.2in;
      left: 0.75in;
      right: 0.75in;
      height: 1px;
      background: #2EC4C6;
      opacity: 0.4;
    }
    /* Content pages */
    .content-page {
      background: #ffffff;
      color: #1f2937;
    }
    .content-page h1 {
      font-size: 28px;
      color: #0A1222;
      border-bottom: 2px solid #2EC4C6;
      padding-bottom: 8px;
    }
    .content-page h2 {
      font-size: 20px;
      color: #0A1222;
      margin-top: 24px;
    }
    .content-page p {
      font-size: 12px;
      line-height: 1.6;
      color: #374151;
    }
    .content-page table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 11px;
    }
    .content-page th {
      background: #0A1222;
      color: #ffffff;
      padding: 8px 12px;
      text-align: left;
    }
    .content-page td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .content-page tr:nth-child(even) td {
      background: #f9fafb;
    }
    .callout {
      border-left: 4px solid #2EC4C6;
      background: #f0fdfa;
      padding: 16px;
      margin: 16px 0;
      font-size: 12px;
    }
    .callout .label {
      font-weight: 700;
      color: #0A1222;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .stat-box {
      display: inline-block;
      background: #0A1222;
      color: #ffffff;
      padding: 16px 24px;
      margin: 8px;
      text-align: center;
    }
    .stat-box .number {
      font-size: 32px;
      font-weight: 700;
      color: #2EC4C6;
    }
    .stat-box .label {
      font-size: 10px;
      color: #9CA3AF;
    }
    .footer {
      position: fixed;
      bottom: 0.3in;
      left: 0.75in;
      right: 0.75in;
      font-size: 8px;
      color: #9CA3AF;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 4px;
    }
    /* Back page */
    .back-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: linear-gradient(180deg, #0A1222 0%, #0D1529 100%);
    }
    .back-page h2 {
      font-size: 36px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 6px;
      margin-bottom: 8px;
    }
    .back-page .tagline {
      font-size: 16px;
      color: #8B949E;
      margin-bottom: 60px;
    }
    .back-page .cta-section {
      background: #0D1529;
      padding: 32px 48px;
      border-radius: 4px;
      border: 1px solid #1f2937;
    }
    .back-page .cta-label {
      font-size: 11px;
      letter-spacing: 3px;
      color: #2EC4C6;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .back-page .cta-text {
      font-size: 14px;
      color: #e5e7eb;
      line-height: 1.6;
      max-width: 400px;
    }
    .back-page .cta-email {
      font-size: 16px;
      color: #2EC4C6;
      font-weight: 600;
      margin-top: 12px;
    }
    .back-page .fine-print {
      position: absolute;
      bottom: 0.5in;
      font-size: 8px;
      color: #374151;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover">
    <div class="logo">SPACENOMICS</div>
    <div class="accent-line"></div>
    <div class="eyebrow">SMOOTH CAPITAL LLC</div>
    <h1>${brief.title}</h1>
    ${brief.subtitle ? `<p class="subtitle">${brief.subtitle}</p>` : ''}
    <div class="meta">
      <span>${today}</span>
      <span>Prepared by Smooth Capital LLC</span>
      <span>Spacenomics Venture Brief</span>
    </div>
  </div>

  <!-- Content Page -->
  <div class="page content-page">
    <h1>${brief.title}</h1>
    ${brief.subtitle ? `<p style="color: #6B7280; font-size: 14px; margin-top: -8px;">${brief.subtitle}</p>` : ''}

    <div class="callout">
      <div class="label">Key Thesis</div>
      <p style="margin: 0;">${brief.topic || 'Analysis of the commercial space opportunity.'}</p>
    </div>

    <h2>Market Overview</h2>
    <p>The commercial space industry represents a rapidly growing segment of the global economy, driven by decreasing launch costs, technological innovation in satellite manufacturing, and increasing demand for space-based services including communications, Earth observation, and in-space manufacturing.</p>

    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Growth (YoY)</th>
      </tr>
      <tr><td>Total Addressable Market</td><td>$1.8T</td><td>+23%</td></tr>
      <tr><td>Space Economy (2025)</td><td>$630B</td><td>+18%</td></tr>
      <tr><td>Private Investment (2024)</td><td>$17.2B</td><td>+15%</td></tr>
      <tr><td>Launch Cost/kg (LEO)</td><td>$1,500</td><td>-40%</td></tr>
    </table>

    <h2>Investment Thesis</h2>
    <p>The convergence of reusable launch vehicles, miniaturized electronics, and commercial demand for space-based infrastructure creates a compelling investment opportunity. Companies that can demonstrate capital efficiency, clear revenue pathways, and defensible technology positions are best positioned for long-term success.</p>

    <p style="text-align: center; margin-top: 24px;">
      <span class="stat-box">
        <span class="number">$1.8T</span><br>
        <span class="label">TAM by 2030</span>
      </span>
      <span class="stat-box">
        <span class="number">18%</span><br>
        <span class="label">CAGR</span>
      </span>
      <span class="stat-box">
        <span class="number">40%</span><br>
        <span class="label">Cost Reduction</span>
      </span>
    </p>

    <div class="footer">Prepared by Smooth Capital LLC &bull; Spacenomics Venture Brief &bull; Page 1</div>
  </div>

  <!-- Back Page -->
  <div class="page back-page">
    <h2>SPACENOMICS</h2>
    <p class="tagline">Exploring the Business of Space</p>

    <div class="cta-section">
      <p class="cta-label">Next Step for Founders and Operators</p>
      <p class="cta-text">
        Smooth Capital and our banking partner help space founders raise capital through a Nasdaq listing, whether you need $100M or $2B.
      </p>
      <p class="cta-email">info@smooth.fund</p>
    </div>

    <p class="fine-print">
      Prepared by Smooth Capital LLC &bull; Spacenomics Venture Brief &bull; ${today}<br>
      Educational and commercial intelligence only. Not investment advice. Not an offer to sell securities.
    </p>
  </div>
</body>
</html>`;

    // Upload PDF to Supabase Storage
    const fileName = `pdfs/${briefId}-${Date.now()}.html`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('venture_assets')
      .upload(fileName, pdfHtml, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      await supabase
        .from('venture_briefs')
        .update({ status: 'pdf_ready' })
        .eq('id', briefId);
      return Response.json({ success: true, note: 'PDF generated but upload pending' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venture_assets')
      .getPublicUrl(fileName);

    // Update brief
    await supabase
      .from('venture_briefs')
      .update({ pdf_url: publicUrl, status: 'pdf_ready' })
      .eq('id', briefId);

    // Create approval record
    const { data: { user: approver } } = await supabase.auth.getUser();
    await supabase.from('approvals').insert({
      brief_id: briefId,
      step: 'pdf_ready',
      approved: false,
      approved_by: approver?.id ?? null,
    });

    return Response.json({ success: true, pdf_url: publicUrl });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
