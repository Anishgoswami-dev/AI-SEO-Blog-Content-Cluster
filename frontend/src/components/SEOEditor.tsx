import React, { useState, useEffect, useRef } from 'react';
import { Article, SEOChecklist } from '../types';
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Table, Eye, Edit3, Sparkles, Check, Download,
  Copy, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Wand2, X
} from 'lucide-react';
import { api } from '../services/api';

interface SEOEditorProps {
  article: Article;
  onSave: (updated: Partial<Article>) => Promise<void>;
  onExportMarkdown: () => void;
  onExportHTML: () => void;
}

export const SEOEditor: React.FC<SEOEditorProps> = ({
  article,
  onSave,
  onExportMarkdown,
  onExportHTML,
}) => {
  const [content, setContent] = useState<string>(article.body_markdown || '');
  const [title, setTitle] = useState<string>(article.title || '');
  const [metaTitle, setMetaTitle] = useState<string>(article.meta_title || '');
  const [metaDescription, setMetaDescription] = useState<string>(article.meta_description || '');
  const [targetKeyword, setTargetKeyword] = useState<string>(article.target_keyword || '');
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [seoChecklist, setSeoChecklist] = useState<SEOChecklist | null>(article.seo_checklist || null);
  const [copied, setCopied] = useState(false);

  // AI Assistant Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiAction, setAiAction] = useState<string>('clarity');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRevision, setAiRevision] = useState<{ revised_text: string; explanation: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimerRef = useRef<any>(null);

  // Sync state when article prop changes
  useEffect(() => {
    setContent(article.body_markdown || '');
    setTitle(article.title || '');
    setMetaTitle(article.meta_title || '');
    setMetaDescription(article.meta_description || '');
    setTargetKeyword(article.target_keyword || '');
    setSeoChecklist(article.seo_checklist || null);
  }, [article.id]);

  // Trigger on-page audit re-computation when content or metadata changes
  const runLiveAudit = async (currentContent: string, currentMetaT: string, currentMetaD: string, currentKw: string) => {
    try {
      const result = await api.runSEOAudit({
        title: currentMetaT || title,
        meta_description: currentMetaD,
        body_markdown: currentContent,
        primary_keyword: currentKw,
      });
      setSeoChecklist(result);
    } catch (e) {
      console.error('Audit run error:', e);
    }
  };

  // Debounced autosave
  const triggerAutosave = (newContent: string, newMetaT: string, newMetaD: string, newKw: string) => {
    setSaveStatus('unsaved');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onSave({
          title,
          body_markdown: newContent,
          meta_title: newMetaT,
          meta_description: newMetaD,
          target_keyword: newKw,
        });
        setSaveStatus('saved');
        runLiveAudit(newContent, newMetaT, newMetaD, newKw);
      } catch (e) {
        console.error('Autosave failed:', e);
        setSaveStatus('unsaved');
      }
    }, 1200);
  };

  // Quick text formatting helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const sel = content.substring(start, end);
    const replacement = `${prefix}${sel || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    triggerAutosave(newContent, metaTitle, metaDescription, targetKeyword);

    // Restore focus & cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (sel.length || 4));
    }, 10);
  };

  // Handle AI Writing Assistant action
  const handleOpenAiAssistant = () => {
    const textarea = textareaRef.current;
    const sel = textarea ? content.substring(textarea.selectionStart, textarea.selectionEnd) : '';
    setSelectedText(sel || content.substring(0, 500));
    setAiRevision(null);
    setIsAiModalOpen(true);
  };

  const handleExecuteAiAction = async () => {
    if (!selectedText.trim()) return;
    setAiLoading(true);
    try {
      const resp = await api.rewriteSection(article.id, {
        text: selectedText,
        action: aiAction,
      });
      setAiRevision(resp);
    } catch (e) {
      console.error('AI Assistant rewrite error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiRevision = () => {
    if (!aiRevision) return;
    const textarea = textareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + aiRevision.revised_text + content.substring(end);
      setContent(newContent);
      triggerAutosave(newContent, metaTitle, metaDescription, targetKeyword);
    } else {
      // If no specific selection was preserved, append or update
      const newContent = content.replace(selectedText, aiRevision.revised_text);
      setContent(newContent);
      triggerAutosave(newContent, metaTitle, metaDescription, targetKeyword);
    }
    setIsAiModalOpen(false);
  };

  // Calculate live stats
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Compute simple keyword density
  const kwMatches = targetKeyword ? (content.match(new RegExp(targetKeyword, 'gi')) || []).length : 0;
  const kwDensity = words > 0 ? ((kwMatches * targetKeyword.split(' ').length) / words * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col h-full bg-[#F7F5F0] dark:bg-[#111622] rounded-2xl border border-[#E5DED3] dark:border-[#273347] overflow-hidden shadow-sm">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-white dark:bg-[#171E2E] border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        {/* Left: View Mode Toggle & Format Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center bg-[#F7F5F0] dark:bg-[#20293A] p-0.5 rounded-lg border border-[#E5DED3] dark:border-[#2E3C52] mr-2">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-[#6256D9] text-[#202936] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
              Editor
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-[#6256D9] text-[#202936] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-[#6256D9] text-[#202936] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Preview
            </button>
          </div>

          {/* Quick Markdown Inserts */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            <button onClick={() => insertFormatting('# ', '')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Heading 1">
              <Heading1 className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('## ', '')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Heading 2">
              <Heading2 className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('### ', '')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Heading 3">
              <Heading3 className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('**', '**')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Bold">
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('*', '*')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Italic">
              <Italic className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('- ', '')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Bullet List">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('1. ', '')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Numbered List">
              <ListOrdered className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('> ', '')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Quote">
              <Quote className="w-4 h-4" />
            </button>
            <button onClick={() => insertFormatting('[', '](https://example.com)')} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Insert Link">
              <Link2 className="w-4 h-4" />
            </button>
          </div>

          {/* AI Assistant Button */}
          <button
            onClick={handleOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 dark:hover:bg-[#6256D9]/30 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-semibold rounded-lg transition-all ml-1 shadow-sm"
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI Assistant
          </button>
        </div>

        {/* Right: Autosave status & Export actions */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            {saveStatus === 'saving' && <RefreshCw className="w-3 h-3 animate-spin text-[#6256D9]" />}
            {saveStatus === 'saved' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            {saveStatus === 'unsaved' && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'All changes saved' : 'Unsaved edits'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1"
              title="Copy to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onExportMarkdown}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Markdown
            </button>
            <button
              onClick={onExportHTML}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace (Editor + SEO Panel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor & Preview Area */}
        <div className={`flex-1 flex overflow-hidden ${viewMode === 'split' ? 'divide-x divide-[#E5DED3] dark:divide-[#273347]' : ''}`}>
          {/* Writing Canvas */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white dark:bg-[#151D2A]">
              {/* Document Meta Fields */}
              <div className="space-y-3 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    triggerAutosave(content, metaTitle, metaDescription, targetKeyword);
                  }}
                  placeholder="Article Working Title..."
                  className="w-full text-2xl font-bold font-editorial text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-300"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Meta Title (SERP Display)
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => {
                        setMetaTitle(e.target.value);
                        triggerAutosave(content, e.target.value, metaDescription, targetKeyword);
                      }}
                      placeholder="SEO Title (50-60 characters)"
                      className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800/60 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                    />
                    <div className="text-[10px] text-slate-400 mt-0.5 text-right font-mono">
                      {metaTitle.length}/60 chars
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Primary Target Keyword
                    </label>
                    <input
                      type="text"
                      value={targetKeyword}
                      onChange={(e) => {
                        setTargetKeyword(e.target.value);
                        triggerAutosave(content, metaTitle, metaDescription, e.target.value);
                      }}
                      placeholder="e.g. website development services"
                      className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800/60 text-[#6256D9] font-medium focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => {
                      setMetaDescription(e.target.value);
                      triggerAutosave(content, metaTitle, e.target.value, targetKeyword);
                    }}
                    placeholder="Engaging meta description (140-160 characters)..."
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800/60 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9] resize-none text-xs"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5 text-right font-mono">
                    {metaDescription.length}/160 chars
                  </div>
                </div>
              </div>

              {/* Textarea Markdown Editor */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  triggerAutosave(e.target.value, metaTitle, metaDescription, targetKeyword);
                }}
                placeholder="Write your long-form SEO blog post here using Markdown (# H1, ## H2, ### H3, - bullets)..."
                className="flex-1 w-full font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none resize-none min-h-[480px]"
              />

              {/* Footer Live Counters */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-4">
                  <span>{words} words</span>
                  <span>{chars} characters</span>
                  <span>~{readingTime} min read</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Keyword occurrences: <strong className="text-[#6256D9]">{kwMatches}</strong></span>
                  <span>Density: <strong>{kwDensity}%</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Rendered Live Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="flex-1 p-8 overflow-y-auto bg-[#FCFBF8] dark:bg-[#111722]">
              <div className="max-w-2xl mx-auto prose-rankcraft text-slate-800 dark:text-slate-200">
                {/* Render simple markdown lines */}
                {content ? (
                  content.split('\n\n').map((block, idx) => {
                    const trimmed = block.trim();
                    if (trimmed.startsWith('# ')) {
                      return <h1 key={idx}>{trimmed.replace(/^#\s+/, '')}</h1>;
                    } else if (trimmed.startsWith('## ')) {
                      return <h2 key={idx}>{trimmed.replace(/^##\s+/, '')}</h2>;
                    } else if (trimmed.startsWith('### ')) {
                      return <h3 key={idx}>{trimmed.replace(/^###\s+/, '')}</h3>;
                    } else if (trimmed.startsWith('> ')) {
                      return <blockquote key={idx}>{trimmed.replace(/^>\s+/, '')}</blockquote>;
                    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                      const items = trimmed.split('\n').map(l => l.replace(/^[-*]\s+/, ''));
                      return (
                        <ul key={idx}>
                          {items.map((it, i) => (
                            <li key={i}>{it}</li>
                          ))}
                        </ul>
                      );
                    } else if (/^\d+\.\s+/.test(trimmed)) {
                      const items = trimmed.split('\n').map(l => l.replace(/^\d+\.\s+/, ''));
                      return (
                        <ol key={idx}>
                          {items.map((it, i) => (
                            <li key={i}>{it}</li>
                          ))}
                        </ol>
                      );
                    } else if (trimmed.startsWith('---')) {
                      return <hr key={idx} className="my-6 border-slate-200 dark:border-slate-800" />;
                    } else {
                      return <p key={idx}>{trimmed}</p>;
                    }
                  })
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Start writing to see live formatted article preview...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right-Side SEO Insights & Audit Panel */}
        <div className="w-80 bg-white dark:bg-[#171E2E] border-l border-[#E5DED3] dark:border-[#273347] flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-[#FAF8F5] dark:bg-[#1A2232]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                On-Page SEO Score
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                (seoChecklist?.score || 0) >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                (seoChecklist?.score || 0) >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
              }`}>
                {seoChecklist?.score_label || 'Audit'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold font-editorial text-slate-900 dark:text-white">
                {seoChecklist?.score ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#6256D9] transition-all duration-500 rounded-full"
                style={{ width: `${seoChecklist?.score || 0}%` }}
              ></div>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
              Deterministic scoring based on content structure, keyword positioning, and readability.
            </p>
          </div>

          {/* Actionable Check Items */}
          <div className="p-4 space-y-3 flex-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Audit Breakdown ({seoChecklist?.passed_count || 0} passed, {seoChecklist?.warning_count || 0} warnings)
            </span>

            {seoChecklist?.checks?.map((check) => (
              <div
                key={check.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  check.status === 'pass'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                    : check.status === 'warning'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-300'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40 text-rose-900 dark:text-rose-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {check.status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                  {check.status === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                  {check.status === 'fail' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-semibold block">{check.name}</span>
                    <span className="text-[11px] opacity-80 leading-snug block mt-0.5">{check.message}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Readability Score Card */}
            {seoChecklist?.readability && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs mt-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Readability Metrics
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <span>Flesch Reading Ease:</span>
                  <span className="font-mono font-medium">{seoChecklist.readability.flesch_reading_ease}/100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <span>Reading Grade:</span>
                  <span className="font-mono font-medium">{seoChecklist.readability.reading_level_label}</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
                  <span>Avg Sentence Length:</span>
                  <span className="font-mono font-medium">{seoChecklist.readability.avg_sentence_length} words</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Editor AI Writing Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2232] border border-[#E5DED3] dark:border-[#273347] rounded-2xl shadow-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6256D9]" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display">
                  RankCraft AI In-Editor Writing Assistant
                </h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Selected Text to Improve:
                </label>
                <textarea
                  rows={3}
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Choose Strategic Enhancement Action:
                </label>
                <select
                  value={aiAction}
                  onChange={(e) => setAiAction(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
                >
                  <option value="clarity">Improve Clarity & Flow</option>
                  <option value="simplify">Simplify Complex Language</option>
                  <option value="expand">Expand with Concrete Elaboration</option>
                  <option value="shorten">Tighten & Condense Redundancies</option>
                  <option value="add_example">Add Practical Business Example</option>
                  <option value="improve_intro">Improve Introduction Hook</option>
                  <option value="improve_conclusion">Improve Conclusion & Next Steps</option>
                  <option value="check_claims">Verify & Tone Down Unsubstantiated Claims</option>
                </select>
              </div>

              {aiRevision && (
                <div className="p-3 bg-[#F0EDFF] dark:bg-[#6256D9]/15 rounded-xl border border-[#6256D9]/30 text-xs">
                  <span className="font-semibold text-[#6256D9] dark:text-[#9B8CFF] block mb-1">
                    AI Suggested Revision ({aiRevision.explanation}):
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {aiRevision.revised_text}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>

              {!aiRevision ? (
                <button
                  onClick={handleExecuteAiAction}
                  disabled={aiLoading}
                  className="px-4 py-2 text-xs bg-[#6256D9] hover:bg-[#5045BC] text-white font-medium rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiLoading ? 'Enhancing...' : 'Generate Revision'}
                </button>
              ) : (
                <button
                  onClick={handleApplyAiRevision}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply to Article
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
