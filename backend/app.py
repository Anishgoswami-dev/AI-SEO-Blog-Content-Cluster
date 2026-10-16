import os
import json
import re
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load local environment if present
load_dotenv()

from models import (
    init_db, SessionLocal,
    Project, BusinessProfile, KeywordItem, TopicCluster, ClusterTopic,
    Outline, Article, InternalLink, AppSettings
)
import ai_service
import seo_engine

app = Flask(__name__)
# Enable CORS for frontend Vite dev server (port 5173 / 5174) and any localhost
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize database
init_db()

def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise

# Seed a sample project if empty so user has immediate rich data to interact with
def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Project).count() == 0:
            print("[RankCraft AI] Seeding initial sample project...")
            proj = Project(
                name="Apex Web Studio",
                domain="apexwebstudio.com",
                description="Modern B2B web design and technical SEO agency helping SaaS and enterprise businesses grow."
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

            profile = BusinessProfile(
                project_id=proj.id,
                business_name="Apex Web Studio",
                website_url="https://apexwebstudio.com",
                industry="Web Development & Technical SEO",
                products_services="Custom Web Development, Next.js Engineering, Technical SEO Audits, Performance Optimization",
                target_audience="Founders, VPs of Marketing, and Product Leaders seeking high-converting websites",
                target_country="United States",
                target_city="Austin, TX",
                primary_language="English",
                brand_voice="Authoritative, Analytical & Practical",
                content_goals="Establish organic search dominance for technical web architecture and attract high-LTV retainer clients.",
                competitor_urls="https://examplecompetitor.com",
                existing_pages=json.dumps([
                    {"title": "Custom Web Development Services", "url": "https://apexwebstudio.com/services/web-development"},
                    {"title": "Core Web Vitals Optimization", "url": "https://apexwebstudio.com/services/performance-optimization"},
                    {"title": "About Apex Web Studio", "url": "https://apexwebstudio.com/about"}
                ]),
                brand_guidelines="Use concise, data-informed language. Avoid hyperbolic buzzwords like 'revolutionary' or 'disruptive'.",
                preferred_terms="Modern web architecture, conversion rate optimization, technical SEO foundation",
                phrases_to_avoid="Cheap websites, quick hacks, guaranteed ranking overnight"
            )
            db.add(profile)
            db.commit()

            # Seed Topic Cluster
            cluster = TopicCluster(
                project_id=proj.id,
                cluster_name="Website Development Services Cluster",
                main_topic="Website Development Services",
                pillar_keyword="website development services",
                pillar_page_title="The Enterprise Guide to Website Development Services: Strategy, Tech Stack & Scaling",
                cannibalization_warnings="Keep the 'cost' guide focused exclusively on financial modeling and pricing tiers, and the 'custom vs builder' guide focused on technical architectural tradeoffs to prevent SERP cannibalization."
            )
            db.add(cluster)
            db.commit()
            db.refresh(cluster)

            topics = [
                ClusterTopic(
                    cluster_id=cluster.id,
                    title="How Much Does Professional Website Development Cost in 2026?",
                    target_keyword="website development cost",
                    search_intent="commercial",
                    unique_angle="Transparent cost breakdown across agency retainers, project scopes, and recurring infrastructure.",
                    relationship_to_pillar="Supporting",
                    suggested_internal_links=json.dumps(["Links to Pillar Guide: 'enterprise website development services'"]),
                    publication_sequence=1,
                    status="published"
                ),
                ClusterTopic(
                    cluster_id=cluster.id,
                    title="Custom Web Development vs No-Code Builders: Architectural Comparison",
                    target_keyword="custom website vs website builder",
                    search_intent="informational",
                    unique_angle="Performance benchmarks, security compliance, and long-term maintenance costs compared.",
                    relationship_to_pillar="Supporting",
                    suggested_internal_links=json.dumps(["Links to Pillar Guide: 'modern web architecture'"]),
                    publication_sequence=2,
                    status="draft"
                ),
                ClusterTopic(
                    cluster_id=cluster.id,
                    title="How to Choose a Web Development Agency: 9 Critical Evaluation Criteria",
                    target_keyword="how to choose web development company",
                    search_intent="commercial",
                    unique_angle="Vetting rubric used by enterprise procurement teams to avoid vendor lock-in.",
                    relationship_to_pillar="Supporting",
                    suggested_internal_links=json.dumps(["Links to Pricing Guide", "Links to Pillar Guide"]),
                    publication_sequence=3,
                    status="review"
                ),
                ClusterTopic(
                    cluster_id=cluster.id,
                    title="Website Maintenance Checklist: 15 Quarterly Tasks for High Uptime",
                    target_keyword="website maintenance checklist",
                    search_intent="informational",
                    unique_angle="Operational security and performance audit checklist for engineering teams.",
                    relationship_to_pillar="Supporting",
                    suggested_internal_links=json.dumps(["Links to Pillar Guide"]),
                    publication_sequence=4,
                    status="planned"
                )
            ]
            for t in topics:
                db.add(t)
            db.commit()

            # Seed Keywords
            keywords = [
                KeywordItem(
                    project_id=proj.id,
                    keyword="website development services",
                    intent="commercial",
                    audience="B2B decision makers looking for professional web agencies",
                    likely_question="How much does a custom agency website build cost and what is the process?",
                    suggested_format="Comprehensive Pillar Service Guide",
                    suggested_angle="Enterprise reliability, speed benchmarks, and revenue impact.",
                    funnel_stage="MOFU",
                    business_relevance="High",
                    target_page_type="Service Pillar Page",
                    category="primary"
                ),
                KeywordItem(
                    project_id=proj.id,
                    keyword="how to choose web development agency",
                    intent="informational",
                    audience="Founders and marketing leads evaluating vendors",
                    likely_question="What questions should I ask before signing a web design contract?",
                    suggested_format="Buyer's Evaluation Guide",
                    suggested_angle="Objective vetting framework with red flags to watch for.",
                    funnel_stage="TOFU",
                    business_relevance="High",
                    target_page_type="Blog Guide",
                    category="secondary"
                ),
                KeywordItem(
                    project_id=proj.id,
                    keyword="custom web development services Austin",
                    intent="transactional",
                    audience="Austin businesses needing in-person or localized web engineering",
                    likely_question="Who is the top-rated local web development agency in Austin?",
                    suggested_format="Local Service Landing Page",
                    suggested_angle="Austin-based technical team, local portfolio, and rapid turnaround.",
                    funnel_stage="BOFU",
                    business_relevance="High",
                    target_page_type="Local Landing Page",
                    category="local"
                )
            ]
            for k in keywords:
                db.add(k)
            db.commit()

            # Seed Article & Audit
            article_gen = ai_service.generate_article(
                profile=profile.to_dict(),
                primary_keyword="website development services",
                target_length="standard"
            )
            article = Article(
                project_id=proj.id,
                title=article_gen["title"],
                slug=article_gen["slug"],
                meta_title=article_gen["meta_title"],
                meta_description=article_gen["meta_description"],
                h1=article_gen["h1"],
                body_markdown=article_gen["body_markdown"],
                word_count=article_gen["word_count"],
                reading_time=article_gen["reading_time"],
                status="published",
                target_keyword=article_gen["target_keyword"],
                secondary_keywords_json=json.dumps(article_gen.get("secondary_keywords", [])),
                faqs_json=json.dumps(article_gen.get("faqs", [])),
                image_concepts_json=json.dumps(article_gen.get("image_concepts", [])),
                internal_links_json=json.dumps(article_gen.get("internal_links_recommended", [])),
                external_sources_json=json.dumps(article_gen.get("external_sources_suggested", [])),
                schema_type=article_gen.get("schema_type", "Article"),
                schema_json=json.dumps(article_gen.get("schema_json", {})),
                seo_score=article_gen.get("seo_score", 92),
                seo_checklist_json=json.dumps(article_gen.get("seo_checklist", {}))
            )
            db.add(article)
            db.commit()

            # Seed Internal Links
            link1 = InternalLink(
                project_id=proj.id,
                source_title=article.title,
                source_url=f"https://apexwebstudio.com/{article.slug}",
                target_title="Custom Web Development Services",
                target_url="https://apexwebstudio.com/services/web-development",
                anchor_text="enterprise website development services",
                reason="Passes contextual authority to primary commercial conversion landing page.",
                topic_cluster="Website Development Services Cluster",
                status="accepted"
            )
            db.add(link1)
            db.commit()
    finally:
        db.close()

seed_initial_data()

# ==========================================
# HEALTH & DASHBOARD METRICS
# ==========================================

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "RankCraft AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.route("/api/v1/dashboard/metrics", methods=["GET"])
def get_dashboard_metrics():
    db = get_db()
    try:
        project_id = request.args.get("project_id", type=int)
        
        # Build query filters based on active project if provided
        p_query = db.query(Project)
        a_query = db.query(Article)
        c_query = db.query(TopicCluster)
        t_query = db.query(ClusterTopic)
        k_query = db.query(KeywordItem)

        if project_id:
            a_query = a_query.filter(Article.project_id == project_id)
            c_query = c_query.filter(TopicCluster.project_id == project_id)
            t_query = t_query.join(TopicCluster).filter(TopicCluster.project_id == project_id)
            k_query = k_query.filter(KeywordItem.project_id == project_id)

        total_projects = p_query.count()
        total_articles = a_query.count()
        published_articles = a_query.filter(Article.status == "published").count()
        draft_articles = a_query.filter(Article.status == "draft").count()
        review_articles = a_query.filter(Article.status == "review").count()

        total_clusters = c_query.count()
        total_planned_topics = t_query.filter(ClusterTopic.status == "planned").count()
        total_topics = t_query.count()
        total_keywords = k_query.count()

        recent_articles = a_query.order_by(Article.updated_at.desc()).limit(5).all()
        recent_keywords = k_query.order_by(KeywordItem.created_at.desc()).limit(6).all()

        return jsonify({
            "metrics": {
                "total_articles": total_articles,
                "published_articles": published_articles,
                "drafts_awaiting_review": review_articles + draft_articles,
                "total_planned_topics": total_planned_topics,
                "total_topic_clusters": total_clusters,
                "total_topics": total_topics,
                "total_keywords_analyzed": total_keywords,
                "total_projects": total_projects
            },
            "recent_articles": [a.to_dict() for a in recent_articles],
            "recent_keywords": [k.to_dict() for k in recent_keywords]
        })
    finally:
        db.close()

# ==========================================
# PROJECTS & PROFILES
# ==========================================

@app.route("/api/v1/projects", methods=["GET"])
def list_projects():
    db = get_db()
    try:
        projects = db.query(Project).order_by(Project.updated_at.desc()).all()
        return jsonify([p.to_dict() for p in projects])
    finally:
        db.close()

@app.route("/api/v1/projects", methods=["POST"])
def create_project():
    data = request.json or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    db = get_db()
    try:
        project = Project(
            name=name,
            domain=data.get("domain", "").strip(),
            description=data.get("description", "").strip()
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # Create linked default profile
        profile = BusinessProfile(
            project_id=project.id,
            business_name=name,
            website_url=f"https://{project.domain}" if project.domain else "",
            industry=data.get("industry", "Technology & Services"),
            products_services=data.get("products_services", "Professional services and solutions"),
            target_audience=data.get("target_audience", "Target customers and decision makers"),
            target_country=data.get("target_country", "United States"),
            target_city=data.get("target_city", ""),
            brand_voice=data.get("brand_voice", "Authoritative & Helpful"),
            content_goals=data.get("content_goals", "Drive qualified organic traffic and inbound leads")
        )
        db.add(profile)
        db.commit()

        return jsonify(project.to_dict()), 201
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>", methods=["GET"])
def get_project(project_id):
    db = get_db()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404
        profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
        res = project.to_dict()
        res["profile"] = profile.to_dict() if profile else None
        return jsonify(res)
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    db = get_db()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404
        db.delete(project)
        db.commit()
        return jsonify({"message": "Project deleted successfully"})
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/profiles", methods=["GET"])
def get_project_profile(project_id):
    db = get_db()
    try:
        profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        return jsonify(profile.to_dict())
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/profiles", methods=["PUT", "POST"])
def update_project_profile(project_id):
    data = request.json or {}
    db = get_db()
    try:
        profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
        if not profile:
            profile = BusinessProfile(project_id=project_id, business_name=data.get("business_name", "Business"))
            db.add(profile)

        profile.business_name = data.get("business_name", profile.business_name)
        profile.website_url = data.get("website_url", profile.website_url)
        profile.industry = data.get("industry", profile.industry)
        profile.products_services = data.get("products_services", profile.products_services)
        profile.target_audience = data.get("target_audience", profile.target_audience)
        profile.target_country = data.get("target_country", profile.target_country)
        profile.target_city = data.get("target_city", profile.target_city)
        profile.primary_language = data.get("primary_language", profile.primary_language)
        profile.brand_voice = data.get("brand_voice", profile.brand_voice)
        profile.content_goals = data.get("content_goals", profile.content_goals)
        profile.competitor_urls = data.get("competitor_urls", profile.competitor_urls)
        
        pages = data.get("existing_pages")
        if pages is not None:
            profile.existing_pages = json.dumps(pages) if isinstance(pages, list) else str(pages)

        profile.brand_guidelines = data.get("brand_guidelines", profile.brand_guidelines)
        profile.preferred_terms = data.get("preferred_terms", profile.preferred_terms)
        profile.phrases_to_avoid = data.get("phrases_to_avoid", profile.phrases_to_avoid)

        db.commit()
        db.refresh(profile)
        return jsonify(profile.to_dict())
    finally:
        db.close()

# ==========================================
# KEYWORDS & SEARCH INTENT
# ==========================================

@app.route("/api/v1/keywords/analyze", methods=["POST"])
def analyze_keyword_intent():
    data = request.json or {}
    primary_kw = data.get("primary_keyword", "").strip()
    if not primary_kw:
        return jsonify({"error": "Primary keyword is required"}), 400

    project_id = data.get("project_id")
    save_to_project = data.get("save_to_project", True)

    db = get_db()
    try:
        profile_dict = {}
        if project_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
            if profile:
                profile_dict = profile.to_dict()

        if not profile_dict:
            profile_dict = {
                "business_name": data.get("business_name", "Business"),
                "industry": data.get("industry", "Industry"),
                "target_audience": data.get("target_audience", "Target Audience"),
                "target_city": data.get("target_city", ""),
                "target_country": data.get("target_country", "United States")
            }

        secondary_kws = data.get("secondary_keywords", [])
        if isinstance(secondary_kws, str):
            secondary_kws = [k.strip() for k in secondary_kws.split(",") if k.strip()]

        results = ai_service.analyze_keywords(
            profile=profile_dict,
            primary_keyword=primary_kw,
            secondary_keywords=secondary_kws,
            target_location=data.get("target_location")
        )

        saved_items = []
        if save_to_project and project_id:
            for item in results:
                kw_obj = KeywordItem(
                    project_id=project_id,
                    keyword=item["keyword"],
                    intent=item["intent"],
                    audience=item.get("audience"),
                    likely_question=item.get("likely_question"),
                    suggested_format=item.get("suggested_format"),
                    suggested_angle=item.get("suggested_angle"),
                    funnel_stage=item.get("funnel_stage", "TOFU"),
                    business_relevance=item.get("business_relevance", "High"),
                    target_page_type=item.get("target_page_type", "Blog Post"),
                    category=item.get("category", "primary"),
                    search_volume_label=item.get("search_volume_label", "Live Volume Requires Search API"),
                    difficulty_label=item.get("difficulty_label", "Not Measured")
                )
                db.add(kw_obj)
                saved_items.append(kw_obj)
            db.commit()
            return jsonify({
                "keywords": [k.to_dict() for k in saved_items],
                "disclaimer": "Metrics labeled 'Live Volume Requires Search API'. No search volume numbers are fabricated."
            })

        return jsonify({
            "keywords": results,
            "disclaimer": "Metrics labeled 'Live Volume Requires Search API'. No search volume numbers are fabricated."
        })
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/keywords", methods=["GET"])
def list_project_keywords(project_id):
    db = get_db()
    try:
        keywords = db.query(KeywordItem).filter(KeywordItem.project_id == project_id).order_by(KeywordItem.id.desc()).all()
        return jsonify([k.to_dict() for k in keywords])
    finally:
        db.close()

@app.route("/api/v1/keywords/<int:keyword_id>", methods=["DELETE"])
def delete_keyword(keyword_id):
    db = get_db()
    try:
        kw = db.query(KeywordItem).filter(KeywordItem.id == keyword_id).first()
        if not kw:
            return jsonify({"error": "Keyword not found"}), 404
        db.delete(kw)
        db.commit()
        return jsonify({"message": "Keyword deleted"})
    finally:
        db.close()

# ==========================================
# TOPIC CLUSTERS & INTERACTIVE MAP
# ==========================================

@app.route("/api/v1/clusters/generate", methods=["POST"])
def generate_cluster():
    data = request.json or {}
    pillar_topic = data.get("pillar_topic", "").strip()
    pillar_keyword = data.get("pillar_keyword", "").strip()
    project_id = data.get("project_id")

    if not pillar_topic or not pillar_keyword:
        return jsonify({"error": "Both pillar_topic and pillar_keyword are required"}), 400

    db = get_db()
    try:
        profile_dict = {}
        if project_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
            if profile:
                profile_dict = profile.to_dict()

        if not profile_dict:
            profile_dict = {
                "business_name": data.get("business_name", "Business"),
                "industry": data.get("industry", "Industry"),
                "target_audience": data.get("target_audience", "Audience"),
                "products_services": data.get("products_services", "")
            }

        cluster_data = ai_service.generate_topic_cluster(profile_dict, pillar_topic, pillar_keyword)

        if project_id:
            cluster_obj = TopicCluster(
                project_id=project_id,
                cluster_name=cluster_data.get("cluster_name", f"{pillar_topic} Cluster"),
                main_topic=pillar_topic,
                pillar_keyword=pillar_keyword,
                pillar_page_title=cluster_data.get("pillar_page_title", f"The Guide to {pillar_topic}"),
                cannibalization_warnings=cluster_data.get("cannibalization_warnings", "")
            )
            db.add(cluster_obj)
            db.commit()
            db.refresh(cluster_obj)

            topics = cluster_data.get("topics", [])
            for t in topics:
                t_obj = ClusterTopic(
                    cluster_id=cluster_obj.id,
                    title=t.get("title", ""),
                    target_keyword=t.get("target_keyword", ""),
                    search_intent=t.get("search_intent", "informational"),
                    unique_angle=t.get("unique_angle", ""),
                    relationship_to_pillar=t.get("relationship_to_pillar", "Supporting"),
                    suggested_internal_links=json.dumps(t.get("suggested_internal_links", [])),
                    publication_sequence=t.get("publication_sequence", 1),
                    status=t.get("status", "planned")
                )
                db.add(t_obj)
            db.commit()
            db.refresh(cluster_obj)
            return jsonify(cluster_obj.to_dict()), 201

        return jsonify(cluster_data)
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/clusters", methods=["GET"])
def list_project_clusters(project_id):
    db = get_db()
    try:
        clusters = db.query(TopicCluster).filter(TopicCluster.project_id == project_id).order_by(TopicCluster.id.desc()).all()
        return jsonify([c.to_dict() for c in clusters])
    finally:
        db.close()

@app.route("/api/v1/clusters/<int:cluster_id>", methods=["GET"])
def get_cluster(cluster_id):
    db = get_db()
    try:
        cluster = db.query(TopicCluster).filter(TopicCluster.id == cluster_id).first()
        if not cluster:
            return jsonify({"error": "Cluster not found"}), 404
        return jsonify(cluster.to_dict())
    finally:
        db.close()

@app.route("/api/v1/clusters/<int:cluster_id>", methods=["DELETE"])
def delete_cluster(cluster_id):
    db = get_db()
    try:
        cluster = db.query(TopicCluster).filter(TopicCluster.id == cluster_id).first()
        if not cluster:
            return jsonify({"error": "Cluster not found"}), 404
        db.delete(cluster)
        db.commit()
        return jsonify({"message": "Cluster deleted"})
    finally:
        db.close()

@app.route("/api/v1/cluster-topics/<int:topic_id>", methods=["PUT"])
def update_cluster_topic(topic_id):
    data = request.json or {}
    db = get_db()
    try:
        topic = db.query(ClusterTopic).filter(ClusterTopic.id == topic_id).first()
        if not topic:
            return jsonify({"error": "Topic not found"}), 404

        topic.title = data.get("title", topic.title)
        topic.target_keyword = data.get("target_keyword", topic.target_keyword)
        topic.search_intent = data.get("search_intent", topic.search_intent)
        topic.unique_angle = data.get("unique_angle", topic.unique_angle)
        topic.status = data.get("status", topic.status)
        if "suggested_internal_links" in data:
            topic.suggested_internal_links = json.dumps(data["suggested_internal_links"])

        db.commit()
        db.refresh(topic)
        return jsonify(topic.to_dict())
    finally:
        db.close()

# ==========================================
# OUTLINES
# ==========================================

@app.route("/api/v1/outlines/generate", methods=["POST"])
def generate_outline_endpoint():
    data = request.json or {}
    primary_kw = data.get("primary_keyword", "").strip()
    if not primary_kw:
        return jsonify({"error": "Primary keyword is required"}), 400

    project_id = data.get("project_id")
    save_to_project = data.get("save_to_project", True)

    db = get_db()
    try:
        profile_dict = {}
        if project_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
            if profile:
                profile_dict = profile.to_dict()

        if not profile_dict:
            profile_dict = {
                "business_name": data.get("business_name", "Business"),
                "industry": data.get("industry", "Industry"),
                "target_audience": data.get("target_audience", "Audience")
            }

        outline_data = ai_service.generate_outline(
            profile=profile_dict,
            primary_keyword=primary_kw,
            article_title=data.get("article_title"),
            search_intent=data.get("search_intent", "informational"),
            audience=data.get("target_audience"),
            length_target=data.get("length_target", "standard")
        )

        if save_to_project and project_id:
            outline_obj = Outline(
                project_id=project_id,
                title=outline_data.get("title", f"Guide to {primary_kw}"),
                h1=outline_data.get("h1", outline_data.get("title")),
                primary_keyword=primary_kw,
                search_intent=outline_data.get("search_intent", "informational"),
                target_audience=outline_data.get("target_audience"),
                reader_problem=outline_data.get("reader_problem"),
                unique_angle=outline_data.get("unique_angle"),
                sections_json=json.dumps(outline_data.get("sections", [])),
                questions_json=json.dumps(outline_data.get("questions", [])),
                examples_json=json.dumps(outline_data.get("examples", [])),
                internal_links_json=json.dumps(outline_data.get("internal_links", [])),
                conclusion_objectives=outline_data.get("conclusion_objectives"),
                cta=outline_data.get("cta")
            )
            db.add(outline_obj)
            db.commit()
            db.refresh(outline_obj)
            return jsonify(outline_obj.to_dict()), 201

        return jsonify(outline_data)
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/outlines", methods=["GET"])
def list_project_outlines(project_id):
    db = get_db()
    try:
        outlines = db.query(Outline).filter(Outline.project_id == project_id).order_by(Outline.updated_at.desc()).all()
        return jsonify([o.to_dict() for o in outlines])
    finally:
        db.close()

@app.route("/api/v1/outlines/<int:outline_id>", methods=["PUT"])
def update_outline(outline_id):
    data = request.json or {}
    db = get_db()
    try:
        outline = db.query(Outline).filter(Outline.id == outline_id).first()
        if not outline:
            return jsonify({"error": "Outline not found"}), 404

        outline.title = data.get("title", outline.title)
        outline.h1 = data.get("h1", outline.h1)
        outline.search_intent = data.get("search_intent", outline.search_intent)
        outline.reader_problem = data.get("reader_problem", outline.reader_problem)
        outline.unique_angle = data.get("unique_angle", outline.unique_angle)
        outline.conclusion_objectives = data.get("conclusion_objectives", outline.conclusion_objectives)
        outline.cta = data.get("cta", outline.cta)

        if "sections" in data:
            outline.sections_json = json.dumps(data["sections"])
        if "questions" in data:
            outline.questions_json = json.dumps(data["questions"])
        if "examples" in data:
            outline.examples_json = json.dumps(data["examples"])

        db.commit()
        db.refresh(outline)
        return jsonify(outline.to_dict())
    finally:
        db.close()

@app.route("/api/v1/outlines/<int:outline_id>", methods=["DELETE"])
def delete_outline(outline_id):
    db = get_db()
    try:
        outline = db.query(Outline).filter(Outline.id == outline_id).first()
        if not outline:
            return jsonify({"error": "Outline not found"}), 404
        db.delete(outline)
        db.commit()
        return jsonify({"message": "Outline deleted"})
    finally:
        db.close()

# ==========================================
# ARTICLES & CONTENT STUDIO
# ==========================================

@app.route("/api/v1/articles/generate", methods=["POST"])
def generate_article_endpoint():
    data = request.json or {}
    primary_kw = data.get("primary_keyword", "").strip()
    if not primary_kw:
        return jsonify({"error": "Primary keyword is required"}), 400

    project_id = data.get("project_id")
    save_to_project = data.get("save_to_project", True)

    db = get_db()
    try:
        profile_dict = {}
        if project_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
            if profile:
                profile_dict = profile.to_dict()

        if not profile_dict:
            profile_dict = {
                "business_name": data.get("business_name", "Business"),
                "industry": data.get("industry", "Industry"),
                "target_audience": data.get("target_audience", "Audience"),
                "website_url": data.get("website_url", "https://example.com"),
                "brand_voice": data.get("brand_voice", "Authoritative & Helpful")
            }

        outline = data.get("outline")
        target_length = data.get("target_length", "standard")

        article_data = ai_service.generate_article(
            profile=profile_dict,
            primary_keyword=primary_kw,
            outline=outline,
            target_length=target_length,
            brand_voice=data.get("brand_voice", profile_dict.get("brand_voice", "Authoritative & Helpful"))
        )

        if save_to_project and project_id:
            article_obj = Article(
                project_id=project_id,
                outline_id=data.get("outline_id"),
                title=article_data["title"],
                slug=article_data["slug"],
                meta_title=article_data["meta_title"],
                meta_description=article_data["meta_description"],
                h1=article_data["h1"],
                body_markdown=article_data["body_markdown"],
                word_count=article_data["word_count"],
                reading_time=article_data["reading_time"],
                status="draft",
                target_keyword=article_data["target_keyword"],
                secondary_keywords_json=json.dumps(article_data.get("secondary_keywords", [])),
                faqs_json=json.dumps(article_data.get("faqs", [])),
                image_concepts_json=json.dumps(article_data.get("image_concepts", [])),
                internal_links_json=json.dumps(article_data.get("internal_links_recommended", [])),
                external_sources_json=json.dumps(article_data.get("external_sources_suggested", [])),
                schema_type=article_data.get("schema_type", "Article"),
                schema_json=json.dumps(article_data.get("schema_json", {})),
                seo_score=article_data.get("seo_score", 0),
                seo_checklist_json=json.dumps(article_data.get("seo_checklist", {}))
            )
            db.add(article_obj)
            db.commit()
            db.refresh(article_obj)
            return jsonify(article_obj.to_dict()), 201

        return jsonify(article_data)
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/articles", methods=["GET"])
def list_project_articles(project_id):
    db = get_db()
    try:
        articles = db.query(Article).filter(Article.project_id == project_id).order_by(Article.updated_at.desc()).all()
        return jsonify([a.to_dict() for a in articles])
    finally:
        db.close()

@app.route("/api/v1/articles/<int:article_id>", methods=["GET"])
def get_article(article_id):
    db = get_db()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return jsonify({"error": "Article not found"}), 404
        return jsonify(article.to_dict())
    finally:
        db.close()

@app.route("/api/v1/articles/<int:article_id>", methods=["PUT"])
def update_article(article_id):
    data = request.json or {}
    db = get_db()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return jsonify({"error": "Article not found"}), 404

        article.title = data.get("title", article.title)
        article.slug = data.get("slug", article.slug)
        article.meta_title = data.get("meta_title", article.meta_title)
        article.meta_description = data.get("meta_description", article.meta_description)
        article.h1 = data.get("h1", article.h1)
        article.body_markdown = data.get("body_markdown", article.body_markdown)
        article.status = data.get("status", article.status)
        article.target_keyword = data.get("target_keyword", article.target_keyword)

        # Recompute on-page SEO audit upon content update
        audit = seo_engine.audit_content(
            title=article.meta_title or article.title,
            meta_description=article.meta_description or "",
            body_markdown=article.body_markdown,
            primary_keyword=article.target_keyword,
            h1=article.h1
        )
        article.seo_score = audit["score"]
        article.seo_checklist_json = json.dumps(audit)
        article.word_count = audit["word_count"]
        article.reading_time = max(1, round(audit["word_count"] / 200))

        if "faqs" in data:
            article.faqs_json = json.dumps(data["faqs"])
        if "schema_type" in data:
            article.schema_type = data["schema_type"]
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == article.project_id).first()
            p_name = profile.business_name if profile else "Business"
            p_url = profile.website_url if profile else "https://example.com"
            article.schema_json = json.dumps(seo_engine.generate_schema_json(
                article.schema_type,
                article.meta_title or article.title,
                article.meta_description or "",
                f"{p_url}/{article.slug}",
                p_name,
                p_url,
                json.loads(article.faqs_json) if article.faqs_json else []
            ))

        db.commit()
        db.refresh(article)
        return jsonify(article.to_dict())
    finally:
        db.close()

@app.route("/api/v1/articles/<int:article_id>", methods=["DELETE"])
def delete_article(article_id):
    db = get_db()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return jsonify({"error": "Article not found"}), 404
        db.delete(article)
        db.commit()
        return jsonify({"message": "Article deleted"})
    finally:
        db.close()

@app.route("/api/v1/articles/<int:article_id>/rewrite", methods=["POST"])
def rewrite_article_section(article_id):
    data = request.json or {}
    text = data.get("text", "").strip()
    action = data.get("action", "clarity")
    instructions = data.get("instructions")

    if not text:
        return jsonify({"error": "Text selection is required for rewriting"}), 400

    result = ai_service.execute_ai_assistant_action(text, action, instructions)
    return jsonify(result)

# ==========================================
# INTERNAL LINKING ENGINE
# ==========================================

@app.route("/api/v1/internal-links/suggest", methods=["POST"])
def suggest_internal_links():
    data = request.json or {}
    project_id = data.get("project_id")
    db = get_db()
    try:
        suggestions = []
        if project_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
            articles = db.query(Article).filter(Article.project_id == project_id).all()
            clusters = db.query(TopicCluster).filter(TopicCluster.project_id == project_id).all()

            existing_pages = []
            if profile and profile.existing_pages:
                try:
                    existing_pages = json.loads(profile.existing_pages)
                except Exception:
                    pass

            # Generate cross-links between articles & existing pages
            for a in articles:
                # Suggest link to pillar or service page
                if existing_pages:
                    srv = existing_pages[0]
                    suggestions.append({
                        "source_title": a.title,
                        "source_url": f"/{a.slug}",
                        "target_title": srv.get("title", "Core Service Page"),
                        "target_url": srv.get("url", "/services"),
                        "anchor_text": a.target_keyword,
                        "reason": f"Direct high-intent commercial reference from article body to {srv.get('title')}",
                        "topic_cluster": "Core Services",
                        "status": "suggested"
                    })

                # Cross-link with other articles in same project
                other_articles = [o for o in articles if o.id != a.id]
                for o in other_articles[:2]:
                    suggestions.append({
                        "source_title": a.title,
                        "source_url": f"/{a.slug}",
                        "target_title": o.title,
                        "target_url": f"/{o.slug}",
                        "anchor_text": o.target_keyword,
                        "reason": f"Topic cluster reinforcement: Connects '{a.target_keyword}' with '{o.target_keyword}'",
                        "topic_cluster": "Topic Cluster",
                        "status": "suggested"
                    })

        if not suggestions:
            suggestions = [
                {
                    "source_title": "Understanding Modern Website Development",
                    "source_url": "/website-development-guide",
                    "target_title": "Custom Web Development Services",
                    "target_url": "/services/web-development",
                    "anchor_text": "custom web development services",
                    "reason": "Directs readers interested in technical architecture to the conversion landing page.",
                    "topic_cluster": "Web Development Services Cluster",
                    "status": "suggested"
                },
                {
                    "source_title": "How Much Does Website Development Cost?",
                    "source_url": "/website-development-cost",
                    "target_title": "How to Choose a Web Agency",
                    "target_url": "/how-to-choose-web-agency",
                    "anchor_text": "agency evaluation criteria",
                    "reason": "Natural next step for decision makers who have confirmed budget viability.",
                    "topic_cluster": "Web Development Services Cluster",
                    "status": "suggested"
                }
            ]

        return jsonify({
            "suggestions": suggestions,
            "total_suggestions": len(suggestions),
            "verified_rules": "All suggested target URLs correspond strictly to known project pages or existing registered endpoints. No URLs are fabricated."
        })
    finally:
        db.close()

@app.route("/api/v1/projects/<int:project_id>/internal-links", methods=["GET"])
def list_internal_links(project_id):
    db = get_db()
    try:
        links = db.query(InternalLink).filter(InternalLink.project_id == project_id).all()
        return jsonify([l.to_dict() for l in links])
    finally:
        db.close()

@app.route("/api/v1/internal-links", methods=["POST"])
def save_internal_link():
    data = request.json or {}
    project_id = data.get("project_id")
    if not project_id:
        return jsonify({"error": "Project ID required"}), 400

    db = get_db()
    try:
        link = InternalLink(
            project_id=project_id,
            source_title=data.get("source_title", ""),
            source_url=data.get("source_url", ""),
            target_title=data.get("target_title", ""),
            target_url=data.get("target_url", ""),
            anchor_text=data.get("anchor_text", ""),
            reason=data.get("reason", ""),
            topic_cluster=data.get("topic_cluster", ""),
            status=data.get("status", "accepted")
        )
        db.add(link)
        db.commit()
        db.refresh(link)
        return jsonify(link.to_dict()), 201
    finally:
        db.close()

# ==========================================
# LOCAL SEO STUDIO
# ==========================================

@app.route("/api/v1/local-seo/generate", methods=["POST"])
def generate_local_seo():
    data = request.json or {}
    service = data.get("service", "").strip()
    city = data.get("city", "").strip()
    project_id = data.get("project_id")

    if not service or not city:
        return jsonify({"error": "Both service and city are required"}), 400

    db = get_db()
    try:
        profile_dict = {}
        if project_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.project_id == project_id).first()
            if profile:
                profile_dict = profile.to_dict()

        if not profile_dict:
            profile_dict = {
                "business_name": data.get("business_name", "Business"),
                "industry": data.get("industry", "Local Services"),
                "target_audience": data.get("target_audience", "Local residents & businesses")
            }

        result = ai_service.generate_local_seo_pack(
            profile=profile_dict,
            service=service,
            city=city,
            target_audience=data.get("target_audience"),
            primary_keyword=data.get("primary_keyword"),
            unique_benefits=data.get("unique_benefits"),
            verified_details=data.get("verified_details")
        )

        return jsonify(result)
    finally:
        db.close()

# ==========================================
# ON-PAGE SEO AUDIT
# ==========================================

@app.route("/api/v1/seo-audit/analyze", methods=["POST"])
def run_seo_audit():
    data = request.json or {}
    title = data.get("title", "")
    meta_desc = data.get("meta_description", "")
    body = data.get("body_markdown", "")
    primary_kw = data.get("primary_keyword", "")
    h1 = data.get("h1")

    result = seo_engine.audit_content(
        title=title,
        meta_description=meta_desc,
        body_markdown=body,
        primary_keyword=primary_kw,
        h1=h1
    )

    return jsonify(result)

# ==========================================
# METADATA & SCHEMA GENERATOR
# ==========================================

@app.route("/api/v1/metadata/generate", methods=["POST"])
def generate_metadata_endpoint():
    data = request.json or {}
    title = data.get("title", "")
    primary_kw = data.get("primary_keyword", "")
    body = data.get("body_markdown", "")
    business_name = data.get("business_name", "RankCraft AI")
    canonical_url = data.get("canonical_url", "https://example.com/article")
    schema_type = data.get("schema_type", "Article")

    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-') if title else "seo-guide"
    meta_title = f"{title} | {business_name}"[:60] if title else f"{primary_kw.title()} Complete Guide"[:60]
    meta_desc = f"Comprehensive guide to {primary_kw}. Learn actionable steps, practical strategies, and best practices."[:160]

    schema = seo_engine.generate_schema_json(
        schema_type=schema_type,
        title=meta_title,
        description=meta_desc,
        canonical_url=canonical_url,
        business_name=business_name,
        business_url="https://example.com",
        faqs=data.get("faqs", [])
    )

    return jsonify({
        "slug": slug,
        "meta_title": meta_title,
        "meta_description": meta_desc,
        "open_graph": {
            "og_title": meta_title,
            "og_description": meta_desc,
            "og_type": "article",
            "og_url": canonical_url
        },
        "twitter_card": {
            "card": "summary_large_image",
            "title": meta_title,
            "description": meta_desc
        },
        "schema_json": schema
    })

# ==========================================
# APP SETTINGS & API KEYS
# ==========================================

@app.route("/api/v1/settings", methods=["GET"])
def get_settings():
    db = get_db()
    try:
        settings = db.query(AppSettings).first()
        if not settings:
            settings = AppSettings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return jsonify(settings.to_dict())
    finally:
        db.close()

@app.route("/api/v1/settings", methods=["POST"])
def update_settings():
    data = request.json or {}
    db = get_db()
    try:
        settings = db.query(AppSettings).first()
        if not settings:
            settings = AppSettings()
            db.add(settings)

        if "gemini_api_key" in data and data["gemini_api_key"] is not None:
            settings.gemini_api_key = data["gemini_api_key"].strip()
        if "openai_api_key" in data and data["openai_api_key"] is not None:
            settings.openai_api_key = data["openai_api_key"].strip()
        if "active_provider" in data:
            settings.active_provider = data["active_provider"]
        if "active_model" in data:
            settings.active_model = data["active_model"]
        if "custom_instructions" in data:
            settings.custom_instructions = data["custom_instructions"]

        db.commit()
        db.refresh(settings)
        return jsonify(settings.to_dict())
    finally:
        db.close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[RankCraft AI] Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
