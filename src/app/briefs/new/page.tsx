'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useAdminGuard } from '@/lib/auth';

const VIDEO_TOPIC_CATEGORIES = [
  'Foundational / Cross-Cutting',
  'Launch & Transportation',
  'Existing Space Businesses',
  'Space Hardware & Components',
  'Near-Term Business Opportunities',
  'Frontier / Long-Term',
  'Policy, Regulation & Finance',
];

export default function NewBriefPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const { allowed, loading: guardLoading } = useAdminGuard();
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    topic: '',
    target_customer: '',
    summary: '',
    problem_solution: '',
    tam: '',
    sam: '',
    som: '',
    cagr: '',
    capital_required: '',
    profit_margin: '',
    category: '',
    purchase_url: '',
    video_url: '',
    google_doc_url: '',
    scheduled_date: '',
    tags: [] as string[],
  });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm({ ...form, tags: [...form.tags, t] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('venture_briefs')
      .insert({
        title: form.title,
        subtitle: form.subtitle || null,
        topic: form.topic || null,
        target_customer: form.target_customer || null,
        summary: form.summary || null,
        problem_solution: form.problem_solution || null,
        tam: form.tam || null,
        sam: form.sam || null,
        som: form.som || null,
        cagr: form.cagr || null,
        capital_required: form.capital_required || null,
        profit_margin: form.profit_margin || null,
        category: form.category || null,
        purchase_url: form.purchase_url || null,
        video_url: form.video_url || null,
        google_doc_url: form.google_doc_url || null,
        scheduled_date: form.scheduled_date || null,
        tags: form.tags,
        is_public: true,
        created_by: userId,
        status: 'draft',
      })
      .select('id')
      .single();

    setSaving(false);
    if (error) { alert(error.message); return; }
    router.push(`/briefs/${data!.id}`);
  };

  const fields = [
    { section: 'Basic Info', fields: [
      { id: 'title', label: 'Title', required: true, placeholder: 'e.g., ZBLAN Optical Fiber' },
      { id: 'subtitle', label: 'Subtitle', required: false, placeholder: 'e.g., The First Killer App for In-Space Manufacturing' },
      { id: 'category', label: 'Category (Video Topic Area)', required: false, placeholder: 'Select a category...', component: 'select' },
      { id: 'summary', label: 'One-Liner Summary', required: false, placeholder: 'A single sentence describing the opportunity (shown in marketplace cards)', component: 'textarea2' as const },
    ]},
    { section: 'Venture Brief Requirements', fields: [
      { id: 'problem_solution', label: 'Problem & Solution', required: false, placeholder: 'Describe the problem and your proposed solution', component: 'textarea4' as const },
      { id: 'tam', label: 'TAM (Total Addressable Market)', required: false, placeholder: 'e.g., $180B global fiber optic market' },
      { id: 'sam', label: 'SAM (Serviceable Addressable Market)', required: false, placeholder: 'e.g., $12B long-haul undersea fiber' },
      { id: 'som', label: 'SOM (Serviceable Obtainable Market)', required: false, placeholder: 'e.g., $2.8B by 2031' },
      { id: 'cagr', label: 'CAGR (Growth over 5 years)', required: false, placeholder: 'e.g., 45% CAGR over next 5 years' },
      { id: 'capital_required', label: 'Capital Required', required: false, placeholder: 'e.g., $45M for initial manufacturing capacity' },
      { id: 'profit_margin', label: 'Expected Profit Margin', required: false, placeholder: 'e.g., 65-75% gross margin' },
    ]},
    { section: 'Marketplace', fields: [
      { id: 'purchase_url', label: 'Purchase URL', required: false, placeholder: 'https://smooth.fund/venture-briefs/...' },
      { id: 'video_url', label: 'Related Video URL', required: false, placeholder: 'https://youtube.com/watch?v=...' },
    ]},
    { section: 'Internal', fields: [
      { id: 'topic', label: 'Topic / Description (Internal)', required: false, placeholder: 'Detailed description of the market/technology', component: 'textarea' as const },
      { id: 'target_customer', label: 'Target Customer', required: false, placeholder: 'e.g., Space founders, investors, operators' },
      { id: 'google_doc_url', label: 'Google Doc URL (Draft)', required: false, placeholder: 'https://docs.google.com/document/d/...' },
      { id: 'scheduled_date', label: 'Scheduled Date', required: false, component: 'date' as const },
    ]},
  ];

  if (guardLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">New Venture Brief</h1>
          <p className="text-xs text-gray-500 mt-0.5">Fill in all sections to create a complete venture opportunity listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(({ section, fields: sectionFields }) => (
          <Card key={section} className="bg-gray-900/60 border-gray-800/50">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{section}</h2>
              {sectionFields.map(({ id, label, required = false, placeholder, component }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id} className="text-xs text-gray-400 font-medium">
                    {label}
                    {required && <span className="text-red-400 ml-0.5">*</span>}
                  </Label>
                  {component === 'textarea' ? (
                    <Textarea id={id} value={(form[id as keyof typeof form])} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      placeholder={placeholder} rows={3}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg focus:border-[#2EC4C6]/50 resize-none" />
                  ) : component === 'textarea2' ? (
                    <Textarea id={id} value={(form[id as keyof typeof form])} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      placeholder={placeholder} rows={2}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg focus:border-[#2EC4C6]/50 resize-none" />
                  ) : component === 'textarea4' ? (
                    <Textarea id={id} value={(form[id as keyof typeof form])} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      placeholder={placeholder} rows={4}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg focus:border-[#2EC4C6]/50 resize-none" />
                  ) : component === 'date' ? (
                    <Input id={id} type="date" value={(form[id as keyof typeof form])} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm rounded-lg h-9 focus:border-[#2EC4C6]/50" />
                  ) : component === 'select' ? (
                    <select id={id} value={(form[id as keyof typeof form])} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      className="w-full bg-gray-800/60 border border-gray-700/50 text-white text-sm rounded-lg h-9 px-3 focus:border-[#2EC4C6]/50 focus:outline-none">
                      <option value="" className="bg-gray-800">{placeholder}</option>
                      {VIDEO_TOPIC_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <Input id={id} value={(form[id as keyof typeof form])} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      placeholder={placeholder}
                      className="bg-gray-800/60 border-gray-700/50 text-white text-sm placeholder:text-gray-600 rounded-lg h-9 focus:border-[#2EC4C6]/50" />
                  )}
                </div>
              ))}

              {/* Tags - shown in Basic Info section */}
              {section === 'Basic Info' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 text-[10px] bg-[#2EC4C6]/10 text-[#2EC4C6]/80 px-2 py-0.5 rounded-full">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-white">&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Add a tag and press Enter"
                      className="bg-gray-800/60 border-gray-700/50 text-white text-xs placeholder:text-gray-600 rounded-lg h-8 flex-1 focus:border-[#2EC4C6]/50" />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}
                      className="border-gray-700/50 text-gray-400 h-8 text-xs rounded-lg">Add</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <div className="flex items-center justify-end gap-2.5">
          <Link href="/">
            <Button type="button" variant="ghost" size="sm" className="text-gray-500 hover:text-white h-9 text-sm">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving || !form.title}
            className="bg-[#2EC4C6] hover:bg-[#28B0B2] text-black font-medium h-9 px-5 text-sm rounded-lg disabled:opacity-40 transition-all active:scale-[0.97]">
            {saving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-black border-t-transparent mr-1.5" />
            ) : <Plus className="w-4 h-4 mr-1.5" />}
            Create Brief
          </Button>
        </div>
      </form>
    </div>
  );
}
