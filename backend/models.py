import os
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

def utc_now():
    return datetime.now(timezone.utc)

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "rankcraft.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    profiles = relationship("BusinessProfile", back_populates="project", cascade="all, delete-orphan")
    keywords = relationship("KeywordItem", back_populates="project", cascade="all, delete-orphan")
    clusters = relationship("TopicCluster", back_populates="project", cascade="all, delete-orphan")
    outlines = relationship("Outline", back_populates="project", cascade="all, delete-orphan")
    articles = relationship("Article", back_populates="project", cascade="all, delete-orphan")
    internal_links = relationship("InternalLink", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "domain": self.domain,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "articles_count": len(self.articles),
            "clusters_count": len(self.clusters),
            "keywords_count": len(self.keywords),
        }

class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    business_name = Column(String(255), nullable=False)
    website_url = Column(String(500), nullable=True)
    industry = Column(String(255), nullable=False)
    products_services = Column(Text, nullable=False)
    target_audience = Column(Text, nullable=False)
    target_country = Column(String(100), default="United States")
    target_city = Column(String(100), nullable=True)
    primary_language = Column(String(50), default="English")
    brand_voice = Column(String(100), default="Authoritative & Helpful")
    content_goals = Column(Text, nullable=True)
    competitor_urls = Column(Text, nullable=True) # JSON array or comma separated
    existing_pages = Column(Text, nullable=True) # JSON array of {title, url}
    brand_guidelines = Column(Text, nullable=True)
    preferred_terms = Column(Text, nullable=True)
    phrases_to_avoid = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="profiles")

    def to_dict(self):
        existing_pages_parsed = []
        if self.existing_pages:
            try:
                existing_pages_parsed = json.loads(self.existing_pages)
            except Exception:
                existing_pages_parsed = [p.strip() for p in self.existing_pages.split(",") if p.strip()]

        return {
            "id": self.id,
            "project_id": self.project_id,
            "business_name": self.business_name,
            "website_url": self.website_url,
            "industry": self.industry,
            "products_services": self.products_services,
            "target_audience": self.target_audience,
            "target_country": self.target_country,
            "target_city": self.target_city,
            "primary_language": self.primary_language,
            "brand_voice": self.brand_voice,
            "content_goals": self.content_goals,
            "competitor_urls": self.competitor_urls,
            "existing_pages": existing_pages_parsed,
            "brand_guidelines": self.brand_guidelines,
            "preferred_terms": self.preferred_terms,
            "phrases_to_avoid": self.phrases_to_avoid,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class KeywordItem(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    keyword = Column(String(255), nullable=False)
    intent = Column(String(50), default="informational") # informational, commercial, transactional, navigational
    audience = Column(String(255), nullable=True)
    likely_question = Column(Text, nullable=True)
    suggested_format = Column(String(100), nullable=True)
    suggested_angle = Column(Text, nullable=True)
    funnel_stage = Column(String(50), default="TOFU") # TOFU, MOFU, BOFU
    business_relevance = Column(String(50), default="High")
    target_page_type = Column(String(100), default="Blog Post")
    category = Column(String(50), default="primary") # primary, secondary, long_tail, question, local
    search_volume_label = Column(String(50), default="Live Volume Requires Search API")
    difficulty_label = Column(String(50), default="Not Measured")
    is_measured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="keywords")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "keyword": self.keyword,
            "intent": self.intent,
            "audience": self.audience,
            "likely_question": self.likely_question,
            "suggested_format": self.suggested_format,
            "suggested_angle": self.suggested_angle,
            "funnel_stage": self.funnel_stage,
            "business_relevance": self.business_relevance,
            "target_page_type": self.target_page_type,
            "category": self.category,
            "search_volume_label": self.search_volume_label,
            "difficulty_label": self.difficulty_label,
            "is_measured": self.is_measured,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class TopicCluster(Base):
    __tablename__ = "topic_clusters"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    cluster_name = Column(String(255), nullable=False)
    main_topic = Column(String(255), nullable=False)
    pillar_keyword = Column(String(255), nullable=False)
    pillar_page_title = Column(String(255), nullable=False)
    cannibalization_warnings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="clusters")
    topics = relationship("ClusterTopic", back_populates="cluster", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "cluster_name": self.cluster_name,
            "main_topic": self.main_topic,
            "pillar_keyword": self.pillar_keyword,
            "pillar_page_title": self.pillar_page_title,
            "cannibalization_warnings": self.cannibalization_warnings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "topics": [t.to_dict() for t in self.topics],
        }

class ClusterTopic(Base):
    __tablename__ = "cluster_topics"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("topic_clusters.id"), nullable=False)
    title = Column(String(255), nullable=False)
    target_keyword = Column(String(255), nullable=False)
    search_intent = Column(String(50), default="informational")
    unique_angle = Column(Text, nullable=True)
    relationship_to_pillar = Column(String(100), default="Supporting") # Pillar, Supporting, Sub-guide
    suggested_internal_links = Column(Text, nullable=True)
    publication_sequence = Column(Integer, default=1)
    status = Column(String(50), default="planned") # planned, draft, review, published

    cluster = relationship("TopicCluster", back_populates="topics")

    def to_dict(self):
        links = []
        if self.suggested_internal_links:
            try:
                links = json.loads(self.suggested_internal_links)
            except Exception:
                links = [l.strip() for l in self.suggested_internal_links.split(",") if l.strip()]

        return {
            "id": self.id,
            "cluster_id": self.cluster_id,
            "title": self.title,
            "target_keyword": self.target_keyword,
            "search_intent": self.search_intent,
            "unique_angle": self.unique_angle,
            "relationship_to_pillar": self.relationship_to_pillar,
            "suggested_internal_links": links,
            "publication_sequence": self.publication_sequence,
            "status": self.status,
        }

class Outline(Base):
    __tablename__ = "outlines"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    h1 = Column(String(255), nullable=False)
    primary_keyword = Column(String(255), nullable=False)
    search_intent = Column(String(50), default="informational")
    target_audience = Column(String(255), nullable=True)
    reader_problem = Column(Text, nullable=True)
    unique_angle = Column(Text, nullable=True)
    sections_json = Column(Text, nullable=False) # List of H2/H3 sections
    questions_json = Column(Text, nullable=True)
    examples_json = Column(Text, nullable=True)
    internal_links_json = Column(Text, nullable=True)
    conclusion_objectives = Column(Text, nullable=True)
    cta = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="outlines")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "title": self.title,
            "h1": self.h1,
            "primary_keyword": self.primary_keyword,
            "search_intent": self.search_intent,
            "target_audience": self.target_audience,
            "reader_problem": self.reader_problem,
            "unique_angle": self.unique_angle,
            "sections": json.loads(self.sections_json) if self.sections_json else [],
            "questions": json.loads(self.questions_json) if self.questions_json else [],
            "examples": json.loads(self.examples_json) if self.examples_json else [],
            "internal_links": json.loads(self.internal_links_json) if self.internal_links_json else [],
            "conclusion_objectives": self.conclusion_objectives,
            "cta": self.cta,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    outline_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    meta_title = Column(String(100), nullable=True)
    meta_description = Column(String(300), nullable=True)
    h1 = Column(String(255), nullable=False)
    body_markdown = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    reading_time = Column(Integer, default=1)
    status = Column(String(50), default="draft") # draft, review, published
    target_keyword = Column(String(255), nullable=False)
    secondary_keywords_json = Column(Text, nullable=True)
    faqs_json = Column(Text, nullable=True)
    image_concepts_json = Column(Text, nullable=True)
    internal_links_json = Column(Text, nullable=True)
    external_sources_json = Column(Text, nullable=True)
    schema_type = Column(String(50), default="Article")
    schema_json = Column(Text, nullable=True)
    seo_score = Column(Integer, default=0)
    seo_checklist_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="articles")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "outline_id": self.outline_id,
            "title": self.title,
            "slug": self.slug,
            "meta_title": self.meta_title,
            "meta_description": self.meta_description,
            "h1": self.h1,
            "body_markdown": self.body_markdown,
            "word_count": self.word_count,
            "reading_time": self.reading_time,
            "status": self.status,
            "target_keyword": self.target_keyword,
            "secondary_keywords": json.loads(self.secondary_keywords_json) if self.secondary_keywords_json else [],
            "faqs": json.loads(self.faqs_json) if self.faqs_json else [],
            "image_concepts": json.loads(self.image_concepts_json) if self.image_concepts_json else [],
            "internal_links": json.loads(self.internal_links_json) if self.internal_links_json else [],
            "external_sources": json.loads(self.external_sources_json) if self.external_sources_json else [],
            "schema_type": self.schema_type,
            "schema_json": json.loads(self.schema_json) if self.schema_json else {},
            "seo_score": self.seo_score,
            "seo_checklist": json.loads(self.seo_checklist_json) if self.seo_checklist_json else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class InternalLink(Base):
    __tablename__ = "internal_links"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    source_title = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=True)
    target_title = Column(String(255), nullable=False)
    target_url = Column(String(500), nullable=False)
    anchor_text = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    topic_cluster = Column(String(255), nullable=True)
    status = Column(String(50), default="suggested") # suggested, accepted, rejected
    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="internal_links")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "source_title": self.source_title,
            "source_url": self.source_url,
            "target_title": self.target_title,
            "target_url": self.target_url,
            "anchor_text": self.anchor_text,
            "reason": self.reason,
            "topic_cluster": self.topic_cluster,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True)
    gemini_api_key = Column(String(255), nullable=True)
    openai_api_key = Column(String(255), nullable=True)
    active_provider = Column(String(50), default="gemini") # gemini or openai
    active_model = Column(String(100), default="gemini-1.5-flash")
    custom_instructions = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        # Mask keys for security
        def mask_key(k):
            if not k:
                return ""
            if len(k) <= 8:
                return "••••••••"
            return k[:4] + "••••••••" + k[-4:]

        return {
            "gemini_api_key_configured": bool(self.gemini_api_key),
            "gemini_api_key_masked": mask_key(self.gemini_api_key),
            "openai_api_key_configured": bool(self.openai_api_key),
            "openai_api_key_masked": mask_key(self.openai_api_key),
            "active_provider": self.active_provider,
            "active_model": self.active_model,
            "custom_instructions": self.custom_instructions or "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Ensure default settings row exists
    settings = db.query(AppSettings).first()
    if not settings:
        env_gemini = os.environ.get("GEMINI_API_KEY", "")
        env_openai = os.environ.get("OPENAI_API_KEY", "")
        settings = AppSettings(
            gemini_api_key=env_gemini,
            openai_api_key=env_openai,
            active_provider="gemini" if env_gemini or not env_openai else "openai",
            active_model="gemini-1.5-flash"
        )
        db.add(settings)
        db.commit()
    db.close()
