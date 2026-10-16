import React, { useState, useEffect } from 'react';
import { Project, Article } from '../types';
import { api } from '../services/api';
import { SEOEditor } from '../components/SEOEditor';
import {
  FileText, Plus, Eye, Code, Download, Copy, Check,
  AlertCircle, Sparkles, X, Globe
} from 'lucide-react';

interface ContentStudioViewProps {
  activeProject: Project | null;
  selectedArticle: Article | null;
  onSelectArticle: (article: Article) => void;
  onNewArticleClick: () => void;
}

export const ContentStudioView: React.FC<ContentStudioViewProps> = ({
  activeProject,
  selectedArticle,
  onSelectArticle,
  onNewArticleClick,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(selectedArticle);
  const [loading, setLoading] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  useEffect(() => {
    if (!activeProject) return;
    setLoading(true);
    api
      .getProjectArticles(activeProject.id)
      .then((data) => {
        setArticles(data);
        if (!currentArticle && data.length > 0) {
          setCurrentArticle(data[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeProject?.id]);

  useEffect(() => {
    if (selectedArticle) {
      setCurrentArticle(selectedArticle);
    }
  }, [selectedArticle]);

  const handleSaveArticle = async (updated: Partial<Article>) => {
    if (!currentArticle?.id) return;
    try {
      const res = await api.updateArticle(currentArticle.id, updated);
      setCurrentArticle(res);
      setArticles(articles.map((a) => (a.id === res.id ? res : a)));
    } catch (err) {
      console.error('Failed to update article in studio:', err);
    }
  };

  const handleExportMarkdown = () => {
    if (!currentArticle) return;
    const blob = new Blob([currentArticle.body_markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentArticle.slug || 'article'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHTML = () => {
    if (!currentArticle) return;
    // Simple HTML wrapper
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${currentArticle.meta_title || currentArticle.title}</title>
  <meta name="description" content="${currentArticle.meta_description || ''}">
</head>
<body>
  <article>
    ${currentArticle.body_markdown.replace(/\n/g, '<br>')}
  </article>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentArticle.slug || 'article'}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] space-y-3">
      {/* Article Selector & Metadata Trigger Bar */}
      <div className="flex flex-wrap items-center justify-between bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] px-5 py-2.5 rounded-2xl shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider hidden sm:inline">
            Active Draft:
          </span>
          <select
            value={currentArticle?.id || ''}
            onChange={(e) => {
              const a = articles.find((art) => art.id === Number(e.target.value));
              if (a) {
                setCurrentArticle(a);
                onSelectArticle(a);
              }
            }}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-slate-800 dark:text-white max-w-sm truncate focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
          >
            {articles.map((art) => (
              <option key={art.id} value={art.id}>
                {art.title} ({art.status})
              </option>
            ))}
          </select>

          <button
            onClick={onNewArticleClick}
            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EDFF] dark:bg-slate-800 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Draft</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentArticle && (
            <button
              onClick={() => setIsMetadataModalOpen(true)}
              className="px-3 py-1.5 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              SERP & Schema JSON-LD
            </button>
          )}
        </div>
      </div>

      {/* Editor Main Canvas */}
      {currentArticle ? (
        <div className="flex-1 overflow-hidden">
          <SEOEditor
            article={currentArticle}
            onSave={handleSaveArticle}
            onExportMarkdown={handleExportMarkdown}
            onExportHTML={handleExportHTML}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold font-editorial text-slate-800 dark:text-white mb-1">
            No Article Selected
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Select an existing article from your project or generate a new long-form blog post.
          </p>
          <button
            onClick={onNewArticleClick}
            className="px-4 py-2 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Generate New Article
          </button>
        </div>
      )}

      {/* SERP & JSON-LD Schema Modal */}
      {isMetadataModalOpen && currentArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2232] border border-[#E5DED3] dark:border-[#273347] rounded-3xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#6256D9]" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display">
                  SERP Snippet & Schema.org Structured Data
                </h3>
              </div>
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* Google SERP Preview Card */}
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2 font-display">
                  Google Search Snippet Preview (Desktop & Mobile)
                </span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">🌐</span>
                    <span className="truncate">{activeProject?.domain || 'apexwebstudio.com'} › {currentArticle.slug}</span>
                  </div>
                  <h4 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {currentArticle.meta_title || currentArticle.title}
                  </h4>
                  <p className="text-xs text-[#4d5156] mt-1 line-clamp-2 leading-relaxed">
                    {currentArticle.meta_description || 'No meta description configured yet.'}
                  </p>
                </div>
              </div>

              {/* JSON-LD Schema Code View */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-display">
                    Validated JSON-LD Schema ({currentArticle.schema_type})
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(currentArticle.schema_json, null, 2));
                      setJsonCopied(true);
                      setTimeout(() => setJsonCopied(false), 2000);
                    }}
                    className="text-xs text-[#6256D9] hover:underline font-medium flex items-center gap-1"
                  >
                    {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {jsonCopied ? 'Copied JSON-LD' : 'Copy Schema'}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(currentArticle.schema_json, null, 2) || '// No schema generated'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
