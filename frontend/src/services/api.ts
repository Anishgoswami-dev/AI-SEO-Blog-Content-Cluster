import {
  Project, BusinessProfile, KeywordItem, TopicCluster,
  ClusterTopic, Outline, Article, InternalLinkItem,
  LocalSEOPack, AppSettingsData, DashboardMetrics, SEOChecklist
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `API Error (${response.status}): ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Metrics & Health
  getHealth: () => fetch('/api/health').then(r => r.json()),
  getDashboardMetrics: (projectId?: number): Promise<{
    metrics: DashboardMetrics;
    recent_articles: Article[];
    recent_keywords: KeywordItem[];
  }> => request(`/dashboard/metrics${projectId ? `?project_id=${projectId}` : ''}`),

  // Projects
  getProjects: (): Promise<Project[]> => request('/projects'),
  createProject: (data: Partial<Project> & { industry?: string; products_services?: string; target_audience?: string; target_city?: string; brand_voice?: string }): Promise<Project> =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getProject: (id: number): Promise<Project & { profile?: BusinessProfile }> => request(`/projects/${id}`),
  deleteProject: (id: number): Promise<{ message: string }> => request(`/projects/${id}`, { method: 'DELETE' }),

  // Business Profiles
  getProfile: (projectId: number): Promise<BusinessProfile> => request(`/projects/${projectId}/profiles`),
  updateProfile: (projectId: number, data: Partial<BusinessProfile>): Promise<BusinessProfile> =>
    request(`/projects/${projectId}/profiles`, { method: 'PUT', body: JSON.stringify(data) }),

  // Keywords
  analyzeKeywords: (data: {
    primary_keyword: string;
    secondary_keywords?: string[] | string;
    target_location?: string;
    project_id?: number;
    save_to_project?: boolean;
    business_name?: string;
    industry?: string;
    target_audience?: string;
  }): Promise<{ keywords: KeywordItem[]; disclaimer: string }> =>
    request('/keywords/analyze', { method: 'POST', body: JSON.stringify(data) }),
  getProjectKeywords: (projectId: number): Promise<KeywordItem[]> => request(`/projects/${projectId}/keywords`),
  deleteKeyword: (id: number): Promise<{ message: string }> => request(`/keywords/${id}`, { method: 'DELETE' }),

  // Topic Clusters
  generateCluster: (data: {
    pillar_topic: string;
    pillar_keyword: string;
    project_id?: number;
    business_name?: string;
    industry?: string;
  }): Promise<TopicCluster> => request('/clusters/generate', { method: 'POST', body: JSON.stringify(data) }),
  getProjectClusters: (projectId: number): Promise<TopicCluster[]> => request(`/projects/${projectId}/clusters`),
  getCluster: (id: number): Promise<TopicCluster> => request(`/clusters/${id}`),
  deleteCluster: (id: number): Promise<{ message: string }> => request(`/clusters/${id}`, { method: 'DELETE' }),
  updateClusterTopic: (topicId: number, data: Partial<ClusterTopic>): Promise<ClusterTopic> =>
    request(`/cluster-topics/${topicId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Outlines
  generateOutline: (data: {
    primary_keyword: string;
    article_title?: string;
    search_intent?: string;
    target_audience?: string;
    length_target?: string;
    project_id?: number;
    save_to_project?: boolean;
  }): Promise<Outline> => request('/outlines/generate', { method: 'POST', body: JSON.stringify(data) }),
  getProjectOutlines: (projectId: number): Promise<Outline[]> => request(`/projects/${projectId}/outlines`),
  updateOutline: (id: number, data: Partial<Outline>): Promise<Outline> =>
    request(`/outlines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOutline: (id: number): Promise<{ message: string }> => request(`/outlines/${id}`, { method: 'DELETE' }),

  // Articles & Studio
  generateArticle: (data: {
    primary_keyword: string;
    outline?: any;
    target_length?: string;
    brand_voice?: string;
    project_id?: number;
    outline_id?: number;
    save_to_project?: boolean;
  }): Promise<Article> => request('/articles/generate', { method: 'POST', body: JSON.stringify(data) }),
  getProjectArticles: (projectId: number): Promise<Article[]> => request(`/projects/${projectId}/articles`),
  getArticle: (id: number): Promise<Article> => request(`/articles/${id}`),
  updateArticle: (id: number, data: Partial<Article>): Promise<Article> =>
    request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArticle: (id: number): Promise<{ message: string }> => request(`/articles/${id}`, { method: 'DELETE' }),
  rewriteSection: (articleId: number, data: { text: string; action: string; instructions?: string }): Promise<{ revised_text: string; explanation: string }> =>
    request(`/articles/${articleId}/rewrite`, { method: 'POST', body: JSON.stringify(data) }),

  // Internal Linking
  suggestInternalLinks: (data: { project_id?: number }): Promise<{
    suggestions: InternalLinkItem[];
    total_suggestions: number;
    verified_rules: string;
  }> => request('/internal-links/suggest', { method: 'POST', body: JSON.stringify(data) }),
  getProjectInternalLinks: (projectId: number): Promise<InternalLinkItem[]> => request(`/projects/${projectId}/internal-links`),
  saveInternalLink: (data: Partial<InternalLinkItem>): Promise<InternalLinkItem> =>
    request('/internal-links', { method: 'POST', body: JSON.stringify(data) }),

  // Local SEO
  generateLocalSEO: (data: {
    service: string;
    city: string;
    project_id?: number;
    target_audience?: string;
    primary_keyword?: string;
    unique_benefits?: string;
    verified_details?: string;
  }): Promise<LocalSEOPack> => request('/local-seo/generate', { method: 'POST', body: JSON.stringify(data) }),

  // On-Page SEO Audit
  runSEOAudit: (data: {
    title: string;
    meta_description: string;
    body_markdown: string;
    primary_keyword: string;
    h1?: string;
  }): Promise<SEOChecklist> => request('/seo-audit/analyze', { method: 'POST', body: JSON.stringify(data) }),

  // Metadata & Schema
  generateMetadata: (data: {
    title: string;
    primary_keyword: string;
    body_markdown?: string;
    business_name?: string;
    canonical_url?: string;
    schema_type?: string;
    faqs?: Array<{ question: string; answer: string }>;
  }): Promise<{
    slug: string;
    meta_title: string;
    meta_description: string;
    open_graph: Record<string, string>;
    twitter_card: Record<string, string>;
    schema_json: Record<string, any>;
  }> => request('/metadata/generate', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: (): Promise<AppSettingsData> => request('/settings'),
  updateSettings: (data: Partial<{
    gemini_api_key: string;
    openai_api_key: string;
    active_provider: string;
    active_model: string;
    custom_instructions: string;
  }>): Promise<AppSettingsData> => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
};
