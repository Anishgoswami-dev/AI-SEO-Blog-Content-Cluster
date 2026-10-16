import React, { useState, useEffect } from 'react';
import { Project, Outline, OutlineSection } from '../types';
import { api } from '../services/api';
import {
  Layers, Sparkles, Plus, Trash2, ArrowRight, Save,
  CheckCircle2, AlertCircle, FileText, HelpCircle, Edit3
} from 'lucide-react';

interface OutlineGeneratorViewProps {
  activeProject: Project | null;
  initialKeyword?: string;
  onConvertToArticle: (outline: Outline) => void;
}

export const OutlineGeneratorView: React.FC<OutlineGeneratorViewProps> = ({
  activeProject,
  initialKeyword,
  onConvertToArticle,
}) => {
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generator form inputs
  const [primaryKw, setPrimaryKw] = useState(initialKeyword || '');
  const [articleTitle, setArticleTitle] = useState('');
  const [searchIntent, setSearchIntent] = useState<'informational' | 'commercial' | 'transactional'>('informational');
  const [targetAudience, setTargetAudience] = useState('');

  useEffect(() => {
    if (initialKeyword) setPrimaryKw(initialKeyword);
  }, [initialKeyword]);

  const loadOutlines = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api.getProjectOutlines(activeProject.id);
      setOutlines(data);
      if (data.length > 0 && !selectedOutline) {
        setSelectedOutline(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutlines();
  }, [activeProject?.id]);

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryKw.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const created = await api.generateOutline({
        primary_keyword: primaryKw.trim(),
        article_title: articleTitle.trim() || undefined,
        search_intent: searchIntent,
        target_audience: targetAudience.trim() || undefined,
        project_id: activeProject?.id,
        save_to_project: true,
      });

      await loadOutlines();
      setSelectedOutline(created);
      setPrimaryKw('');
      setArticleTitle('');
    } catch (err: any) {
      setError(err.message || 'Outline generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveOutlineEdits = async () => {
    if (!selectedOutline?.id) return;
    setSaving(true);
    try {
      const updated = await api.updateOutline(selectedOutline.id, selectedOutline);
      setSelectedOutline(updated);
      await loadOutlines();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOutline = async (id?: number) => {
    if (!id || !window.confirm('Delete this outline?')) return;
    try {
      await api.deleteOutline(id);
      const remaining = outlines.filter((o) => o.id !== id);
      setOutlines(remaining);
      setSelectedOutline(remaining.length > 0 ? remaining[0] : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Section manipulation helpers
  const handleAddSection = () => {
    if (!selectedOutline) return;
    const newSec: OutlineSection = {
      h2: 'New H2 Heading Section',
      h3s: ['Subheading 1', 'Subheading 2'],
      key_points: ['Key argument or step'],
      estimated_words: 250,
    };
    setSelectedOutline({
      ...selectedOutline,
      sections: [...(selectedOutline.sections || []), newSec],
    });
  };

  const handleRemoveSection = (idx: number) => {
    if (!selectedOutline) return;
    setSelectedOutline({
      ...selectedOutline,
      sections: selectedOutline.sections.filter((_, i) => i !== idx),
    });
  };

  const handleUpdateH2 = (idx: number, val: string) => {
    if (!selectedOutline) return;
    const updated = [...selectedOutline.sections];
    updated[idx].h2 = val;
    setSelectedOutline({ ...selectedOutline, sections: updated });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            SEO Blog Outline Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build strict H1–H3 semantic hierarchies designed to resolve user search intent. Review headings, questions, and examples before full drafting.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Form Card */}
      <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleGenerateOutline} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Primary Keyword *
              </label>
              <input
                type="text"
                required
                value={primaryKw}
                onChange={(e) => setPrimaryKw(e.target.value)}
                placeholder="e.g. how much does website development cost"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Search Intent
              </label>
              <select
                value={searchIntent}
                onChange={(e) => setSearchIntent(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              >
                <option value="informational">Informational</option>
                <option value="commercial">Commercial Investigation</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Working Title (Optional)
              </label>
              <input
                type="text"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                placeholder="Optional custom title..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={generating || !primaryKw.trim()}
              className="px-5 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating Outline...' : 'Generate H1–H3 Outline'}
            </button>
          </div>
        </form>
      </div>

      {/* Outline Tabs & Editor */}
      {outlines.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] p-2.5 rounded-2xl shadow-xs">
            <span className="text-xs font-semibold text-slate-500 font-mono uppercase pl-2 mr-1">
              Saved Outlines:
            </span>
            {outlines.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOutline(o)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all truncate max-w-xs ${
                  selectedOutline?.id === o.id
                    ? 'bg-[#6256D9] text-white shadow-xs font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {o.title}
              </button>
            ))}
          </div>

          {selectedOutline && (
            <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold">
                      {selectedOutline.search_intent} intent
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Keyword: <strong className="text-[#6256D9]">{selectedOutline.primary_keyword}</strong>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={selectedOutline.title}
                    onChange={(e) => setSelectedOutline({ ...selectedOutline, title: e.target.value })}
                    className="text-xl font-bold font-editorial text-slate-900 dark:text-white bg-transparent w-full focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveOutlineEdits}
                    disabled={saving}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Edits'}
                  </button>
                  <button
                    onClick={() => onConvertToArticle(selectedOutline)}
                    className="px-4 py-2 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Convert to Full Article
                  </button>
                  <button
                    onClick={() => handleDeleteOutline(selectedOutline.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Angle & Problem Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Core Reader Problem:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedOutline.reader_problem}
                  </p>
                </div>

                <div className="p-3 bg-[#F0EDFF] dark:bg-[#6256D9]/15 rounded-xl border border-[#6256D9]/20">
                  <span className="font-semibold text-[#6256D9] dark:text-[#9B8CFF] block mb-0.5">
                    Unique Article Angle:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedOutline.unique_angle}
                  </p>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display">
                    Heading Structure ({selectedOutline.sections?.length || 0} H2 Sections)
                  </h4>
                  <button
                    onClick={handleAddSection}
                    className="text-xs text-[#6256D9] dark:text-[#9B8CFF] font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                {selectedOutline.sections?.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAF9F7] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          H2 #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={sec.h2}
                          onChange={(e) => handleUpdateH2(idx, e.target.value)}
                          className="flex-1 font-semibold text-slate-900 dark:text-white bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-[#6256D9]"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveSection(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subheadings H3s */}
                    {sec.h3s && sec.h3s.length > 0 && (
                      <div className="pl-6 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                          H3 Subsections:
                        </span>
                        {sec.h3s.map((h3, i) => (
                          <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span className="text-[#6256D9]">↳</span>
                            <span>{h3}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Key points */}
                    {sec.key_points && sec.key_points.length > 0 && (
                      <div className="pl-6 pt-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-0.5">
                          Points Covered:
                        </span>
                        <ul className="list-disc list-inside text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                          {sec.key_points.map((kp, kpi) => (
                            <li key={kpi}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Questions Answered */}
              {selectedOutline.questions && selectedOutline.questions.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Questions This Article Directly Answers:
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {selectedOutline.questions.map((q, qi) => (
                      <li key={qi} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Note */}
              {selectedOutline.cta && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200">
                  <strong className="font-semibold block mb-0.5">Contextual Call-to-Action:</strong>
                  {selectedOutline.cta}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
