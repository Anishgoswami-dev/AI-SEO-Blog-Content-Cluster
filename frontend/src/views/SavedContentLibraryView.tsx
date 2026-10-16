import React, { useState, useEffect } from 'react';
import { Project, Article } from '../types';
import { api } from '../services/api';
import {
  FolderArchive, Search, Download, Trash2, Edit3,
  FileText, Sparkles, CheckCircle2, Clock
} from 'lucide-react';

interface SavedContentLibraryViewProps {
  activeProject: Project | null;
  onSelectArticleForEdit: (article: Article) => void;
  onNewArticleClick: () => void;
}

export const SavedContentLibraryView: React.FC<SavedContentLibraryViewProps> = ({
  activeProject,
  onSelectArticleForEdit,
  onNewArticleClick,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review' | 'published'>('all');

  const loadArticles = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api.getProjectArticles(activeProject.id);
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [activeProject?.id]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this article permanently?')) return;
    try {
      await api.deleteArticle(id);
      setArticles(articles.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportMarkdown = (article: Article) => {
    const blob = new Blob([article.body_markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${article.slug || 'article'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.target_keyword.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            Saved Content Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access, edit, search, and export all generated long-form articles, outlines, and content packs.
          </p>
        </div>

        <button
          onClick={onNewArticleClick}
          className="px-4 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Article
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
          {(['all', 'draft', 'review', 'published'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl capitalize font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#6256D9] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid or Table */}
      {loading ? (
        <div className="text-center py-20 text-xs font-mono text-slate-400">
          Loading content library...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-8 shadow-xs">
          <FolderArchive className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white font-editorial mb-1">
            No Articles Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'No articles match your search query.'
              : 'Generate your first article using the long-form blog generator.'}
          </p>
          <button
            onClick={onNewArticleClick}
            className="px-4 py-2 bg-[#6256D9] text-white text-xs font-semibold rounded-xl hover:bg-[#5045BC] transition-all"
          >
            Create Article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#6256D9]/40 transition-all space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold ${
                      article.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : article.status === 'review'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    }`}
                  >
                    {article.status}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-400">Score:</span>
                    <strong className="text-[#6256D9] dark:text-[#9B8CFF]">{article.seo_score}/100</strong>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white font-editorial line-clamp-2 leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {article.meta_description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>🔑 {article.target_keyword}</span>
                  <span>{article.word_count} words</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => onSelectArticleForEdit(article)}
                    className="flex-1 py-1.5 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Open in Studio
                  </button>

                  <button
                    onClick={() => handleExportMarkdown(article)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    title="Export Markdown (.md)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl"
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
