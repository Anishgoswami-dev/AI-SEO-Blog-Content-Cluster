import React from 'react';
import { Project, AppSettingsData } from '../types';
import { Plus, Sun, Moon, Sparkles, FolderKanban, Menu, Key } from 'lucide-react';

interface TopBarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenNewProjectModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  settings: AppSettingsData | null;
  onOpenSettings: () => void;
  onMobileMenuToggle: () => void;
  onQuickGenerate: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProjectModal,
  theme,
  onToggleTheme,
  settings,
  onOpenSettings,
  onMobileMenuToggle,
  onQuickGenerate,
}) => {
  const isKeyConfigured = settings?.gemini_api_key_configured || settings?.openai_api_key_configured;

  return (
    <header className="h-16 px-6 bg-white dark:bg-[#151D2A] border-b border-[#E5DED3] dark:border-[#273347] flex items-center justify-between z-20">
      {/* Left: Mobile hamburger & Project Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-[#6256D9]" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline uppercase tracking-wider font-mono">
            Project:
          </span>
          <select
            value={activeProject?.id || ''}
            onChange={(e) => {
              const selected = projects.find((p) => p.id === Number(e.target.value));
              if (selected) onSelectProject(selected);
            }}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.domain ? `(${p.domain})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenNewProjectModal}
            className="p-1.5 bg-[#FAF8F5] hover:bg-[#F0EDFF] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#6256D9] dark:text-[#9B8CFF] rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Create New Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Quick Actions, AI Key Badge, Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* API Key Status Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all ${
            isKeyConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40'
          }`}
          title="Click to configure AI Provider & Model keys"
        >
          <Key className="w-3 h-3" />
          <span className="hidden sm:inline">
            {isKeyConfigured
              ? `${settings?.active_provider?.toUpperCase()} AI Active`
              : 'Live Key (Settings)'}
          </span>
        </button>

        {/* Quick Write Blog CTA */}
        <button
          onClick={onQuickGenerate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6256D9] hover:bg-[#5045BC] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Generate Content</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
