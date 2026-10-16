export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';
export type ContentStatus = 'planned' | 'draft' | 'review' | 'published';

export interface Project {
  id: number;
  name: string;
  domain?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  articles_count?: number;
  clusters_count?: number;
  keywords_count?: number;
}

export interface BusinessProfile {
  id: number;
  project_id: number;
  business_name: string;
  website_url?: string;
  industry: string;
  products_services: string;
  target_audience: string;
  target_country: string;
  target_city?: string;
  primary_language: string;
  brand_voice: string;
  content_goals?: string;
  competitor_urls?: string;
  existing_pages?: Array<{ title: string; url: string }>;
  brand_guidelines?: string;
  preferred_terms?: string;
  phrases_to_avoid?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KeywordItem {
  id?: number;
  project_id?: number;
  keyword: string;
  intent: SearchIntent;
  audience?: string;
  likely_question?: string;
  suggested_format?: string;
  suggested_angle?: string;
  funnel_stage: FunnelStage;
  business_relevance: string;
  target_page_type: string;
  category: 'primary' | 'secondary' | 'long_tail' | 'question' | 'local';
  search_volume_label?: string;
  difficulty_label?: string;
  is_measured?: boolean;
}

export interface ClusterTopic {
  id?: number;
  cluster_id?: number;
  title: string;
  target_keyword: string;
  search_intent: SearchIntent;
  unique_angle?: string;
  relationship_to_pillar: 'Pillar' | 'Supporting' | 'Sub-guide';
  suggested_internal_links?: string[];
  publication_sequence: number;
  status: ContentStatus;
}

export interface TopicCluster {
  id: number;
  project_id: number;
  cluster_name: string;
  main_topic: string;
  pillar_keyword: string;
  pillar_page_title: string;
  cannibalization_warnings?: string;
  created_at?: string;
  topics: ClusterTopic[];
}

export interface OutlineSection {
  h2: string;
  h3s?: string[];
  key_points?: string[];
  estimated_words?: number;
}

export interface Outline {
  id?: number;
  project_id?: number;
  title: string;
  h1: string;
  primary_keyword: string;
  search_intent: SearchIntent;
  target_audience?: string;
  reader_problem?: string;
  unique_angle?: string;
  sections: OutlineSection[];
  questions?: string[];
  examples?: string[];
  internal_links?: string[];
  conclusion_objectives?: string;
  cta?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SEOCheckItem {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  weight: number;
  message: string;
}

export interface SEOChecklist {
  score: number;
  max_score: number;
  score_label: string;
  passed_count: number;
  warning_count: number;
  fail_count: number;
  checks: SEOCheckItem[];
  readability: {
    flesch_reading_ease: number;
    grade_level: number;
    reading_level_label: string;
    total_words: number;
    total_sentences: number;
    avg_sentence_length: number;
  };
  word_count: number;
  heading_summary: {
    h1: string;
    h2_count: number;
    h3_count: number;
  };
  disclaimer: string;
}

export interface Article {
  id: number;
  project_id: number;
  outline_id?: number;
  title: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  h1: string;
  body_markdown: string;
  word_count: number;
  reading_time: number;
  status: ContentStatus;
  target_keyword: string;
  secondary_keywords?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  image_concepts?: Array<{ concept: string; alt_text: string }>;
  internal_links?: Array<{ anchor: string; target_topic: string; reason: string }>;
  external_sources?: Array<{ source_type: string; note: string }>;
  schema_type: string;
  schema_json?: Record<string, any>;
  seo_score: number;
  seo_checklist?: SEOChecklist;
  created_at?: string;
  updated_at?: string;
}

export interface InternalLinkItem {
  id?: number;
  project_id?: number;
  source_title: string;
  source_url?: string;
  target_title: string;
  target_url: string;
  anchor_text: string;
  reason?: string;
  topic_cluster?: string;
  status: 'suggested' | 'accepted' | 'rejected';
}

export interface LocalSEOPack {
  service: string;
  city: string;
  target_keyword: string;
  page_title: string;
  meta_description: string;
  outline: string[];
  faqs: Array<{ question: string; answer: string }>;
  blog_ideas: string[];
  call_to_action: string;
  safeguard_notice: string;
}

export interface AppSettingsData {
  gemini_api_key_configured: boolean;
  gemini_api_key_masked: string;
  openai_api_key_configured: boolean;
  openai_api_key_masked: string;
  active_provider: string;
  active_model: string;
  custom_instructions: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  total_articles: number;
  published_articles: number;
  drafts_awaiting_review: number;
  total_planned_topics: number;
  total_topic_clusters: number;
  total_topics: number;
  total_keywords_analyzed: number;
  total_projects: number;
}
