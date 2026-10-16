import React, { useState, useEffect } from 'react';
import { Project, TopicCluster, ClusterTopic, ContentStatus } from '../types';
import { api } from '../services/api';
import {
  CalendarCheck, Clock, CheckCircle2, FileText, Sparkles,
  ArrowRight, Filter, AlertCircle, Layers
} from 'lucide-react';

interface StrategyPlannerViewProps {
  activeProject: Project | null;
  onGenerateOutline: (topic: ClusterTopic) => void;
  onGenerateArticle: (topic: ClusterTopic) => void;
}

export const StrategyPlannerView: React.FC<StrategyPlannerViewProps> = ({
  activeProject,
  onGenerateOutline,
  onGenerateArticle,
}) => {
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api.getProjectClusters(activeProject.id);
      setClusters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id]);

  const handleStatusChange = async (topicId: number, newStatus: ContentStatus) => {
    try {
      await api.updateClusterTopic(topicId, { status: newStatus });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Flatten all topics across clusters
  const allTopics: Array<ClusterTopic & { clusterName: string }> = [];
  clusters.forEach((c) => {
    (c.topics || []).forEach((t) => {
      allTopics.push({ ...t, clusterName: c.cluster_name });
    });
  });

  const filteredTopics = statusFilter === 'all'
    ? allTopics
    : allTopics.filter((t) => t.status === statusFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            Content Strategy & Editorial Roadmap
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Convert keyword clusters into a prioritized publishing schedule. Track status across planned, draft, editorial review, and published states.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] p-1 rounded-xl shadow-xs text-xs">
          {(['all', 'planned', 'draft', 'review', 'published'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
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

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Roadmap Kanban Columns or List */}
      {loading ? (
        <div className="text-center py-20 text-xs font-mono text-slate-400">
          Loading editorial roadmap...
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-8 shadow-xs">
          <CalendarCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white font-editorial mb-1">
            No Topics in Strategy Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create topic clusters to automatically populate your editorial publishing pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((topic, idx) => (
            <div
              key={topic.id || idx}
              className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#6256D9]/40 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Seq #{topic.publication_sequence}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#6256D9] dark:text-[#9B8CFF]">
                    {topic.clusterName}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {topic.search_intent}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-editorial">
                  {topic.title}
                </h4>

                <p className="text-xs text-slate-500">
                  Target Keyword: <strong className="text-[#6256D9]">{topic.target_keyword}</strong> • {topic.unique_angle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Workflow Status Selector */}
                <select
                  value={topic.status}
                  onChange={(e) => topic.id && handleStatusChange(topic.id, e.target.value as ContentStatus)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
                >
                  <option value="planned">Planned</option>
                  <option value="draft">Drafting</option>
                  <option value="review">Review</option>
                  <option value="published">Published</option>
                </select>

                <button
                  onClick={() => onGenerateOutline(topic)}
                  className="px-3 py-1.5 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Outline
                </button>

                <button
                  onClick={() => onGenerateArticle(topic)}
                  className="px-3.5 py-1.5 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Write
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
