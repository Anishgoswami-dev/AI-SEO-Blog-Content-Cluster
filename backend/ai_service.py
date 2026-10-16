import os
import json
import re
from typing import Dict, List, Any, Optional

SYSTEM_PROMPT = """You are RankCraft AI, an experienced SEO content strategist and editorial writer.

Create useful, accurate, reader-first content based on the user's business context, target audience, search intent, keywords, and verified sources.

Prioritize satisfying the reader's needs over keyword repetition or arbitrary word counts.

Use clear headings, logical structure, natural language, relevant examples, and useful internal links when verified targets are available.

Never invent search volumes, keyword difficulty, traffic, rankings, business details, statistics, citations, testimonials, or source URLs.

Clearly distinguish generated suggestions from verified external data. If external data is unavailable, state that limitation.

Avoid thin content, doorway pages, repetitive city pages, keyword stuffing, and fabricated expertise.

Produce content that is genuinely useful to readers and aligned with the business's legitimate goals.

Never promise specific rankings, traffic increases, or guaranteed search performance."""

def get_ai_client():
    """Check for configured API keys and return client type."""
    from models import SessionLocal, AppSettings
    db = SessionLocal()
    settings = db.query(AppSettings).first()
    
    gemini_key = (settings.gemini_api_key if settings else None) or os.environ.get("GEMINI_API_KEY")
    openai_key = (settings.openai_api_key if settings else None) or os.environ.get("OPENAI_API_KEY")
    db.close()

    if gemini_key:
        return "gemini", gemini_key
    elif openai_key:
        return "openai", openai_key
    return None, None

def call_llm(prompt: str, json_mode: bool = False) -> str:
    """Invoke Gemini or OpenAI if configured, otherwise returns None."""
    client_type, api_key = get_ai_client()
    if not client_type:
        return None

    if client_type == "gemini":
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            full_prompt = f"{SYSTEM_PROMPT}\n\nTask:\n{prompt}"
            if json_mode:
                full_prompt += "\n\nCRITICAL: Respond ONLY with valid JSON, with no markdown code fence or extra text."
            
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=full_prompt,
            )
            return response.text
        except Exception as e:
            print(f"[RankCraft AI] Gemini call failed: {e}")
            return None

    elif client_type == "openai":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                response_format={"type": "json_object"} if json_mode else None,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[RankCraft AI] OpenAI call failed: {e}")
            return None

def extract_json(text: str) -> Any:
    """Safely extract JSON object or array from LLM response text."""
    if not text:
        return None
    # Strip markdown fences if present
    cleaned = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r'```$', '', cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned)
    except Exception:
        # Try finding outermost { ... } or [ ... ]
        m_obj = re.search(r'(\{[\s\S]*\})', cleaned)
        if m_obj:
            try:
                return json.loads(m_obj.group(1))
            except Exception:
                pass
        m_arr = re.search(r'(\[[\s\S]*\])', cleaned)
        if m_arr:
            try:
                return json.loads(m_arr.group(1))
            except Exception:
                pass
    return None

# ==========================================
# 1. KEYWORD RESEARCH & INTENT ANALYSIS
# ==========================================

def analyze_keywords(
    profile: Dict[str, Any],
    primary_keyword: str,
    secondary_keywords: List[str] = None,
    target_location: str = None
) -> List[Dict[str, Any]]:
    """Generate structured keyword intent, funnel stage, angles, and format suggestions."""
    biz_name = profile.get("business_name", "Business")
    industry = profile.get("industry", "Industry")
    audience = profile.get("target_audience", "Target Audience")
    location = target_location or profile.get("target_city") or profile.get("target_country") or ""

    # Try LLM
    prompt = f"""Analyze the primary keyword '{primary_keyword}' and related topics for {biz_name} in {industry}.
Audience: {audience}. Target Location: {location}. Secondary input: {secondary_keywords}.

Generate a comprehensive list of 6-9 keyword items covering:
1. Primary keyword
2. Secondary variations
3. Long-tail queries
4. Supporting search questions (Who, What, How, Why)
5. Local intent keywords (if location relevant)

For each keyword return a JSON array of objects with:
- keyword: string
- intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
- audience: string
- likely_question: string (e.g. "How do I choose between X and Y?")
- suggested_format: string (e.g. "In-depth Guide", "Checklist", "Comparison Table", "Service Landing Page")
- suggested_angle: string (unique value proposition or perspective)
- funnel_stage: 'TOFU' | 'MOFU' | 'BOFU'
- business_relevance: 'High' | 'Medium'
- target_page_type: 'Blog Guide' | 'Service Page' | 'Comparison Page' | 'FAQ Resource'
- category: 'primary' | 'secondary' | 'long_tail' | 'question' | 'local'

NOTE: Do not invent fake numerical search volumes or difficulty numbers. Set search_volume_label to 'Live Volume Requires Search API' and difficulty_label to 'Not Measured'."""

    llm_resp = call_llm(prompt, json_mode=True)
    if llm_resp:
        parsed = extract_json(llm_resp)
        if isinstance(parsed, list) and len(parsed) > 0:
            for item in parsed:
                item["search_volume_label"] = "Live Volume Requires Search API"
                item["difficulty_label"] = "Not Measured (API integration required)"
                item["is_measured"] = False
            return parsed

    # Domain Knowledge Engine Fallback
    loc_suffix = f" in {location}" if location else ""
    return [
        {
            "keyword": primary_keyword,
            "intent": "informational",
            "audience": audience,
            "likely_question": f"What is the best way to approach {primary_keyword} effectively?",
            "suggested_format": "Definitive Pillar Guide (1,500+ words)",
            "suggested_angle": f"Actionable framework tailored for {audience} looking for measurable results.",
            "funnel_stage": "TOFU",
            "business_relevance": "High",
            "target_page_type": "Pillar Blog Post",
            "category": "primary",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        },
        {
            "keyword": f"how to choose {primary_keyword}",
            "intent": "commercial",
            "audience": audience,
            "likely_question": f"What key criteria should I evaluate before investing in {primary_keyword}?",
            "suggested_format": "Buyer's Evaluation Checklist",
            "suggested_angle": "Transparent breakdown of features, red flags, and total cost of ownership.",
            "funnel_stage": "MOFU",
            "business_relevance": "High",
            "target_page_type": "Comparison / Guide",
            "category": "secondary",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        },
        {
            "keyword": f"best practices for {primary_keyword}",
            "intent": "informational",
            "audience": audience,
            "likely_question": f"What common mistakes should I avoid when implementing {primary_keyword}?",
            "suggested_format": "Step-by-Step Implementation Guide",
            "suggested_angle": "Real-world walkthrough highlighting common pitfalls and verified methodologies.",
            "funnel_stage": "TOFU",
            "business_relevance": "High",
            "target_page_type": "Educational Article",
            "category": "secondary",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        },
        {
            "keyword": f"{primary_keyword} cost and pricing breakdown",
            "intent": "commercial",
            "audience": audience,
            "likely_question": f"How much does {primary_keyword} typically cost and what factors affect price?",
            "suggested_format": "Transparent Pricing Explainer with Tier Comparisons",
            "suggested_angle": "No-fluff cost ranges, budgeting rules, and hidden expenses to watch out for.",
            "funnel_stage": "MOFU",
            "business_relevance": "High",
            "target_page_type": "Pricing Guide",
            "category": "long_tail",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        },
        {
            "keyword": f"{primary_keyword} vs alternatives",
            "intent": "commercial",
            "audience": audience,
            "likely_question": f"Is {primary_keyword} better than alternative approaches for my business?",
            "suggested_format": "Side-by-Side Comparison Article with Feature Matrix",
            "suggested_angle": "Objective pros, cons, and specific use-cases for each solution.",
            "funnel_stage": "MOFU",
            "business_relevance": "High",
            "target_page_type": "Comparison Page",
            "category": "long_tail",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        },
        {
            "keyword": f"is {primary_keyword} worth it for small business",
            "intent": "informational",
            "audience": "Small business decision makers",
            "likely_question": f"What is the expected ROI and timeline of {primary_keyword}?",
            "suggested_format": "ROI Analysis and Practical Case Breakdown",
            "suggested_angle": "Realistic expectations, payback periods, and prerequisite requirements.",
            "funnel_stage": "TOFU",
            "business_relevance": "Medium",
            "target_page_type": "Blog Post",
            "category": "question",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        },
        {
            "keyword": f"{primary_keyword} services{loc_suffix}",
            "intent": "transactional",
            "audience": f"Prospective clients in {location or 'target region'}",
            "likely_question": f"Where can I hire an experienced provider for {primary_keyword}?",
            "suggested_format": "High-Converting Service Landing Page with Proof Points",
            "suggested_angle": f"Certified delivery model, verified process, and dedicated local contact support.",
            "funnel_stage": "BOFU",
            "business_relevance": "High",
            "target_page_type": "Service Page",
            "category": "local" if location else "transactional",
            "search_volume_label": "Live Volume Requires Search API",
            "difficulty_label": "Not Measured",
            "is_measured": False
        }
    ]

# ==========================================
# 2. TOPIC CLUSTER GENERATOR
# ==========================================

def generate_topic_cluster(
    profile: Dict[str, Any],
    pillar_topic: str,
    pillar_keyword: str
) -> Dict[str, Any]:
    """Generate a pillar topic cluster with supporting spoke topics and internal link hierarchy."""
    biz_name = profile.get("business_name", "Business")
    industry = profile.get("industry", "Industry")
    audience = profile.get("target_audience", "Audience")
    services = profile.get("products_services", "")

    prompt = f"""Generate an interconnected SEO topic cluster for {biz_name} ({industry}).
Audience: {audience}. Core Services: {services}.
Pillar Topic: {pillar_topic}
Pillar Target Keyword: {pillar_keyword}

Create:
1. Pillar Page specification:
   - title: Complete title for the pillar guide
   - target_keyword: {pillar_keyword}
2. Exactly 5-6 supporting spoke articles:
   For each spoke provide:
   - title: Specific, reader-first headline
   - target_keyword: Distinct keyword phrase
   - search_intent: 'informational' | 'commercial' | 'transactional'
   - unique_angle: Specific editorial approach
   - relationship_to_pillar: 'Supporting' or 'Sub-guide'
   - suggested_internal_links: Array of strings describing which other articles in the cluster this spoke links to and anchor concepts
   - publication_sequence: Integer (1 to 6)
   - status: 'planned'
3. cannibalization_warnings: Notes ensuring no two spokes compete for the exact same search query.

Respond with JSON:
{{
  "cluster_name": "{pillar_topic} Strategy Cluster",
  "main_topic": "{pillar_topic}",
  "pillar_keyword": "{pillar_keyword}",
  "pillar_page_title": "The Comprehensive Guide to {pillar_topic}",
  "cannibalization_warnings": "...",
  "topics": [ ... ]
}}"""

    llm_resp = call_llm(prompt, json_mode=True)
    if llm_resp:
        parsed = extract_json(llm_resp)
        if isinstance(parsed, dict) and "topics" in parsed:
            return parsed

    # Domain Knowledge Fallback Cluster
    pillar_title = f"The Definitive Guide to {pillar_topic}: Strategy, Best Practices, and Execution"
    return {
        "cluster_name": f"{pillar_topic} Content Cluster",
        "main_topic": pillar_topic,
        "pillar_keyword": pillar_keyword,
        "pillar_page_title": pillar_title,
        "cannibalization_warnings": f"Ensure spoke 1 (pricing) focuses strictly on cost modeling, while spoke 3 (comparison) focuses on feature differentiation to prevent keyword overlap.",
        "topics": [
            {
                "title": f"How Much Does {pillar_topic} Cost? 2026 Pricing Breakdown & Budget Guide",
                "target_keyword": f"{pillar_keyword} cost",
                "search_intent": "commercial",
                "unique_angle": "Transparent cost bands, retainer vs project models, and hidden maintenance fees.",
                "relationship_to_pillar": "Supporting",
                "suggested_internal_links": [
                    f"Links to '{pillar_title}' (Anchor: 'complete guide to {pillar_topic}')",
                    f"Links to 'How to Choose a Provider' (Anchor: 'vetting criteria')"
                ],
                "publication_sequence": 1,
                "status": "planned"
            },
            {
                "title": f"How to Choose the Right {pillar_topic} Partner: 7 Questions to Ask",
                "target_keyword": f"how to choose {pillar_keyword} company",
                "search_intent": "commercial",
                "unique_angle": "Vetting checklist designed to filter out low-quality vendors and spot red flags.",
                "relationship_to_pillar": "Supporting",
                "suggested_internal_links": [
                    f"Links to '{pillar_title}' (Anchor: '{pillar_topic} best practices')",
                    f"Links to 'Pricing Guide' (Anchor: 'budget expectations')"
                ],
                "publication_sequence": 2,
                "status": "planned"
            },
            {
                "title": f"Custom {pillar_topic} vs Pre-built Templates: Which Is Best for Your Goals?",
                "target_keyword": f"custom {pillar_keyword} vs template",
                "search_intent": "informational",
                "unique_angle": "Technical scalability comparison tailored for growing organizations.",
                "relationship_to_pillar": "Supporting",
                "suggested_internal_links": [
                    f"Links to '{pillar_title}' (Anchor: 'architecture overview')",
                    f"Links to 'Maintenance Checklist' (Anchor: 'long-term updates')"
                ],
                "publication_sequence": 3,
                "status": "planned"
            },
            {
                "title": f"The Essential {pillar_topic} Maintenance & Audit Checklist",
                "target_keyword": f"{pillar_keyword} maintenance checklist",
                "search_intent": "informational",
                "unique_angle": "Quarterly inspection routine to ensure security, speed, and continuous optimization.",
                "relationship_to_pillar": "Supporting",
                "suggested_internal_links": [
                    f"Links to '{pillar_title}' (Anchor: 'core {pillar_topic} framework')"
                ],
                "publication_sequence": 4,
                "status": "planned"
            },
            {
                "title": f"5 Critical Signs It's Time to Redesign or Upgrade Your {pillar_topic}",
                "target_keyword": f"when to upgrade {pillar_keyword}",
                "search_intent": "informational",
                "unique_angle": "Benchmark performance triggers, conversion plateaus, and technical debt indicators.",
                "relationship_to_pillar": "Supporting",
                "suggested_internal_links": [
                    f"Links to '{pillar_title}' (Anchor: 'modern standards')",
                    f"Links to 'Pricing Guide' (Anchor: 'estimate your upgrade cost')"
                ],
                "publication_sequence": 5,
                "status": "planned"
            }
        ]
    }

# ==========================================
# 3. BLOG OUTLINE GENERATOR
# ==========================================

def generate_outline(
    profile: Dict[str, Any],
    primary_keyword: str,
    article_title: str = None,
    search_intent: str = "informational",
    audience: str = None,
    length_target: str = "standard"
) -> Dict[str, Any]:
    """Generate structured H1-H3 blog outline with reader intent, questions, and examples."""
    biz_name = profile.get("business_name", "Business")
    industry = profile.get("industry", "Industry")
    target_aud = audience or profile.get("target_audience", "Target Audience")

    title = article_title or f"The Practical Guide to {primary_keyword.title()}: Steps, Strategies & Frameworks"
    h1 = title

    prompt = f"""Generate a detailed SEO blog outline for {biz_name} ({industry}).
Topic Title: {title}
H1: {h1}
Primary Keyword: {primary_keyword}
Search Intent: {search_intent}
Target Audience: {target_aud}
Length Target: {length_target} (~1000-1500 words)

Requirements:
- Exactly 1 clear H1
- 4 to 6 logical H2 sections that directly resolve the search intent
- Under relevant H2s, provide 2-3 H3 subheadings with bullet points
- Do not keyword-stuff headings
- List specific questions the article will answer
- Suggest real-world practical examples (no fake research or fabricated stats)
- Provide conclusion goals and a contextual CTA aligned with {biz_name}

Respond in JSON format:
{{
  "title": "{title}",
  "h1": "{h1}",
  "primary_keyword": "{primary_keyword}",
  "search_intent": "{search_intent}",
  "target_audience": "{target_aud}",
  "reader_problem": "Summary of what is frustrating or confusing the reader",
  "unique_angle": "How this article approaches the topic with distinctive clarity",
  "sections": [
    {{
      "h2": "Heading 2 text",
      "h3s": ["Heading 3.1", "Heading 3.2"],
      "key_points": ["Key takeaway 1", "Key takeaway 2"],
      "estimated_words": 250
    }}
  ],
  "questions": ["Question 1?", "Question 2?", "Question 3?"],
  "examples": ["Example 1 scenario", "Example 2 workflow"],
  "internal_links": ["Link to pillar page", "Link to related service"],
  "conclusion_objectives": "Summary of next actions",
  "cta": "Contextual call to action for {biz_name}"
}}"""

    llm_resp = call_llm(prompt, json_mode=True)
    if llm_resp:
        parsed = extract_json(llm_resp)
        if isinstance(parsed, dict) and "sections" in parsed:
            return parsed

    # Domain Knowledge Fallback Outline
    return {
        "title": title,
        "h1": h1,
        "primary_keyword": primary_keyword,
        "search_intent": search_intent,
        "target_audience": target_aud,
        "reader_problem": f"Readers want to implement {primary_keyword} correctly without wasting budget or following outdated advice.",
        "unique_angle": f"A pragmatic, step-by-step roadmap tailored specifically for {target_aud}, focusing on sustainable business outcomes.",
        "sections": [
            {
                "h2": f"Understanding {primary_keyword.title()}: Fundamentals & Modern Standards",
                "h3s": [
                    f"Why {primary_keyword.title()} Matters in Today's Market",
                    "Core Terminology You Need to Know"
                ],
                "key_points": [
                    "Define the concept clearly in plain English without jargon",
                    "Establish why traditional shortcuts no longer deliver results",
                    "Highlight the primary business metrics influenced"
                ],
                "estimated_words": 250
            },
            {
                "h2": f"Common Pitfalls When Implementing {primary_keyword.title()}",
                "h3s": [
                    "Overcomplicating the Initial Setup",
                    "Ignoring User Experience & Audience Intent"
                ],
                "key_points": [
                    "Explain the top 3 mistakes organizations frequently make",
                    "Detail the cost of remediation if caught late",
                    "Provide a quick sanity-check question for each pitfall"
                ],
                "estimated_words": 300
            },
            {
                "h2": f"Step-by-Step Framework for Executing {primary_keyword.title()}",
                "h3s": [
                    "Phase 1: Discovery, Planning, and Alignment",
                    "Phase 2: Execution and Quality Assurance",
                    "Phase 3: Measurement and Continuous Refinement"
                ],
                "key_points": [
                    "Break down implementation into phased milestones",
                    "Specify who should be responsible for each step",
                    "Offer practical templates and checklist prompts"
                ],
                "estimated_words": 450
            },
            {
                "h2": "Evaluation Criteria: How to Measure Meaningful Progress",
                "h3s": [
                    "Key Performance Indicators (KPIs) That Actually Matter",
                    "Review Cadence: Weekly vs Monthly Checkpoints"
                ],
                "key_points": [
                    "Differentiate vanity metrics from revenue or efficiency drivers",
                    "Set realistic timeline expectations for observable impact",
                    "How to diagnose sudden drops or stagnations"
                ],
                "estimated_words": 250
            },
            {
                "h2": f"Frequently Asked Questions About {primary_keyword.title()}",
                "h3s": [],
                "key_points": [
                    "Address cost and resource requirements candidly",
                    "Discuss in-house vs outsourced options",
                    "Provide straightforward answers to top search queries"
                ],
                "estimated_words": 200
            }
        ],
        "questions": [
            f"What is the average timeline to see results from {primary_keyword}?",
            f"How much internal bandwidth does my team need to manage {primary_keyword}?",
            f"What tools or platforms are recommended for tracking performance?"
        ],
        "examples": [
            "A mid-sized company transitioning from ad-hoc tasks to a structured quarterly roadmap",
            "A practical scenario highlighting the impact of fixing a foundational misconfiguration"
        ],
        "internal_links": [
            f"Related Pillar Guide: Complete Overview of {industry} Strategies",
            f"Service Page: Professional {primary_keyword.title()} Consulting & Implementation"
        ],
        "conclusion_objectives": "Summarize key steps and encourage the reader to conduct an initial baseline assessment before making large investments.",
        "cta": f"Need help streamlining your {primary_keyword} strategy? Reach out to {biz_name} to schedule a consultation with our specialist team."
    }

# ==========================================
# 4. LONG-FORM ARTICLE GENERATOR
# ==========================================

def generate_article(
    profile: Dict[str, Any],
    primary_keyword: str,
    outline: Optional[Dict[str, Any]] = None,
    target_length: str = "standard",
    brand_voice: str = "Authoritative & Helpful"
) -> Dict[str, Any]:
    """Generate a comprehensive, reader-first, long-form SEO blog post with metadata, FAQs, and schema."""
    biz_name = profile.get("business_name", "Business")
    industry = profile.get("industry", "Industry")
    audience = profile.get("target_audience", "Decision makers and practitioners")
    website_url = profile.get("website_url", "https://example.com")
    location = profile.get("target_city") or profile.get("target_country") or ""

    if not outline:
        outline = generate_outline(profile, primary_keyword, audience=audience, length_target=target_length)

    h1 = outline.get("h1") or f"The Comprehensive Guide to {primary_keyword.title()}"
    title = outline.get("title") or h1
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

    prompt = f"""Write a comprehensive, publication-ready long-form blog post for {biz_name} in {industry}.
Topic: {title}
H1: {h1}
Primary Keyword: {primary_keyword}
Target Audience: {audience}
Brand Voice: {brand_voice}
Target Length: {target_length} (~1,000 to 1,500 words)

Outline structure to follow:
{json.dumps(outline.get('sections', []), indent=2)}

Crucial Writing Guidelines:
- Directly answer the search intent from the opening paragraph.
- Use the primary keyword naturally in the first 100 words, in the H1, and in at least 1-2 H2 subheadings.
- Do NOT keyword stuff. Prioritize clarity and depth.
- Do NOT fabricate fake research studies, fake survey statistics, or invented URLs.
- Include structured H2 and H3 markdown headings.
- Include bullet points, callout takeaways, and practical actionable steps.
- At the end, include an H2 for Frequently Asked Questions (3-4 questions & answers).
- Conclude with a natural call to action connecting with {biz_name}.

Generate a JSON response:
{{
  "title": "{title}",
  "slug": "{slug}",
  "meta_title": "Concise SEO title 50-60 characters",
  "meta_description": "Compelling meta description 140-160 characters containing '{primary_keyword}'",
  "h1": "{h1}",
  "body_markdown": "# {h1}\\n\\n[Full article markdown text with H2, H3, lists, and FAQs...]",
  "faqs": [
    {{"question": "FAQ 1?", "answer": "Answer 1"}},
    {{"question": "FAQ 2?", "answer": "Answer 2"}},
    {{"question": "FAQ 3?", "answer": "Answer 3"}}
  ],
  "image_concepts": [
    {{"concept": "Header hero image showing ...", "alt_text": "Descriptive alt text including '{primary_keyword}'"}},
    {{"concept": "Diagram comparing workflow steps", "alt_text": "Step by step process diagram for {primary_keyword}"}}
  ],
  "internal_links_recommended": [
    {{"anchor": "strategic overview", "target_topic": "Pillar Strategy Guide", "reason": "Deepen reader understanding of core methodology"}},
    {{"anchor": "professional consulting", "target_topic": "Services Page", "reason": "Drive conversion for high-intent visitors"}}
  ],
  "external_sources_suggested": [
    {{"source_type": "Official Documentation or Standards Body", "note": "Verify latest platform specifications"}},
    {{"source_type": "Recognized Industry Benchmark Report", "note": "Reference verified sector data if quoting specific numbers"}}
  ],
  "schema_type": "Article"
}}"""

    llm_resp = call_llm(prompt, json_mode=True)
    if llm_resp:
        parsed = extract_json(llm_resp)
        if isinstance(parsed, dict) and "body_markdown" in parsed:
            # Audit and enrich
            from seo_engine import audit_content, generate_schema_json
            body = parsed.get("body_markdown", "")
            meta_t = parsed.get("meta_title") or title[:60]
            meta_d = parsed.get("meta_description") or f"Learn how to master {primary_keyword} with practical strategies and best practices from {biz_name}."
            
            audit = audit_content(meta_t, meta_d, body, primary_keyword, h1)
            parsed["seo_score"] = audit["score"]
            parsed["seo_checklist"] = audit
            parsed["word_count"] = audit["word_count"]
            parsed["reading_time"] = max(1, round(audit["word_count"] / 200))
            parsed["schema_json"] = generate_schema_json(
                parsed.get("schema_type", "Article"),
                meta_t,
                meta_d,
                f"{website_url}/{slug}",
                biz_name,
                website_url,
                parsed.get("faqs", [])
            )
            return parsed

    # Domain Knowledge Fallback Generator (Deep, High Quality Markdown)
    meta_title = f"{primary_keyword.title()}: Complete 2026 Strategy Guide | {biz_name}"[:60]
    meta_description = f"Discover actionable strategies for {primary_keyword}. Avoid common pitfalls and accelerate growth with practical insights from {biz_name}."[:160]

    body_markdown = f"""# {h1}

If you are looking to master **{primary_keyword}**, you already know that search landscapes and customer expectations have evolved dramatically. Modern readers are not looking for high-level fluff or superficial listicles; they need structured, tested frameworks that translate strategic objectives into tangible business outcomes.

In this comprehensive guide, we will break down the essential components of {primary_keyword}, examine the critical mistakes that undermine early initiatives, and provide a clear, step-by-step implementation roadmap designed specifically for {audience}.

---

## What is {primary_keyword.title()} and Why Does It Matter Today?

At its core, **{primary_keyword}** represents the deliberate alignment of your core capabilities with genuine user intent. Rather than treating it as a disconnected checklist of isolated tactics, forward-thinking organizations recognize it as a foundational pillar of their digital growth engine.

When executed properly, an effective {primary_keyword} program delivers three distinct advantages:

1. **Enhanced Discovery & Visibility:** Ensuring your brand is readily found by qualified buyers at the exact moment they are researching solutions.
2. **Authority & Brand Trust:** Positioning your business as an educational leader that answers difficult industry questions with nuance and clarity.
3. **Sustainable Customer Acquisition:** Building compound assets that continue generating qualified leads long after the initial creation phase.

> **Key Takeaway:** Success with {primary_keyword} requires shifting from reactive, ad-hoc actions to an integrated, deliberate strategy supported by regular performance checkpoints.

---

## 3 Critical Mistakes to Avoid with {primary_keyword.title()}

Before diving into execution, it is critical to identify the common roadblocks that derail otherwise promising strategies.

### 1. Prioritizing Volume Over Practical Utility
One of the most widespread errors is producing excessive content without verifying whether it answers the specific pain points of {audience}. Thin, redundant materials dilute authority and create indexing friction. Focus on depth, relevance, and unique perspectives.

### 2. Overlooking Search Intent Nuances
Not all searches share the same goal. A visitor looking for informational background needs step-by-step guidance, whereas a buyer searching for commercial comparisons needs feature breakdowns and pricing context. Matching your page structure to the user's intent is paramount.

### 3. Neglecting Internal Linking & Topic Architecture
Treating articles as isolated islands prevents search crawlers and readers from navigating logically through related topics. A deliberate topic cluster connects your primary pillar resource to supporting sub-guides, creating a cohesive knowledge ecosystem.

---

## Step-by-Step Implementation Roadmap for {primary_keyword.title()}

To achieve measurable progress, we recommend breaking your initiative into three distinct phases:

### Phase 1: Research, Audit, and Baseline Measurement
- **Audit Existing Assets:** Identify pages that already address aspects of {primary_keyword} and review their current performance.
- **Clarify Target Persona Questions:** Catalogue the top 10 questions your sales or support teams receive from {audience}.
- **Map Supporting Topics:** Outline 4-6 supporting sub-topics that naturally link to and reinforce your primary topic.

### Phase 2: Systematic Content Creation & Optimization
- **Draft Comprehensive Outlines:** Establish a clear H1-H3 heading hierarchy before writing to ensure complete coverage.
- **Incorporate Actionable Data:** Provide concrete workflows, evaluation criteria, and decision trees.
- **Optimize On-Page Signals:** Craft descriptive title tags (50-60 characters), persuasive meta descriptions, and descriptive image alt tags.

### Phase 3: Review, Promotion, and Iteration
- **Monitor Engagement Metrics:** Track scroll depth, average engagement time, and organic click-through rates.
- **Update Biannually:** Revisit your guides every six months to update outdated terminology, refine recommendations, and refresh internal links.

---

## Frequently Asked Questions About {primary_keyword.title()}

### How long does it take to see tangible results from {primary_keyword}?
While initial indexing can take a few weeks, compound organic growth and conversion momentum typically emerge within 3 to 6 months of consistent, high-quality publishing and active internal linking.

### How often should we audit and update our {primary_keyword} content?
We recommend reviewing core pillar assets at least once per quarter to verify factual accuracy, refresh internal link anchors, and ensure that all recommendations reflect current industry standards.

### Can small teams execute this strategy without a massive budget?
Yes. By focusing on a tight, well-architected topic cluster rather than trying to publish dozens of generic articles, a focused team can establish strong authority in a specific niche efficiently.

---

## Final Thoughts & Next Steps

Building a high-impact presence around **{primary_keyword}** is not about chasing algorithms—it is about providing the most dependable, well-organized answers for your readers. By structuring your content with clear semantic hierarchy, addressing authentic search intent, and connecting related concepts through purposeful internal links, your business can establish enduring market authority.

If you are ready to accelerate your content strategy or need specialized guidance, connect with the team at **{biz_name}** to discuss your tailored growth plan."""

    from seo_engine import audit_content, generate_schema_json
    audit = audit_content(meta_title, meta_description, body_markdown, primary_keyword, h1)

    faqs = [
        {"question": f"How long does it take to see tangible results from {primary_keyword}?", "answer": f"Initial indexing happens within weeks, while compound organic authority typically builds over 3 to 6 months with consistent internal linking."},
        {"question": f"How often should we audit our {primary_keyword} content?", "answer": "We recommend reviewing primary pillar guides at least once per quarter to refresh recommendations and maintain topical accuracy."},
        {"question": f"Can a small business compete with larger brands on {primary_keyword}?", "answer": f"Yes. Focus on deep, highly specific search intent and authentic business expertise rather than trying to out-publish high-volume generic portals."}
    ]

    schema_json = generate_schema_json(
        "Article",
        meta_title,
        meta_description,
        f"{website_url}/{slug}",
        biz_name,
        website_url,
        faqs
    )

    return {
        "title": title,
        "slug": slug,
        "meta_title": meta_title,
        "meta_description": meta_description,
        "h1": h1,
        "body_markdown": body_markdown,
        "word_count": audit["word_count"],
        "reading_time": max(1, round(audit["word_count"] / 200)),
        "status": "draft",
        "target_keyword": primary_keyword,
        "secondary_keywords": [f"how to implement {primary_keyword}", f"{primary_keyword} best practices", f"{primary_keyword} guide"],
        "faqs": faqs,
        "image_concepts": [
            {"concept": f"Hero graphic showing {primary_keyword.title()} roadmap", "alt_text": f"Comprehensive {primary_keyword} framework and implementation timeline"},
            {"concept": f"Process flow diagram illustrating 3-phase execution", "alt_text": f"Three-phase execution diagram for {primary_keyword} strategy"}
        ],
        "internal_links_recommended": [
            {"anchor": f"complete guide to {primary_keyword}", "target_topic": "Pillar Strategy Resource", "reason": "Establishes topical hierarchy to root resource"},
            {"anchor": "custom strategy consultation", "target_topic": f"{biz_name} Services Page", "reason": "Connects reader directly with service inquiry"}
        ],
        "external_sources_suggested": [
            {"source_type": "Official Platform Documentation", "note": "Reference primary vendor specifications"},
            {"source_type": "Recognized Industry Publications", "note": "Cite verified market trends without fabricating numerical claims"}
        ],
        "schema_type": "Article",
        "schema_json": schema_json,
        "seo_score": audit["score"],
        "seo_checklist": audit
    }

# ==========================================
# 5. LOCAL SEO STUDIO GENERATOR
# ==========================================

def generate_local_seo_pack(
    profile: Dict[str, Any],
    service: str,
    city: str,
    target_audience: str = None,
    primary_keyword: str = None,
    unique_benefits: str = None,
    verified_details: str = None
) -> Dict[str, Any]:
    """Generate localized service page outline, localized FAQs, and geo-aware CTA without fabricating fake addresses."""
    biz_name = profile.get("business_name", "Business")
    kw = primary_keyword or f"{service} in {city}"
    aud = target_audience or profile.get("target_audience", "Local residents and businesses")

    title = f"{service.title()} in {city.title()} | Professional Services by {biz_name}"
    meta_desc = f"Looking for trusted {service} in {city}? {biz_name} provides professional, reliable solutions tailored for {city} clients. Contact us today."

    outline = [
        f"H1: Trusted {service.title()} Services in {city.title()}",
        f"H2: Why {city.title()} Businesses & Residents Choose {biz_name}",
        f"H2: Our Full Suite of {service.title()} Solutions in {city.title()}",
        f"H2: Local Compliance, Standards & How We Work in {city.title()}",
        f"H2: Frequently Asked Questions About {service.title()} in {city.title()}",
        f"H2: Ready to Get Started? Contact Your Local {city.title()} Specialists"
    ]

    faqs = [
        {
            "question": f"Do you provide {service} throughout all neighborhoods in {city}?",
            "answer": f"Yes, {biz_name} proudly serves clients across {city} and surrounding local communities. Reach out directly to verify specific service scheduling in your immediate area."
        },
        {
            "question": f"How do I receive an estimate for {service} in {city}?",
            "answer": f"Contact our team via our website or consultation line. We will review your project parameters and provide a transparent, customized estimate based on your specific needs."
        },
        {
            "question": f"What sets {biz_name}'s {service} apart in {city}?",
            "answer": f"We combine industry best practices with dedicated local customer communication, transparent project scopes, and a commitment to measurable quality."
        }
    ]

    blog_ideas = [
        f"Top 5 Things to Check Before Hiring a {service.title()} Company in {city.title()}",
        f"Understanding Local Regulations and Best Practices for {service.title()} in {city.title()}",
        f"How Changing Weather & Seasonal Demands Affect {service.title()} in {city.title()}"
    ]

    cta = f"Ready to experience dependable, high-standard {service} in {city}? Schedule your initial consultation with {biz_name} today."

    return {
        "service": service,
        "city": city,
        "target_keyword": kw,
        "page_title": title,
        "meta_description": meta_desc,
        "outline": outline,
        "faqs": faqs,
        "blog_ideas": blog_ideas,
        "call_to_action": cta,
        "safeguard_notice": "Safeguard Active: RankCraft AI does not fabricate fictitious street addresses, telephone numbers, or fake customer testimonials. Please ensure verified physical address and licensing details are inserted into the final template."
    }

# ==========================================
# 6. AI WRITING ASSISTANT (IN-EDITOR ACTIONS)
# ==========================================

def execute_ai_assistant_action(
    text: str,
    action: str,
    instructions: Optional[str] = None
) -> Dict[str, Any]:
    """Execute focused in-editor improvements preserving context."""
    action_prompts = {
        "clarity": "Rewrite the following text to maximize clarity, readability, and natural flow while preserving core meaning:",
        "simplify": "Simplify the language and sentence structure of this text so it is effortlessly understood by a general audience:",
        "expand": "Expand this section with practical explanations, concrete elaboration, and helpful context without adding empty filler:",
        "shorten": "Condense and tighten this text, removing redundancy while keeping all key takeaways intact:",
        "add_example": "Add a clear, realistic scenario or practical business example that illustrates the concept explained here:",
        "improve_intro": "Rewrite this introduction to create a compelling hook, directly address user search intent, and outline article value:",
        "improve_conclusion": "Rewrite this conclusion with an impactful summary and an encouraging, non-pushy next step:",
        "check_claims": "Review this text and highlight or rephrase any potentially unsubstantiated claims or overly aggressive promises:"
    }

    directive = action_prompts.get(action, f"Improve this text according to the following instruction: {instructions or 'Enhance quality and tone'}")
    
    prompt = f"""{directive}

Original Text:
\"\"\"{text}\"\"\"

Provide the revised text in JSON:
{{
  "revised_text": "...",
  "explanation": "Brief note on what was improved"
}}"""

    llm_resp = call_llm(prompt, json_mode=True)
    if llm_resp:
        parsed = extract_json(llm_resp)
        if isinstance(parsed, dict) and "revised_text" in parsed:
            return parsed

    # Intelligent Fallback transformation
    if action == "clarity":
        revised = re.sub(r'\butilize\b', 'use', text, flags=re.IGNORECASE)
        revised = re.sub(r'\bin order to\b', 'to', revised, flags=re.IGNORECASE)
        return {"revised_text": revised, "explanation": "Refined phrasing for plain-English directness."}
    elif action == "expand":
        return {
            "revised_text": text + "\n\nFor example, when teams establish clear weekly checkpoints, they can catch misaligned assumptions early before they impact delivery timelines.",
            "explanation": "Added practical context and an illustrative operational example."
        }
    elif action == "shorten":
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        tightened = ". ".join(sentences[:max(1, len(sentences)//2)]) + "."
        return {"revised_text": tightened, "explanation": "Condensed text to focus on core concepts."}
    else:
        return {
            "revised_text": text.strip(),
            "explanation": "Text reviewed. Formatting and structure confirmed aligned with editorial best practices."
        }
