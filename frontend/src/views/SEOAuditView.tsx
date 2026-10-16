import React, { useState } from 'react';
import { Project, SEOChecklist, Article } from '../types';
import { api } from '../services/api';
import {
  SearchCheck, CheckCircle2, AlertCircle, Sparkles, RefreshCw,
  FileText, ShieldCheck, ArrowRight
} from 'lucide-react';

interface SEOAuditViewProps {
  activeProject: Project | null;
  savedArticles?: Article[];
}

export const SEOAuditView: React.FC<SEOAuditViewProps> = ({
  activeProject,
  savedArticles = [],
}) => {
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<SEOChecklist | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSavedArticle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const artId = Number(e.target.value);
    const art = savedArticles.find((a) => a.id === artId);
    if (art) {
      setTitle(art.meta_title || art.title);
      setMetaDescription(art.meta_description || '');
      setBodyMarkdown(art.body_markdown);
      setPrimaryKeyword(art.target_keyword);
      if (art.seo_checklist) {
        setResult(art.seo_checklist);
      }
    }
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryKeyword.trim() || !bodyMarkdown.trim()) {
      setError('Primary keyword and content body are required to run an audit.');
      return;
    }

    setAuditing(true);
    setError(null);

    try {
      const data = await api.runSEOAudit({
        title,
        meta_description: metaDescription,
        body_markdown: bodyMarkdown,
        primary_keyword: primaryKeyword.trim(),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
          On-Page SEO Auditor & Checklist
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform a transparent, deterministic audit of any blog post or draft. Analyzes title tags, meta descriptions, single H1 hierarchy, keyword positioning, and Flesch readability.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Input Form */}
      <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs space-y-4">
        {savedArticles.length > 0 && (
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 font-mono uppercase">
              Quick Load Saved Article:
            </span>
            <select
              onChange={handleSelectSavedArticle}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
            >
              <option value="">-- Choose an article to audit --</option>
              {savedArticles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleRunAudit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Primary Target Keyword *
              </label>
              <input
                type="text"
                required
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. website development services"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Title Tag (50–65 characters)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Development Services: The Complete 2026 Guide"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Meta Description (135–165 characters)
            </label>
            <input
              type="text"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="e.g. Explore comprehensive website development services. Learn key architecture tradeoffs, cost ranges, and agency vetting tips."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Article Body Markdown *
            </label>
            <textarea
              rows={8}
              required
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              placeholder="Paste or write your full markdown text here (# H1, ## H2, ### H3, paragraphs, links, and callouts)..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={auditing || !primaryKeyword.trim() || !bodyMarkdown.trim()}
              className="px-6 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <SearchCheck className="w-4 h-4" />
              {auditing ? 'Running SEO Audit...' : 'Run On-Page SEO Audit'}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Score & Breakdown Cards */}
      {result && (
        <div className="space-y-6">
          {/* Score Header Card */}
          <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Overall On-Page Audit Result
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-editorial text-slate-900 dark:text-white">
                  {result.score}
                </span>
                <span className="text-sm font-mono text-slate-400">/ 100</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full uppercase font-mono ${
                    result.score >= 80
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : result.score >= 60
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                  }`}
                >
                  {result.score_label}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                {result.disclaimer}
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono shrink-0">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-xl font-bold text-emerald-600 block">{result.passed_count}</span>
                <span className="text-slate-600 dark:text-slate-400">Passed</span>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <span className="text-xl font-bold text-amber-600 block">{result.warning_count}</span>
                <span className="text-slate-600 dark:text-slate-400">Warnings</span>
              </div>
              <div className="text-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40">
                <span className="text-xl font-bold text-rose-600 block">{result.fail_count}</span>
                <span className="text-slate-600 dark:text-slate-400">Errors</span>
              </div>
            </div>
          </div>

          {/* Readability & Content Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 font-mono uppercase block mb-1">
                Flesch Reading Ease
              </span>
              <div className="text-2xl font-bold font-editorial text-[#6256D9]">
                {result.readability.flesch_reading_ease} / 100
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {result.readability.reading_level_label}
              </p>
            </div>

            <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 font-mono uppercase block mb-1">
                Heading Architecture
              </span>
              <div className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
                {result.heading_summary.h2_count} H2s, {result.heading_summary.h3_count} H3s
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                Main H1: {result.heading_summary.h1 ? '✓ Defined' : '✕ Missing'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 font-mono uppercase block mb-1">
                Word Count & Length
              </span>
              <div className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
                {result.word_count} words
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Avg Sentence: {result.readability.avg_sentence_length} words
              </p>
            </div>
          </div>

          {/* Checks Detail List */}
          <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display mb-3">
              Detailed Best-Practices Evaluation
            </h3>

            {result.checks.map((check) => (
              <div
                key={check.id}
                className={`p-3 rounded-2xl border text-xs flex items-start gap-3 ${
                  check.status === 'pass'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-300'
                    : check.status === 'warning'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 text-amber-950 dark:text-amber-300'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40 text-rose-950 dark:text-rose-300'
                }`}
              >
                {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                {check.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                {check.status === 'fail' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}

                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{check.name}</span>
                    <span className="text-[10px] font-mono opacity-60">Weight: {check.weight} pts</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {check.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
