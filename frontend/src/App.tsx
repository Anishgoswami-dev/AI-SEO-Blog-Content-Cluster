import React, { useState, useEffect } from 'react';
import { Project, Article, Outline, ClusterTopic, AppSettingsData, DashboardMetrics, KeywordItem } from './types';
import { api } from './services/api';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NewProjectModal } from './components/NewProjectModal';

// Views
import { OverviewView } from './views/OverviewView';
import { BusinessProfilesView } from './views/BusinessProfilesView';
import { KeywordResearchView } from './views/KeywordResearchView';
import { StrategyPlannerView } from './views/StrategyPlannerView';
import { TopicClustersView } from './views/TopicClustersView';
import { OutlineGeneratorView } from './views/OutlineGeneratorView';
import { BlogGeneratorView } from './views/BlogGeneratorView';
import { ContentStudioView } from './views/ContentStudioView';
import { InternalLinkingView } from './views/InternalLinkingView';
import { LocalSEOView } from './views/LocalSEOView';
import { SEOAuditView } from './views/SEOAuditView';
import { SavedContentLibraryView } from './views/SavedContentLibraryView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App & Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<AppSettingsData | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [recentKeywords, setRecentKeywords] = useState<KeywordItem[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);

  // Navigation Transfer State
  const [selectedArticleForStudio, setSelectedArticleForStudio] = useState<Article | null>(null);
  const [transferKeyword, setTransferKeyword] = useState<string>('');
  const [transferOutline, setTransferOutline] = useState<Outline | null>(null);

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load Initial Settings & Projects
  const loadInitialData = async () => {
    try {
      const [projList, settingsData] = await Promise.all([
        api.getProjects(),
        api.getSettings(),
      ]);
      setProjects(projList);
      setSettings(settingsData);

      if (projList.length > 0) {
        const current = activeProject || projList[0];
        setActiveProject(current);
        await loadProjectMetrics(current.id);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  const loadProjectMetrics = async (projectId: number) => {
    try {
      const [metricsData, articlesData] = await Promise.all([
        api.getDashboardMetrics(projectId),
        api.getProjectArticles(projectId),
      ]);
      setMetrics(metricsData.metrics);
      setRecentArticles(metricsData.recent_articles || []);
      setRecentKeywords(metricsData.recent_keywords || []);
      setAllArticles(articlesData || []);
    } catch (e) {
      console.error('Failed to load project metrics:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeProject) {
      loadProjectMetrics(activeProject.id);
    }
  }, [activeProject?.id]);

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    loadProjectMetrics(project.id);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
    loadProjectMetrics(newProject.id);
  };

  // Navigations between views
  const handleGenerateClusterFromKeyword = (kw: string) => {
    setTransferKeyword(kw);
    setActiveTab('clusters');
  };

  const handleGenerateOutlineToKeyword = (kw: string) => {
    setTransferKeyword(kw);
    setActiveTab('outlines');
  };

  const handleClusterTopicOutline = (topic: ClusterTopic) => {
    setTransferKeyword(topic.target_keyword);
    setActiveTab('outlines');
  };

  const handleClusterTopicArticle = (topic: ClusterTopic) => {
    setTransferKeyword(topic.target_keyword);
    setTransferOutline(null);
    setActiveTab('generator');
  };

  const handleOutlineConvertToArticle = (outline: Outline) => {
    setTransferOutline(outline);
    setTransferKeyword(outline.primary_keyword);
    setActiveTab('generator');
  };

  const handleArticleGenerated = (article: Article) => {
    setSelectedArticleForStudio(article);
    setActiveTab('editor');
    if (activeProject) loadProjectMetrics(activeProject.id);
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticleForStudio(article);
    setActiveTab('editor');
  };

  return (
    <div className="flex h-screen bg-[#F7F5F0] dark:bg-[#0E131F] text-[#202936] dark:text-[#E2E8F0] overflow-hidden">
      {/* Sidebar Navigation */}
      <div className={`h-full ${mobileMenuOpen ? 'block fixed inset-y-0 left-0 z-50 shadow-2xl' : 'hidden md:block'}`}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar
          projects={projects}
          activeProject={activeProject}
          onSelectProject={handleSelectProject}
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          settings={settings}
          onOpenSettings={() => setActiveTab('settings')}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onQuickGenerate={() => setActiveTab('generator')}
        />

        {/* View Router */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              recentArticles={recentArticles}
              recentKeywords={recentKeywords}
              activeProject={activeProject}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectArticle={handleSelectArticle}
            />
          )}

          {activeTab === 'profiles' && (
            <BusinessProfilesView
              activeProject={activeProject}
              onProfileUpdated={() => activeProject && loadProjectMetrics(activeProject.id)}
            />
          )}

          {activeTab === 'keywords' && (
            <KeywordResearchView
              activeProject={activeProject}
              onNavigate={(tab) => setActiveTab(tab)}
              onGenerateClusterFromKeyword={handleGenerateClusterFromKeyword}
              onGenerateOutlineToKeyword={handleGenerateOutlineToKeyword}
            />
          )}

          {activeTab === 'strategy' && (
            <StrategyPlannerView
              activeProject={activeProject}
              onGenerateOutline={handleClusterTopicOutline}
              onGenerateArticle={handleClusterTopicArticle}
            />
          )}

          {activeTab === 'clusters' && (
            <TopicClustersView
              activeProject={activeProject}
              initialKeyword={transferKeyword}
              onGenerateOutline={handleClusterTopicOutline}
              onGenerateArticle={handleClusterTopicArticle}
            />
          )}

          {activeTab === 'outlines' && (
            <OutlineGeneratorView
              activeProject={activeProject}
              initialKeyword={transferKeyword}
              onConvertToArticle={handleOutlineConvertToArticle}
            />
          )}

          {activeTab === 'generator' && (
            <BlogGeneratorView
              activeProject={activeProject}
              initialKeyword={transferKeyword}
              initialOutline={transferOutline}
              onArticleGenerated={handleArticleGenerated}
            />
          )}

          {activeTab === 'editor' && (
            <ContentStudioView
              activeProject={activeProject}
              selectedArticle={selectedArticleForStudio}
              onSelectArticle={(art) => setSelectedArticleForStudio(art)}
              onNewArticleClick={() => setActiveTab('generator')}
            />
          )}

          {activeTab === 'linking' && (
            <InternalLinkingView activeProject={activeProject} />
          )}

          {activeTab === 'localseo' && (
            <LocalSEOView activeProject={activeProject} />
          )}

          {activeTab === 'audit' && (
            <SEOAuditView activeProject={activeProject} savedArticles={allArticles} />
          )}

          {activeTab === 'saved' && (
            <SavedContentLibraryView
              activeProject={activeProject}
              onSelectArticleForEdit={handleSelectArticle}
              onNewArticleClick={() => setActiveTab('generator')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              onSettingsUpdated={loadInitialData}
            />
          )}
        </main>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

export default App;
