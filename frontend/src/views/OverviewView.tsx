import React from 'react';
import { Project, DashboardMetrics, Article, KeywordItem } from '../types';
import {
  FileText, Network, CheckCircle2, Clock, Sparkles, KeyRound,
  ArrowRight, Search, PlusCircle, AlertCircle, TrendingUp, Layers
} from 'lucide-react';

interface OverviewViewProps {
  metrics: DashboardMetrics | null;
  recentArticles: Article[];
  recentKeywords: KeywordItem[];
  activeProject: Project | null;
  onNavigate: (tab: any) => void;
  onSelectArticle: (article: Article) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  recentArticles,
  recentKeywords,
  activeProject,
  onNavigate,
  onSelectArticle,
}) => {
  const statCards = [
    {
      title: 'Total Saved Articles',
      value: metrics?.total_articles ?? 0,
      sub: `${metrics?.published_articles ?? 0} published live`,
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Drafts Awaiting Review',
      value: metrics?.drafts_awaiting_review ?? 0,
      sub: 'Editorial queue',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40',
    },
    {
      title: 'Planned Topic Clusters',
      value: metrics?.total_topic_clusters ?? 0,
      sub: `${metrics?.total_planned_topics ?? 0} spoke articles in queue`,
      icon: Network,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40',
    },
    {
      title: 'Keywords Analyzed',
      value: metrics?.total_keywords_analyzed ?? 0,
      sub: 'Search intent mapped',
      icon: KeyRound,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#202936] via-[#2A3547] to-[#1E2538] text-white p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-purple-200 backdrop-blur-md mb-3">
            <Sparkles className="w-3 h-3 text-[#A89EFF]" />
            RankCraft AI SEO Content Studio
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal font-editorial tracking-tight text-white mb-2">
            Turn Keywords into a Complete Content Strategy
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            Plan, organize, and generate high-impact SEO content packs for{' '}
            <strong className="text-white font-semibold">{activeProject?.name || 'your business'}</strong>.
            Build interconnected topic clusters, editable outlines, and helpful long-form articles.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('keywords')}
              className="px-4 py-2 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
              Research Keywords
            </button>
            <button
              onClick={() => onNavigate('clusters')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-all backdrop-blur-sm"
            >
              <Network className="w-3.5 h-3.5" />
              View Topic Clusters
            </button>
            <button
              onClick={() => onNavigate('generator')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-all backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Article
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl border ${c.bg} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-display">
                  {c.title}
                </span>
                <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold font-editorial text-slate-900 dark:text-white mt-3">
                {c.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {c.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad Grid */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display mb-4">
          SEO Workflow Launchpad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('keywords')}
            className="p-5 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl hover:border-[#6256D9] dark:hover:border-[#6256D9] cursor-pointer transition-all shadow-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[#6256D9] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-1 flex items-center justify-between">
              Keyword & Search Intent
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#6256D9] group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unpack intent (Informational, Commercial, Transactional), funnel stages, angles, and format suggestions.
            </p>
          </div>

          <div
            onClick={() => onNavigate('clusters')}
            className="p-5 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl hover:border-[#6256D9] dark:hover:border-[#6256D9] cursor-pointer transition-all shadow-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-1 flex items-center justify-between">
              Interactive Topic Clusters
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#6256D9] group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate pillar-and-spoke visual architecture with hierarchical internal links and cannibalization checks.
            </p>
          </div>

          <div
            onClick={() => onNavigate('audit')}
            className="p-5 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl hover:border-[#6256D9] dark:hover:border-[#6256D9] cursor-pointer transition-all shadow-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-1 flex items-center justify-between">
              On-Page SEO Auditor
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#6256D9] group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Deterministic 0–100 score evaluating title, meta description, H1–H3 hierarchy, and Flesch readability.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Articles & Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display">
              Recent Articles & Content Packs
            </h3>
            <button
              onClick={() => onNavigate('saved')}
              className="text-xs text-[#6256D9] dark:text-[#9B8CFF] hover:underline font-medium"
            >
              View all ({metrics?.total_articles ?? 0})
            </button>
          </div>

          {recentArticles.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No articles generated yet for this project.
              </p>
              <button
                onClick={() => onNavigate('generator')}
                className="mt-3 px-3.5 py-1.5 bg-[#6256D9] text-white text-xs font-semibold rounded-lg hover:bg-[#5045BC] transition-all"
              >
                Create your first article
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onSelectArticle(art)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="truncate pr-4">
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-editorial truncate">
                      {art.title}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                      <span>🔑 {art.target_keyword}</span>
                      <span>•</span>
                      <span>{art.word_count} words</span>
                      <span>•</span>
                      <span>Score: <strong className="text-[#6256D9]">{art.seo_score}/100</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                        art.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : art.status === 'review'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}
                    >
                      {art.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Keywords (1 Col) */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display">
              Target Keywords
            </h3>
            <button
              onClick={() => onNavigate('keywords')}
              className="text-xs text-[#6256D9] dark:text-[#9B8CFF] hover:underline font-medium"
            >
              Analyze
            </button>
          </div>

          {recentKeywords.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No keywords saved yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentKeywords.map((k, idx) => (
                <div
                  key={k.id || idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {k.keyword}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                      {k.intent}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {k.search_volume_label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
