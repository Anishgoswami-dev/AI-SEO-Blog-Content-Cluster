import React, { useState, useEffect } from 'react';
import { Project, KeywordItem, SearchIntent } from '../types';
import { api } from '../services/api';
import {
  KeyRound, Search, Sparkles, Filter, Trash2, Network,
  Layers, AlertCircle, Info, Check, ArrowRight, ExternalLink
} from 'lucide-react';

interface KeywordResearchViewProps {
  activeProject: Project | null;
  onNavigate: (tab: any, params?: any) => void;
  onGenerateClusterFromKeyword: (kw: string) => void;
  onGenerateOutlineToKeyword: (kw: string) => void;
}

export const KeywordResearchView: React.FC<KeywordResearchViewProps> = ({
  activeProject,
  onNavigate,
  onGenerateClusterFromKeyword,
  onGenerateOutlineToKeyword,
}) => {
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [primaryKw, setPrimaryKw] = useState('');
  const [secondaryKws, setSecondaryKws] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'primary' | 'secondary' | 'long_tail' | 'question' | 'local'>('all');

  useEffect(() => {
    if (!activeProject) return;
    setLoading(true);
    api
      .getProjectKeywords(activeProject.id)
      .then(setKeywords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeProject?.id]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryKw.trim()) return;
    setAnalyzing(true);
    setError(null);

    try {
      const resp = await api.analyzeKeywords({
        primary_keyword: primaryKw.trim(),
        secondary_keywords: secondaryKws.split(',').map((s) => s.trim()).filter(Boolean),
        target_location: targetLocation.trim() || undefined,
        project_id: activeProject?.id,
        save_to_project: true,
      });

      // Reload project keywords
      if (activeProject) {
        const updated = await api.getProjectKeywords(activeProject.id);
        setKeywords(updated);
      } else {
        setKeywords(resp.keywords);
      }
      setPrimaryKw('');
      setSecondaryKws('');
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteKeyword = async (id?: number) => {
    if (!id) return;
    try {
      await api.deleteKeyword(id);
      setKeywords(keywords.filter((k) => k.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredKeywords = activeFilter === 'all'
    ? keywords
    : keywords.filter((k) => k.category === activeFilter);

  const getIntentBadge = (intent: SearchIntent) => {
    switch (intent) {
      case 'informational':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'commercial':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
      case 'transactional':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      case 'navigational':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
          Keyword Research & Search Intent
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Map buyer search intent, funnel stages, user queries, and editorial angles. Group keywords into actionable pillar and supporting topics.
        </p>
      </div>

      {/* Analysis Form Card */}
      <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Primary Target Keyword *
              </label>
              <input
                type="text"
                required
                value={primaryKw}
                onChange={(e) => setPrimaryKw(e.target.value)}
                placeholder="e.g. website development services"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div className="md:col-span-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Secondary Variations (Comma separated)
              </label>
              <input
                type="text"
                value={secondaryKws}
                onChange={(e) => setSecondaryKws(e.target.value)}
                placeholder="e.g. web design cost, custom website vs builder"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div className="md:col-span-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target Location (For Local Intent)
              </label>
              <input
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="e.g. Austin, TX or nationwide"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Info className="w-3.5 h-3.5 text-[#6256D9]" />
              <span>Generates intent hypotheses, user questions, funnel stages, and article angles.</span>
            </div>

            <button
              type="submit"
              disabled={analyzing || !primaryKw.trim()}
              className="px-5 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Analyzing Intent...' : 'Analyze & Map Keywords'}
            </button>
          </div>
        </form>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Data Accuracy Transparency:</strong> In accordance with RankCraft AI guidelines, search volume and keyword difficulty metrics are labeled as <em>"Live Volume Requires Search API"</em> unless connected to an approved Search Console or third-party keyword API. RankCraft AI never fabricates fake search volume or organic traffic numbers.
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DED3] dark:border-[#273347] pb-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'primary', 'secondary', 'long_tail', 'question', 'local'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                activeFilter === cat
                  ? 'bg-[#6256D9] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'long_tail' ? 'Long-Tail' : cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredKeywords.length} of {keywords.length} keywords
        </span>
      </div>

      {/* Keywords Table */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400 font-mono">
          Loading keyword matrix...
        </div>
      ) : filteredKeywords.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl">
          <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No keywords found for this filter.</p>
          <p className="text-[11px] text-slate-400 mt-1">Use the input above to analyze your first keyword cluster.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKeywords.map((k) => (
            <div
              key={k.id}
              className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs hover:border-[#6256D9]/40 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white font-editorial">
                    {k.keyword}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-semibold ${getIntentBadge(
                      k.intent
                    )}`}
                  >
                    {k.intent}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {k.funnel_stage} Funnel
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#6256D9] dark:text-[#9B8CFF]">
                    {k.category}
                  </span>
                </div>

                {/* Action Triggers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onGenerateClusterFromKeyword(k.keyword)}
                    className="px-2.5 py-1 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-medium rounded-lg flex items-center gap-1 transition-all"
                    title="Build Topic Cluster around this keyword"
                  >
                    <Network className="w-3 h-3" />
                    Create Cluster
                  </button>
                  <button
                    onClick={() => onGenerateOutlineToKeyword(k.keyword)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-all"
                    title="Generate Blog Outline"
                  >
                    <Layers className="w-3 h-3" />
                    Generate Outline
                  </button>
                  <button
                    onClick={() => handleDeleteKeyword(k.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Delete keyword"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Keyword Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">
                    Likely User Search Query:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 italic">
                    "{k.likely_question}"
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">
                    Suggested Article Angle:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {k.suggested_angle}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">
                    Target Format & Page Type:
                  </span>
                  <p className="text-[#6256D9] dark:text-[#A195FF] mt-0.5 font-medium">
                    {k.suggested_format} ({k.target_page_type})
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
