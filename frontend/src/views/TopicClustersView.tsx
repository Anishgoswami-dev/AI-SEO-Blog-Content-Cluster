import React, { useState, useEffect } from 'react';
import { Project, TopicCluster, ClusterTopic, ContentStatus } from '../types';
import { api } from '../services/api';
import { TopicClusterMap } from '../components/TopicClusterMap';
import { Network, Plus, Trash2, Sparkles, AlertCircle, Layers, FileText, CheckCircle2 } from 'lucide-react';

interface TopicClustersViewProps {
  activeProject: Project | null;
  onGenerateOutline: (topic: ClusterTopic) => void;
  onGenerateArticle: (topic: ClusterTopic) => void;
  initialKeyword?: string;
}

export const TopicClustersView: React.FC<TopicClustersViewProps> = ({
  activeProject,
  onGenerateOutline,
  onGenerateArticle,
  initialKeyword,
}) => {
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<TopicCluster | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Cluster Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pillarTopic, setPillarTopic] = useState('');
  const [pillarKeyword, setPillarKeyword] = useState(initialKeyword || '');

  useEffect(() => {
    if (initialKeyword) {
      setPillarKeyword(initialKeyword);
      setPillarTopic(initialKeyword.charAt(0).toUpperCase() + initialKeyword.slice(1));
      setIsModalOpen(true);
    }
  }, [initialKeyword]);

  const loadClusters = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api.getProjectClusters(activeProject.id);
      setClusters(data);
      if (data.length > 0 && !selectedCluster) {
        setSelectedCluster(data[0]);
      } else if (selectedCluster) {
        const found = data.find((c) => c.id === selectedCluster.id);
        if (found) setSelectedCluster(found);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, [activeProject?.id]);

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillarTopic.trim() || !pillarKeyword.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const created = await api.generateCluster({
        pillar_topic: pillarTopic.trim(),
        pillar_keyword: pillarKeyword.trim(),
        project_id: activeProject?.id,
      });

      setIsModalOpen(false);
      setPillarTopic('');
      setPillarKeyword('');
      await loadClusters();
      setSelectedCluster(created);
    } catch (err: any) {
      setError(err.message || 'Cluster generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCluster = async (id: number) => {
    if (!window.confirm('Delete this topic cluster and all its supporting topics?')) return;
    try {
      await api.deleteCluster(id);
      const remaining = clusters.filter((c) => c.id !== id);
      setClusters(remaining);
      setSelectedCluster(remaining.length > 0 ? remaining[0] : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateTopicStatus = async (topicId: number, status: ContentStatus) => {
    try {
      await api.updateClusterTopic(topicId, { status });
      await loadClusters();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            Topic Clusters & Architecture Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build high-ranking semantic clusters around pillar topics. Visualize internal linking hierarchy and track publication sequence.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Topic Cluster
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Cluster Selector Tabs */}
      {clusters.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] p-3 rounded-2xl shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider pl-2 mr-1">
              Active Cluster:
            </span>
            {clusters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCluster(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCluster?.id === c.id
                    ? 'bg-[#6256D9] text-white shadow-xs font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {c.cluster_name} ({c.topics?.length || 0} topics)
              </button>
            ))}
          </div>

          {selectedCluster && (
            <button
              onClick={() => handleDeleteCluster(selectedCluster.id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg text-xs flex items-center gap-1 transition-colors"
              title="Delete Cluster"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {loading ? (
        <div className="text-center py-24 text-xs font-mono text-slate-400">
          Loading topic clusters...
        </div>
      ) : clusters.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#6256D9] flex items-center justify-center mx-auto mb-3">
            <Network className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-editorial mb-1">
            No Topic Clusters Created Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Topic clusters group multiple related articles around a comprehensive pillar guide. Search engines reward this structure with topical authority.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate First Topic Cluster
          </button>
        </div>
      ) : (
        selectedCluster && (
          <div className="space-y-6">
            {/* Interactive Visual Cluster Map */}
            <TopicClusterMap
              cluster={selectedCluster}
              onGenerateOutline={onGenerateOutline}
              onGenerateArticle={onGenerateArticle}
              onUpdateStatus={handleUpdateTopicStatus}
            />

            {/* Topics Publishing Sequence List */}
            <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display mb-4">
                Recommended Publishing Sequence & Internal Linking Plan
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedCluster.topics?.map((topic, i) => (
                  <div key={topic.id || i} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {topic.publication_sequence}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-editorial">
                          {topic.title}
                        </h4>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {topic.search_intent}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 pl-7">
                        Target Keyword: <strong className="text-[#6256D9] font-medium">{topic.target_keyword}</strong> • {topic.unique_angle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pl-7 md:pl-0 shrink-0">
                      <button
                        onClick={() => onGenerateOutline(topic)}
                        className="px-3 py-1.5 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 text-[#6256D9] dark:text-[#9B8CFF] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Outline
                      </button>
                      <button
                        onClick={() => onGenerateArticle(topic)}
                        className="px-3 py-1.5 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Write Article
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* Create Cluster Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2232] border border-[#E5DED3] dark:border-[#273347] rounded-3xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold font-editorial text-slate-900 dark:text-white mb-1">
              Generate Topic Cluster
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter a central pillar topic and target keyword. RankCraft AI will generate a complete cornerstone pillar page and 5-6 interconnected supporting articles.
            </p>

            <form onSubmit={handleCreateCluster} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pillar Topic Name *
                </label>
                <input
                  type="text"
                  required
                  value={pillarTopic}
                  onChange={(e) => setPillarTopic(e.target.value)}
                  placeholder="e.g. Website Development Services"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pillar Page Primary Keyword *
                </label>
                <input
                  type="text"
                  required
                  value={pillarKeyword}
                  onChange={(e) => setPillarKeyword(e.target.value)}
                  placeholder="e.g. website development services"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
                />
              </div>

              <div className="p-3 bg-[#F0EDFF] dark:bg-[#6256D9]/15 rounded-xl border border-[#6256D9]/20 text-[11px] text-slate-600 dark:text-slate-300">
                ✨ Includes cannibalization checks to ensure supporting articles target distinct search intent without competing with the pillar page.
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
                  disabled={generating}
                  className="px-5 py-2 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {generating ? 'Generating Cluster...' : 'Generate Cluster & Map'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
