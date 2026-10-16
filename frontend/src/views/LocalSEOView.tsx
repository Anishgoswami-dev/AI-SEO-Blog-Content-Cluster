import React, { useState } from 'react';
import { Project, LocalSEOPack } from '../types';
import { api } from '../services/api';
import { MapPin, Sparkles, ShieldCheck, AlertCircle, Copy, Check, FileText } from 'lucide-react';

interface LocalSEOViewProps {
  activeProject: Project | null;
}

export const LocalSEOView: React.FC<LocalSEOViewProps> = ({ activeProject }) => {
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const [uniqueBenefits, setUniqueBenefits] = useState('');
  const [verifiedDetails, setVerifiedDetails] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<LocalSEOPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service.trim() || !city.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const data = await api.generateLocalSEO({
        service: service.trim(),
        city: city.trim(),
        project_id: activeProject?.id,
        unique_benefits: uniqueBenefits.trim() || undefined,
        verified_details: verifiedDetails.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Local SEO generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
          Local SEO Content Studio
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Generate city and service-area landing page architecture, localized FAQs, and geo-targeted blog angles without creating doorway spam.
        </p>
      </div>

      {/* Strict Anti-Doorway Safeguard Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold block">Quality Safeguards Active:</strong>
          <p className="text-[11px] leading-relaxed">
            RankCraft AI strictly prohibits the fabrication of fictitious local addresses, fake customer reviews, or hundreds of near-identical doorway city pages. All generated local landing pages require verified local service facts and distinct geographic value.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs">
        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Core Service *
              </label>
              <input
                type="text"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. Custom Web Development or Emergency Plumbing"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target City or Region *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Austin, TX or Denver, CO"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Unique Local Benefits or Guarantees
              </label>
              <textarea
                rows={2}
                value={uniqueBenefits}
                onChange={(e) => setUniqueBenefits(e.target.value)}
                placeholder="e.g. Same-day on-site response in Travis County, licensed technicians, 100% locally operated team..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Verified Business Details (Phone, Hours, Service Area)
              </label>
              <textarea
                rows={2}
                value={verifiedDetails}
                onChange={(e) => setVerifiedDetails(e.target.value)}
                placeholder="e.g. Serving Greater Austin area, Mon-Fri 8am-6pm, 24/7 emergency dispatch line..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={generating || !service.trim() || !city.trim()}
              className="px-5 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Drafting Local SEO Pack...' : 'Generate Local SEO Pack'}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Pack Results */}
      {result && (
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6256D9] dark:text-[#9B8CFF] font-semibold">
                Local Landing Page Architecture
              </span>
              <h3 className="text-xl font-bold font-editorial text-slate-900 dark:text-white mt-0.5">
                {result.page_title}
              </h3>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 hover:bg-slate-200 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Pack' : 'Copy All'}
            </button>
          </div>

          {/* Meta Description Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Meta Description ({result.meta_description.length} chars):
            </span>
            <p className="text-slate-600 dark:text-slate-300 italic">
              "{result.meta_description}"
            </p>
          </div>

          {/* Outline Structure */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-2">
              Page Heading Structure:
            </h4>
            <div className="space-y-1.5 text-xs">
              {result.outline.map((h, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#FAF9F7] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono">
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Local Service Area FAQs */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-2">
              Service-Area Specific FAQs:
            </h4>
            <div className="space-y-2 text-xs">
              {result.faqs.map((faq, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Q: {faq.question}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Local Blog Ideas */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-2">
              City-Specific Supporting Blog Post Ideas:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {result.blog_ideas.map((idea, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#6256D9]">✦</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Geo-Aware Call To Action */}
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200">
            <span className="font-semibold block mb-0.5">Location-Aware Call to Action:</span>
            {result.call_to_action}
          </div>
        </div>
      )}
    </div>
  );
};
