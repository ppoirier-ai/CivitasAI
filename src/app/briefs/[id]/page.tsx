'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Loader2, Eye, FileText, Calendar, Tag, Users, Clock, ShoppingCart, Video, TrendingUp, DollarSign, BarChart3, Target, Gauge } from 'lucide-react';
import Link from 'next/link';
import type { VentureBrief, Approval } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAdminGuard } from '@/lib/auth';

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabase();
  const { allowed, loading: guardLoading } = useAdminGuard();
  const [brief, setBrief] = useState<VentureBrief | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { if (allowed) loadData(); }, [id, allowed]);

  async function loadData() {
    const { data: b } = await supabase.from('venture_briefs').select('*').eq('id', id).single();
    if (b) setBrief(b as VentureBrief);
    const { data: a } = await supabase.from('approvals').select('*').eq('brief_id', id).order('created_at', { ascending: true });
    if (a) setApprovals(a as Approval[]);
    setLoading(false);
  }

  const steps = [
    { key: 'draft', label: 'Draft', desc: 'Write content in Google Docs' },
    { key: 'draft_ready', label: 'Review', desc: 'Approve draft content' },
    { key: 'generating_cover', label: 'Cover', desc: 'Generate cover image' },
    { key: 'cover_ready', label: 'Review', desc: 'Approve cover design' },
    { key: 'generating_pdf', label: 'PDF', desc: 'Assemble document' },
    { key: 'pdf_ready', label: 'Review', desc: 'Approve final PDF' },
    { key: 'published', label: 'Live', desc: 'Published' },
  ];

  const ci = brief ? STATUS_ORDER.indexOf(brief.status) : -1;

  async function runAction(action: string, apiCall?: () => Promise<Response>) {
    setActionLoading(action);
    const { data: { user } } = await supabase.auth.getUser();

    if (action === 'mark_draft_ready') {
      await supabase.from('venture_briefs').update({ status: 'draft_ready' }).eq('id', id);
      if (brief?.google_doc_url) {
        await supabase.from('approvals').insert({ brief_id: id, step: 'draft_complete', approved: false, approved_by: user?.id ?? null });
      }
    } else if (action === 'approve_draft') {
      await supabase.from('approvals').update({ approved: true, approved_by: user?.id ?? null, approved_at: new Date().toISOString() }).eq('brief_id', id).eq('step', 'draft_complete');
      await supabase.from('venture_briefs').update({ status: 'generating_cover' }).eq('id', id);
    } else if (action === 'approve_cover') {
      await supabase.from('approvals').update({ approved: true, approved_by: user?.id ?? null, approved_at: new Date().toISOString() }).eq('brief_id', id).eq('step', 'cover_ready');
      await supabase.from('venture_briefs').update({ status: 'generating_pdf' }).eq('id', id);
    } else if (action === 'approve_pdf') {
      await supabase.from('approvals').update({ approved: true, approved_by: user?.id ?? null, approved_at: new Date().toISOString() }).eq('brief_id', id).eq('step', 'pdf_ready');
      await supabase.from('venture_briefs').update({ status: 'published' }).eq('id', id);
    } else if (action === 'reject') {
      // handled separately
    }

    if (apiCall) {
      const res = await apiCall();
      if (res.ok) loadData();
    }
    loadData();
    setActionLoading(null);
  }

  async function rejectStep(step: string) {
    const notes = prompt('Rejection reason:');
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('approvals').insert({ brief_id: id, step, approved: false, approved_by: user?.id ?? null, notes });
    const revert = { draft_complete: 'draft', cover_ready: 'draft_ready', pdf_ready: 'pdf_ready' };
    await supabase.from('venture_briefs').update({ status: revert[step as keyof typeof revert] || 'draft' }).eq('id', id);
    loadData();
  }

  if (loading || guardLoading) return <div className="flex items-center justify-center py-32"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" /></div>;
  if (!brief) return <div className="text-center py-20"><p className="text-gray-500">Brief not found</p><Link href="/" className="text-[#2EC4C6] text-sm hover:underline mt-2 inline-block">Back to Dashboard</Link></div>;

  const detailItems = [
    { icon: Tag, label: 'Topic', value: brief.topic || 'Not specified' },
    { icon: Users, label: 'Target Customer', value: brief.target_customer || 'Not specified' },
    { icon: Calendar, label: 'Scheduled', value: brief.scheduled_date ? formatDate(brief.scheduled_date) : 'Not scheduled' },
    { icon: Clock, label: 'Created', value: formatDate(brief.created_at) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight truncate">{brief.title}</h1>
              {brief.subtitle && <p className="text-sm text-gray-500 mt-0.5">{brief.subtitle}</p>}
            </div>
            <Badge className={`text-[11px] h-5 px-2.5 font-medium rounded-full border-0 shrink-0 ${STATUS_COLORS[brief.status]} text-white`}>
              {STATUS_LABELS[brief.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card className="bg-gray-900/40 border-gray-800/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    i < ci ? 'bg-[#2EC4C6] text-black' : i === ci ? 'bg-[#2EC4C6] text-black ring-2 ring-[#2EC4C6]/40' : 'bg-gray-800 text-gray-600'
                  }`}>
                    {i < ci ? '✓' : i + 1}
                  </div>
                  <span className={`text-[9px] mt-1.5 whitespace-nowrap ${i === ci ? 'text-[#2EC4C6] font-medium' : 'text-gray-600'}`}>
                    {s.desc}
                  </span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 ${i < ci ? 'bg-[#2EC4C6]' : 'bg-gray-800'}`} />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="bg-gray-900/40 border-gray-800/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white tracking-tight">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brief.status === 'draft' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">Write your brief in Google Docs, paste the link, then mark as complete to start the review process.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => runAction('mark_draft_ready')} disabled={actionLoading === 'mark_draft_ready' || !brief.google_doc_url}
                      className="bg-blue-500/80 hover:bg-blue-500 text-white h-8 text-xs rounded-lg">
                      {actionLoading === 'mark_draft_ready' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                      Mark Draft Complete
                    </Button>
                    {!brief.google_doc_url && <span className="text-[10px] text-amber-400/80">Add a Google Doc URL first</span>}
                  </div>
                </div>
              )}

              {brief.status === 'draft_ready' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">Review the draft. Approve to start cover generation, or reject with feedback.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {brief.google_doc_url && (
                      <a href={brief.google_doc_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="border-gray-700/50 text-gray-400 h-8 text-xs rounded-lg">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open Doc
                        </Button>
                      </a>
                    )}
                    <Button onClick={() => runAction('approve_draft', () => fetch('/api/generate-cover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ briefId: id }) }))} disabled={actionLoading === 'approve_draft'}
                      className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black h-8 text-xs rounded-lg">
                      {actionLoading === 'approve_draft' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                      Approve Draft
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => rejectStep('draft_complete')} className="text-red-400/70 hover:text-red-400 h-8 text-xs">
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />Reject
                    </Button>
                  </div>
                </div>
              )}

              {brief.status === 'generating_cover' && (
                <div className="flex items-center gap-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2EC4C6]" />
                  <p className="text-xs text-gray-500">Generating cover image with AI...</p>
                </div>
              )}

              {brief.status === 'cover_ready' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">The cover image is ready. Approve it to continue to PDF assembly.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => runAction('approve_cover', () => fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ briefId: id }) }))}
                      disabled={actionLoading === 'approve_cover'}
                      className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black h-8 text-xs rounded-lg">
                      {actionLoading === 'approve_cover' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                      Approve Cover
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => rejectStep('cover_ready')} className="text-red-400/70 hover:text-red-400 h-8 text-xs">
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />Reject
                    </Button>
                  </div>
                </div>
              )}

              {brief.status === 'generating_pdf' && (
                <div className="flex items-center gap-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2EC4C6]" />
                  <p className="text-xs text-gray-500">Assembling PDF document...</p>
                </div>
              )}

              {brief.status === 'pdf_ready' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">The final PDF is ready. Approve to publish, or reject to revise.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {brief.pdf_url && (
                      <a href={brief.pdf_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="border-gray-700/50 text-gray-400 h-8 text-xs rounded-lg">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />Preview
                        </Button>
                      </a>
                    )}
                    <Button onClick={() => runAction('approve_pdf')} disabled={actionLoading === 'approve_pdf'}
                      className="bg-emerald-500/80 hover:bg-emerald-500 text-white h-8 text-xs rounded-lg">
                      {actionLoading === 'approve_pdf' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                      Publish
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => rejectStep('pdf_ready')} className="text-red-400/70 hover:text-red-400 h-8 text-xs">
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />Reject
                    </Button>
                  </div>
                </div>
              )}

              {brief.status === 'published' && (
                <div className="flex items-center gap-2 text-emerald-400/80">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Published</span>
                  {brief.pdf_url && (
                    <a href={brief.pdf_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="border-gray-700/50 text-gray-400 h-7 text-[10px] rounded-lg ml-2">
                        <Eye className="w-3 h-3 mr-1" />View PDF
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Preview */}
          {brief.cover_image_url && (
            <Card className="bg-gray-900/40 border-gray-800/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white tracking-tight">Cover Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={brief.cover_image_url} alt={`Cover for ${brief.title}`}
                  className="w-full max-w-xs rounded-lg border border-gray-800/60" />
              </CardContent>
            </Card>
          )}

          {/* Venture Brief Requirements */}
          {(brief.problem_solution || brief.tam || brief.cagr) && (
            <Card className="bg-gray-900/40 border-gray-800/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white tracking-tight">Venture Brief Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {brief.problem_solution && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Problem & Solution</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{brief.problem_solution}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {brief.tam && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <BarChart3 className="w-4 h-4 text-[#2EC4C6]/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">TAM</p>
                      <p className="text-xs text-gray-200 font-medium">{brief.tam}</p>
                    </div>
                  )}
                  {brief.sam && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <Target className="w-4 h-4 text-blue-400/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">SAM</p>
                      <p className="text-xs text-gray-200 font-medium">{brief.sam}</p>
                    </div>
                  )}
                  {brief.som && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <Target className="w-4 h-4 text-purple-400/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">SOM</p>
                      <p className="text-xs text-gray-200 font-medium">{brief.som}</p>
                    </div>
                  )}
                  {brief.cagr && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">CAGR</p>
                      <p className="text-xs text-emerald-300 font-medium">{brief.cagr}</p>
                    </div>
                  )}
                  {brief.capital_required && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <DollarSign className="w-4 h-4 text-amber-400/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Capital Required</p>
                      <p className="text-xs text-amber-300 font-medium">{brief.capital_required}</p>
                    </div>
                  )}
                  {brief.roi && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <Gauge className="w-4 h-4 text-blue-400/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">ROI</p>
                      <p className="text-xs text-blue-300 font-medium">{brief.roi}</p>
                    </div>
                  )}
                  {brief.profit_margin && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <TrendingUp className="w-4 h-4 text-green-400/60 mb-1" />
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Expected Margin</p>
                      <p className="text-xs text-green-300 font-medium">{brief.profit_margin}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marketplace Links */}
          {(brief.purchase_url || brief.video_url) && (
            <Card className="bg-gray-900/40 border-gray-800/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white tracking-tight">Marketplace</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {brief.purchase_url && (
                  <a href={brief.purchase_url} target="_blank" rel="noreferrer">
                    <Button className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black h-8 text-xs rounded-lg font-medium">
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Purchase Venture Brief
                    </Button>
                  </a>
                )}
                {brief.video_url && (
                  <a href={brief.video_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="border-gray-700/50 text-gray-400 h-8 text-xs rounded-lg">
                      <Video className="w-3.5 h-3.5 mr-1.5" />Watch Related Video
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="bg-gray-900/40 border-gray-800/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white tracking-tight">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {detailItems.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3 h-3" />{label}
                  </p>
                  <p className="text-xs text-gray-300">{value}</p>
                </div>
              ))}
              <Separator className="bg-gray-800/50" />
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                  <ExternalLink className="w-3 h-3" />Google Doc
                </p>
                {brief.google_doc_url ? (
                  <a href={brief.google_doc_url} target="_blank" rel="noreferrer" className="text-xs text-[#2EC4C6] hover:underline flex items-center gap-1">
                    Open Document <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : <p className="text-xs text-gray-600">Not linked</p>}
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card className="bg-gray-900/40 border-gray-800/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white tracking-tight">Approvals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {approvals.length === 0
                ? <p className="text-xs text-gray-600">No approval activity yet</p>
                : approvals.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      {a.approved
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400/80 mt-0.5 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400/60 mt-0.5 shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="text-xs text-gray-300 capitalize leading-tight">{a.step.replace(/_/g, ' ')} {a.approved ? 'approved' : 'rejected'}</p>
                        {a.notes && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{a.notes}</p>}
                        <p className="text-[9px] text-gray-700 mt-0.5">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
