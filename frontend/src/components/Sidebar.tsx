import React from 'react';
import {
  LayoutDashboard, Building2, KeyRound, CalendarCheck, Network,
  PenTool, Edit3, Link2, MapPin, SearchCheck, FolderArchive, Settings,
  ChevronLeft, ChevronRight, Sparkles, Layers
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'profiles'
  | 'keywords'
  | 'strategy'
  | 'clusters'
  | 'outlines'
  | 'generator'
  | 'editor'
  | 'linking'
  | 'localseo'
  | 'audit'
  | 'saved'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapsed,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profiles', label: 'Business Profile', icon: Building2 },
    { id: 'keywords', label: 'Keyword Research', icon: KeyRound },
    { id: 'strategy', label: 'Content Strategy', icon: CalendarCheck },
    { id: 'clusters', label: 'Topic Clusters', icon: Network, badge: 'Map' },
    { id: 'outlines', label: 'Blog Outlines', icon: Layers },
    { id: 'generator', label: 'Blog Generator', icon: PenTool },
    { id: 'editor', label: 'Content Studio', icon: Edit3 },
    { id: 'linking', label: 'Internal Linking', icon: Link2 },
    { id: 'localseo', label: 'Local SEO Studio', icon: MapPin },
    { id: 'audit', label: 'On-Page SEO Audit', icon: SearchCheck },
    { id: 'saved', label: 'Saved Library', icon: FolderArchive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-[#151D2A] border-r border-[#E5DED3] dark:border-[#273347] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#E5DED3] dark:border-[#273347]">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6256D9] to-[#8C80FF] flex items-center justify-center text-white shadow-md shadow-[#6256D9]/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-base font-bold text-[#202936] dark:text-white font-display tracking-tight leading-tight">
                RankCraft AI
              </span>
              <span className="text-[10px] text-[#687080] dark:text-slate-400 font-medium truncate">
                SEO Content Studio
              </span>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-tr from-[#6256D9] to-[#8C80FF] flex items-center justify-center text-white shadow-md shadow-[#6256D9]/20">
            <Sparkles className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapsed}
          className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#6256D9] text-white shadow-sm shadow-[#6256D9]/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#202936] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F0EDFF] text-[#6256D9] dark:bg-[#6256D9]/20 dark:text-[#9B8CFF]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Tagline */}
      {!collapsed && (
        <div className="p-4 mx-3 mb-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1A2232] border border-[#E5DED3] dark:border-[#273347] text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-0.5 font-display">
            RankCraft Engine
          </span>
          Turn keywords into complete topic clusters, outlines, and long-form strategy.
        </div>
      )}
    </aside>
  );
};
