import React, { useState, useEffect } from 'react';
import { Project, InternalLinkItem } from '../types';
import { api } from '../services/api';
import {
  Link2, Sparkles, Check, X, Plus, ExternalLink,
  AlertCircle, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';

interface InternalLinkingViewProps {
  activeProject: Project | null;
}

export const InternalLinkingView: React.FC<InternalLinkingViewProps> = ({
  activeProject,
}) => {
  const [links, setLinks] = useState<InternalLinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Link modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [reason, setReason] = useState('');

  const loadLinks = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api.getProjectInternalLinks(activeProject.id);
      setLinks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [activeProject?.id]);

  const handleRunAnalysis = async () => {
    if (!activeProject) return;
    setAnalyzing(true);
    setError(null);
    try {
      const resp = await api.suggestInternalLinks({ project_id: activeProject.id });
      // Save suggested items
      for (const item of resp.suggestions) {
        await api.saveInternalLink({
          project_id: activeProject.id,
          source_title: item.source_title,
          source_url: item.source_url,
          target_title: item.target_title,
          target_url: item.target_url,
          anchor_text: item.anchor_text,
          reason: item.reason,
          topic_cluster: item.topic_cluster,
          status: 'suggested',
        });
      }
      await loadLinks();
    } catch (err: any) {
      setError(err.message || 'Linking analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateCustomLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !targetTitle.trim() || !targetUrl.trim() || !anchorText.trim()) return;

    try {
      await api.saveInternalLink({
        project_id: activeProject.id,
        source_title: sourceTitle.trim() || 'General Article',
        source_url: sourceUrl.trim() || '/',
        target_title: targetTitle.trim(),
        target_url: targetUrl.trim(),
        anchor_text: anchorText.trim(),
        reason: reason.trim() || 'Manual editorial link',
        status: 'accepted',
      });
      setIsModalOpen(false);
      setTargetTitle('');
      setTargetUrl('');
      setAnchorText('');
      setReason('');
      await loadLinks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            Internal Linking Recommendation Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build link architecture between cornerstone pillar pages and supporting cluster articles. All suggested target pages correspond strictly to verified project URLs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Manual Link
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="px-4 py-2 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {analyzing ? 'Analyzing Link Opportunities...' : 'Suggest Cluster Links'}
          </button>
        </div>
      </div>

      {/* Quality Safeguard Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#6256D9] mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Internal Linking Integrity:</strong> Recommendations connect known articles to registered service pages. Anchor text uses descriptive phrasing rather than repetitive exact matches to prevent algorithmic over-optimization penalties.
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Links List */}
      {loading ? (
        <div className="text-center py-20 text-xs font-mono text-slate-400">
          Loading link recommendations...
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-8 shadow-xs">
          <Link2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white font-editorial mb-1">
            No Internal Links Suggested Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Click "Suggest Cluster Links" to analyze your project articles and verified service landing pages.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="px-4 py-2 bg-[#6256D9] text-white text-xs font-semibold rounded-xl hover:bg-[#5045BC] transition-all"
          >
            Run Linking Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white font-editorial">
                    {link.source_title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-[#6256D9] dark:text-[#9B8CFF] font-editorial">
                    {link.target_title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {link.target_url}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>Recommended Anchor Text:</span>
                  <span className="px-2 py-0.5 bg-[#F0EDFF] dark:bg-[#6256D9]/20 text-[#6256D9] dark:text-[#A195FF] font-medium rounded font-mono">
                    "{link.anchor_text}"
                  </span>
                </div>

                {link.reason && (
                  <p className="text-[11px] text-slate-500 italic">
                    Reason: {link.reason}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-semibold ${
                    link.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : link.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}
                >
                  {link.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2232] border border-[#E5DED3] dark:border-[#273347] rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white mb-1">
              Add Verified Internal Link
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Map a contextual link from a source article to a target service page.
            </p>

            <form onSubmit={handleCreateCustomLink} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Source Article Title
                </label>
                <input
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="e.g. Website Development Cost Guide"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Page Title *
                </label>
                <input
                  type="text"
                  required
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="e.g. Custom Web Development Services"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Page URL *
                </label>
                <input
                  type="text"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="/services/web-development"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Recommended Anchor Text *
                </label>
                <input
                  type="text"
                  required
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  placeholder="e.g. professional web development services"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Strategic Linking Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Channel commercial intent to direct conversion page"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold rounded-xl"
                >
                  Save Link Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
