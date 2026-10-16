import pytest
import json
from app import app
from models import init_db, SessionLocal, Project, Article
import seo_engine

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "RankCraft AI" in data["service"]

def test_dashboard_metrics(client):
    response = client.get("/api/v1/dashboard/metrics")
    assert response.status_code == 200
    data = response.get_json()
    assert "metrics" in data
    assert "total_articles" in data["metrics"]
    assert "total_planned_topics" in data["metrics"]

def test_projects_crud(client):
    # List projects
    res = client.get("/api/v1/projects")
    assert res.status_code == 200
    projects = res.get_json()
    assert isinstance(projects, list)

    # Create new project
    res_post = client.post("/api/v1/projects", json={
        "name": "Test SEO Venture",
        "domain": "testventure.com",
        "industry": "E-Commerce",
        "products_services": "Organic sustainable coffee",
        "target_audience": "Coffee enthusiasts"
    })
    assert res_post.status_code == 201
    created = res_post.get_json()
    assert created["name"] == "Test SEO Venture"
    project_id = created["id"]

    # Get single project
    res_get = client.get(f"/api/v1/projects/{project_id}")
    assert res_get.status_code == 200
    assert res_get.get_json()["domain"] == "testventure.com"

def test_keyword_analysis(client):
    res = client.post("/api/v1/keywords/analyze", json={
        "primary_keyword": "sustainable coffee beans",
        "secondary_keywords": ["fair trade coffee", "organic espresso"],
        "industry": "Beverages",
        "business_name": "BeanCraft",
        "save_to_project": False
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "keywords" in data
    assert len(data["keywords"]) >= 5
    for item in data["keywords"]:
        assert "keyword" in item
        assert "intent" in item
        assert item["search_volume_label"] == "Live Volume Requires Search API"

def test_seo_audit_engine():
    # Test deterministic on-page SEO evaluation
    title = "Best Sustainable Coffee Beans: Complete 2026 Buying Guide"
    meta_desc = "Discover ethically sourced, fair-trade sustainable coffee beans. Learn roasting grades, flavor profiles, and eco-friendly packaging standards."
    body = """# Best Sustainable Coffee Beans: Complete 2026 Buying Guide

If you are looking for the best **sustainable coffee beans**, ethical sourcing and regenerative farming are essential considerations for modern consumers.

## Why Sustainable Coffee Beans Matter

Choosing ethically harvested beans protects biodiversity and supports fair agricultural wages.

### Soil Health and Shade-Grown Practices
Shade-grown coffee preserves natural bird habitats and reduces erosion.

## How to Evaluate Quality and Flavor
Look for single-origin traceability and certified organic stamps.

## Frequently Asked Questions

### What does fair trade mean?
Fair trade guarantees minimum pricing protections for smallholder farmers.

Ready to taste the difference? [Get started today](https://example.com) and explore our catalog."""

    audit = seo_engine.audit_content(
        title=title,
        meta_description=meta_desc,
        body_markdown=body,
        primary_keyword="sustainable coffee beans",
        h1="Best Sustainable Coffee Beans: Complete 2026 Buying Guide"
    )

    assert audit["score"] >= 80
    assert audit["heading_summary"]["h2_count"] >= 2
    assert audit["readability"]["flesch_reading_ease"] > 0
    assert audit["word_count"] > 50

def test_local_seo_generation(client):
    res = client.post("/api/v1/local-seo/generate", json={
        "service": "Emergency Plumbing",
        "city": "Denver",
        "business_name": "Mile High Plumbing"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "Denver" in data["page_title"]
    assert "Emergency Plumbing" in data["page_title"]
    assert len(data["faqs"]) >= 2
    assert "safeguard_notice" in data

def test_topic_cluster_generation(client):
    res = client.post("/api/v1/clusters/generate", json={
        "pillar_topic": "B2B SaaS Security",
        "pillar_keyword": "cloud security compliance",
        "business_name": "SecurePulse"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "topics" in data
    assert len(data["topics"]) >= 4

def test_metadata_generation(client):
    res = client.post("/api/v1/metadata/generate", json={
        "title": "Complete Next.js Architecture Guide",
        "primary_keyword": "next.js architecture",
        "business_name": "Apex Web Studio",
        "schema_type": "Article"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "slug" in data
    assert data["slug"] == "complete-next-js-architecture-guide"
    assert "meta_title" in data
    assert "schema_json" in data
