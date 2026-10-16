import React, { useState } from 'react';
import { TopicCluster, ClusterTopic, ContentStatus } from '../types';
import { Sparkles, FileText, ArrowRight, CheckCircle2, Clock, Eye, Edit3, X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface TopicClusterMapProps {
  cluster: TopicCluster;
  onSelectTopic?: (topic: ClusterTopic) => void;
  onGenerateOutline?: (topic: ClusterTopic) => void;
  onGenerateArticle?: (topic: ClusterTopic) => void;
  onUpdateStatus?: (topicId: number, status: ContentStatus) => void;
}

export const TopicClusterMap: React.FC<TopicClusterMapProps> = ({
  cluster,
  onSelectTopic,
  onGenerateOutline,
  onGenerateArticle,
  onUpdateStatus,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<ClusterTopic | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isPillarSelected, setIsPillarSelected] = useState<boolean>(false);

  const topics = cluster.topics || [];
  const totalNodes = topics.length;

  // Center coordinates for SVG
  const centerX = 450;
  const centerY = 300;
  const radius = Math.max(180, Math.min(220, 160 + totalNodes * 10));

  // Compute positions in circle
  const nodePositions = topics.map((topic, i) => {
    const angle = (i / (totalNodes || 1)) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { topic, x, y, angle };
  });

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'published':
        return { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'review':
        return { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400', dot: 'bg-amber-500' };
      case 'draft':
        return { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400', dot: 'bg-blue-500' };
      default:
        return { bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-400', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className="relative w-full bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl shadow-sm overflow-hidden">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-[#E5DED3] dark:border-[#273347] bg-[#FAF8F5] dark:bg-[#1A2232]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6256D9] animate-pulse"></span>
            <h3 className="text-base font-semibold text-[#202936] dark:text-white font-display">
              {cluster.cluster_name}
            </h3>
          </div>
          <p className="text-xs text-[#687080] dark:text-slate-400 mt-0.5">
            Pillar: <span className="font-medium text-[#6256D9] dark:text-[#9B8CFF]">{cluster.pillar_keyword}</span> • {totalNodes} Supporting Topic Nodes
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="flex items-center bg-white dark:bg-[#20293A] border border-[#E5DED3] dark:border-[#2E3C52] rounded-lg p-0.5">
            <button
              onClick={() => setZoom(prev => Math.max(0.7, prev - 0.1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded text-slate-600 dark:text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-500">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded text-slate-600 dark:text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
              title="Reset Zoom"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative w-full h-[600px] overflow-hidden bg-[#FBF9F6] dark:bg-[#111722] cursor-grab active:cursor-grabbing flex items-center justify-center">
        <svg
          viewBox="0 0 900 600"
          className="w-full h-full select-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="pillarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6256D9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6256D9" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6256D9" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9B8CFF" stopOpacity="0.3" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6256D9" opacity="0.6" />
            </marker>
          </defs>

          {/* Background Ambient Aura */}
          <circle cx={centerX} cy={centerY} r={radius + 80} fill="url(#pillarGlow)" />
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#6256D9" strokeWidth="1" strokeDasharray="4 6" opacity="0.25" />

          {/* Connection Lines from Pillar to Supporting Spokes */}
          {nodePositions.map(({ topic, x, y }, idx) => {
            const isSelected = selectedTopic?.id === topic.id;
            // Quadratic curve control point slightly off center for elegant organic curve
            const midX = (centerX + x) / 2 + (y - centerY) * 0.08;
            const midY = (centerY + y) / 2 - (x - centerX) * 0.08;
            return (
              <g key={`edge-${topic.id || idx}`}>
                <path
                  d={`M ${centerX} ${centerY} Q ${midX} ${midY} ${x} ${y}`}
                  fill="none"
                  stroke={isSelected ? '#6256D9' : 'rgba(98, 86, 217, 0.35)'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={isSelected ? 'none' : '4 4'}
                  markerEnd="url(#arrow)"
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* Pillar Central Node */}
          <g
            className="cursor-pointer group"
            onClick={() => {
              setIsPillarSelected(true);
              setSelectedTopic(null);
            }}
          >
            <circle
              cx={centerX}
              cy={centerY}
              r="62"
              fill="#6256D9"
              className="transition-all duration-300 drop-shadow-lg group-hover:scale-105"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r="68"
              fill="none"
              stroke="#6256D9"
              strokeWidth="2"
              strokeOpacity="0.4"
              className="animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <foreignObject x={centerX - 55} y={centerY - 45} width="110" height="90">
              <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-200 font-semibold bg-white/20 px-2 py-0.5 rounded-full mb-1">
                  PILLAR PAGE
                </span>
                <span className="text-[11px] font-medium leading-tight line-clamp-2">
                  {cluster.pillar_keyword}
                </span>
              </div>
            </foreignObject>
          </g>

          {/* Supporting Spoke Nodes */}
          {nodePositions.map(({ topic, x, y }, idx) => {
            const isSelected = selectedTopic?.id === topic.id;
            const nodeW = 140;
            const nodeH = 76;

            return (
              <g
                key={`node-${topic.id || idx}`}
                className="cursor-pointer transition-all duration-300"
                onClick={() => {
                  setSelectedTopic(topic);
                  setIsPillarSelected(false);
                  if (onSelectTopic) onSelectTopic(topic);
                }}
              >
                {/* Node Box */}
                <rect
                  x={x - nodeW / 2}
                  y={y - nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx="12"
                  fill="white"
                  stroke={isSelected ? '#6256D9' : '#E5DED3'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  className="dark:fill-[#1E2738] dark:stroke-[#2E3C52] drop-shadow-md hover:drop-shadow-lg transition-all"
                />

                {/* Status Dot */}
                <circle
                  cx={x - nodeW / 2 + 14}
                  cy={y - nodeH / 2 + 14}
                  r="4"
                  className={
                    topic.status === 'published' ? 'fill-emerald-500' :
                    topic.status === 'review' ? 'fill-amber-500' :
                    topic.status === 'draft' ? 'fill-blue-500' : 'fill-slate-400'
                  }
                />

                {/* Node Text */}
                <foreignObject x={x - nodeW / 2 + 8} y={y - nodeH / 2 + 8} width={nodeW - 16} height={nodeH - 16}>
                  <div className="w-full h-full flex flex-col justify-between text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-4 font-semibold">
                        Seq #{topic.publication_sequence}
                      </span>
                      <span className="text-[9px] font-medium uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                        {topic.search_intent}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#202936] dark:text-slate-200 line-clamp-2 leading-tight">
                      {topic.title}
                    </div>
                    <div className="text-[9px] text-[#6256D9] dark:text-[#A195FF] truncate font-medium">
                      🔑 {topic.target_keyword}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-[#1A2232]/90 backdrop-blur-sm border border-[#E5DED3] dark:border-[#273347] rounded-xl p-3 text-xs shadow-sm flex flex-col gap-1.5 pointer-events-auto">
          <span className="font-semibold text-slate-700 dark:text-slate-200 font-display">Cluster Status</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Published
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Review
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Draft
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Planned
            </span>
          </div>
        </div>

        {/* Side Inspector Drawer (Topic Details) */}
        {(selectedTopic || isPillarSelected) && (
          <div className="absolute top-4 right-4 bottom-4 w-96 bg-white dark:bg-[#1A2232] border border-[#E5DED3] dark:border-[#273347] rounded-2xl shadow-xl p-5 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6256D9] dark:text-[#9B8CFF] font-semibold">
                  {isPillarSelected ? 'Pillar Page Inspector' : 'Cluster Node Inspector'}
                </span>
                <button
                  onClick={() => {
                    setSelectedTopic(null);
                    setIsPillarSelected(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isPillarSelected ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white font-editorial">
                      {cluster.pillar_page_title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Target Keyword: <span className="font-semibold text-[#6256D9]">{cluster.pillar_keyword}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-[#F0EDFF] dark:bg-[#6256D9]/15 rounded-xl text-xs text-[#202936] dark:text-slate-200">
                    <span className="font-semibold text-[#6256D9] block mb-1">Topical Hierarchy Role</span>
                    Acts as the master cornerstone page for this cluster. All {totalNodes} supporting spokes link back to this URL to funnel authority and rankings.
                  </div>

                  {cluster.cannibalization_warnings && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <span className="font-semibold block mb-0.5">Cannibalization Safeguard:</span>
                      {cluster.cannibalization_warnings}
                    </div>
                  )}
                </div>
              ) : selectedTopic ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {selectedTopic.search_intent} intent
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Pub Sequence #{selectedTopic.publication_sequence}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white font-editorial leading-snug">
                      {selectedTopic.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Target Keyword: <span className="font-semibold text-[#6256D9]">{selectedTopic.target_keyword}</span>
                    </p>
                  </div>

                  {selectedTopic.unique_angle && (
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Unique Angle & Value:
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
                        {selectedTopic.unique_angle}
                      </p>
                    </div>
                  )}

                  {selectedTopic.suggested_internal_links && selectedTopic.suggested_internal_links.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Suggested Internal Links:
                      </span>
                      <ul className="space-y-1">
                        {selectedTopic.suggested_internal_links.map((link, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <span className="text-[#6256D9] mt-0.5">↳</span>
                            <span>{link}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Status Dropdown */}
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Workflow Status:
                    </span>
                    <select
                      value={selectedTopic.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as ContentStatus;
                        if (selectedTopic.id && onUpdateStatus) {
                          onUpdateStatus(selectedTopic.id, newStatus);
                        }
                        setSelectedTopic({ ...selectedTopic, status: newStatus });
                      }}
                      className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
                    >
                      <option value="planned">Planned (In Roadmap)</option>
                      <option value="draft">Draft (Writing in Progress)</option>
                      <option value="review">Review (Editorial Check)</option>
                      <option value="published">Published (Live On Site)</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            {selectedTopic && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-4">
                <button
                  onClick={() => onGenerateOutline && onGenerateOutline(selectedTopic)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#F0EDFF] hover:bg-[#E4DFFF] dark:bg-[#6256D9]/20 dark:hover:bg-[#6256D9]/30 text-[#6256D9] dark:text-[#9B8CFF] font-medium text-xs rounded-xl transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generate H1–H3 Outline
                </button>
                <button
                  onClick={() => onGenerateArticle && onGenerateArticle(selectedTopic)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#6256D9] hover:bg-[#5045BC] text-white font-medium text-xs rounded-xl transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Write Long-Form Article
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
