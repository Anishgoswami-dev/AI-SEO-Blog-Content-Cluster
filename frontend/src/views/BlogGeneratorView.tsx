import React, { useState, useEffect } from 'react';
import { Project, Outline, Article } from '../types';
import { api } from '../services/api';
import { Sparkles, PenTool, Layers, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface BlogGeneratorViewProps {
  activeProject: Project | null;
  initialKeyword?: string;
  initialOutline?: Outline | null;
  onArticleGenerated: (article: Article) => void;
}

export const BlogGeneratorView: React.FC<BlogGeneratorViewProps> = ({
  activeProject,
  initialKeyword,
  initialOutline,
  onArticleGenerated,
}) => {
  const [primaryKw, setPrimaryKw] = useState(initialKeyword || '');
  const [targetLength, setTargetLength] = useState<'short' | 'standard' | 'detailed'>('standard');
  const [brandVoice, setBrandVoice] = useState('Authoritative & Helpful');
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [selectedOutlineId, setSelectedOutlineId] = useState<number | undefined>(initialOutline?.id);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialKeyword) setPrimaryKw(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    if (initialOutline) {
      setSelectedOutlineId(initialOutline.id);
      if (initialOutline.primary_keyword) setPrimaryKw(initialOutline.primary_keyword);
    }
  }, [initialOutline]);

  useEffect(() => {
    if (!activeProject) return;
    api.getProjectOutlines(activeProject.id)
      .then(setOutlines)
      .catch((err) => console.error(err));
  }, [activeProject?.id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryKw.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const chosenOutline = outlines.find((o) => o.id === selectedOutlineId);
      const article = await api.generateArticle({
        primary_keyword: primaryKw.trim(),
        outline: chosenOutline ? chosenOutline : undefined,
        outline_id: selectedOutlineId,
        target_length: targetLength,
        brand_voice: brandVoice,
        project_id: activeProject?.id,
        save_to_project: true,
      });

      onArticleGenerated(article);
    } catch (err: any) {
      setError(err.message || 'Article generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
          Long-Form AI Blog Generator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Produce publication-ready, deeply helpful long-form articles adhering to Google search intent guidelines. Includes title tags, slug, meta descriptions, H1–H3 hierarchy, FAQs, image alt-text concepts, and JSON-LD schema.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-8 shadow-xs">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-4 text-xs">
            {/* Primary Keyword */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Primary Target Keyword *
              </label>
              <input
                type="text"
                required
                value={primaryKw}
                onChange={(e) => setPrimaryKw(e.target.value)}
                placeholder="e.g. how much does website development cost"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] text-sm"
              />
            </div>

            {/* Attach Existing Outline (Optional) */}
            {outlines.length > 0 && (
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Attach Saved Outline (Optional)
                </label>
                <select
                  value={selectedOutlineId || ''}
                  onChange={(e) => setSelectedOutlineId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
                >
                  <option value="">-- No Outline (Generate fresh logical structure) --</option>
                  {outlines.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} ({o.sections?.length || 0} sections)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Length Radio Cards */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Target Content Depth & Length
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setTargetLength('short')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    targetLength === 'short'
                      ? 'border-[#6256D9] bg-[#F0EDFF] dark:bg-[#6256D9]/15 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Short Article</span>
                    <span className="text-[10px] font-mono font-medium text-slate-400">~600 words</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Concise answers for direct transactional or quick troubleshooting intent.
                  </p>
                </div>

                <div
                  onClick={() => setTargetLength('standard')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    targetLength === 'standard'
                      ? 'border-[#6256D9] bg-[#F0EDFF] dark:bg-[#6256D9]/15 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Standard Guide</span>
                    <span className="text-[10px] font-mono font-medium text-[#6256D9] font-bold">~1,000 words</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Balanced, authoritative guide for informational and commercial evaluation.
                  </p>
                </div>

                <div
                  onClick={() => setTargetLength('detailed')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    targetLength === 'detailed'
                      ? 'border-[#6256D9] bg-[#F0EDFF] dark:bg-[#6256D9]/15 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Detailed Pillar</span>
                    <span className="text-[10px] font-mono font-medium text-slate-400">~1,500+ words</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cornerstone pillar asset with deep examples, frameworks, and complete FAQs.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Voice */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Editorial Voice & Tone
              </label>
              <select
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              >
                <option value="Authoritative & Helpful">Authoritative & Helpful (Recommended for SEO)</option>
                <option value="Technical & Analytical">Technical & Analytical</option>
                <option value="Conversational & Engaging">Conversational & Engaging</option>
                <option value="Executive & Strategic">Executive & Strategic</option>
              </select>
            </div>
          </div>

          {/* Quality Safeguard Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold text-slate-800 dark:text-white block">
                RankCraft Editorial Quality Safeguards
              </strong>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Generated drafts prioritize genuine reader utility over keyword repetition. The engine avoids fabricated statistics, avoids doorway page patterns, and generates structured FAQ & image metadata ready for the editor.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={generating || !primaryKw.trim()}
              className="px-6 py-3 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Drafting Long-Form Article...' : 'Generate Full SEO Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
