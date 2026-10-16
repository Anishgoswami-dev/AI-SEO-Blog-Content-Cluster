import re
import json
import math
from typing import Dict, List, Any, Optional

def count_syllables(word: str) -> int:
    """Approximate syllable count using regex."""
    word = word.lower().strip(".:;?!'\"()[]{}")
    if not word:
        return 0
    if len(word) <= 3:
        return 1
    # Remove common endings
    word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
    word = re.sub(r'^y', '', word)
    matches = re.findall(r'[aeiouy]{1,2}', word)
    return max(1, len(matches))

def calculate_readability(text: str) -> Dict[str, Any]:
    """Calculate Flesch Reading Ease and Flesch-Kincaid Grade Level."""
    clean_text = re.sub(r'#|\*|_|`|\[.*?\]\(.*?\)', ' ', text)
    sentences = [s.strip() for s in re.split(r'[.!?]+', clean_text) if s.strip()]
    words = [w for w in re.findall(r'\b[a-zA-Z0-9\'-]+\b', clean_text) if w]

    total_sentences = max(1, len(sentences))
    total_words = max(1, len(words))
    total_syllables = sum(count_syllables(w) for w in words)

    # Flesch Reading Ease = 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
    fre = 206.835 - (1.015 * (total_words / total_sentences)) - (84.6 * (total_syllables / total_words))
    fre = max(0.0, min(100.0, round(fre, 1)))

    # Flesch-Kincaid Grade Level = 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
    fkgl = (0.39 * (total_words / total_sentences)) + (11.8 * (total_syllables / total_words)) - 15.59
    fkgl = max(1.0, min(18.0, round(fkgl, 1)))

    if fre >= 80:
        reading_level = "Easy to read (6th-7th grade)"
    elif fre >= 60:
        reading_level = "Standard plain English (8th-9th grade)"
    elif fre >= 50:
        reading_level = "Fairly complex (High School)"
    else:
        reading_level = "Difficult / Academic level"

    return {
        "flesch_reading_ease": fre,
        "grade_level": fkgl,
        "reading_level_label": reading_level,
        "total_words": total_words,
        "total_sentences": total_sentences,
        "avg_sentence_length": round(total_words / total_sentences, 1)
    }

def audit_content(
    title: str,
    meta_description: str,
    body_markdown: str,
    primary_keyword: str,
    h1: Optional[str] = None
) -> Dict[str, Any]:
    """
    Perform a transparent, deterministic on-page SEO audit.
    Score is calculated from 0 to 100 based on explicit SEO best-practice rules.
    """
    checks = []
    score_points = 0
    max_points = 100

    kw_lower = (primary_keyword or "").lower().strip()
    title_clean = (title or "").strip()
    meta_clean = (meta_description or "").strip()
    body_clean = body_markdown or ""

    # 1. Title Presence & Optimal Length (10 pts)
    title_len = len(title_clean)
    if 50 <= title_len <= 65:
        checks.append({
            "id": "title_length",
            "name": "Title Tag Length",
            "status": "pass",
            "weight": 10,
            "message": f"Optimal length ({title_len} characters, recommended 50–65)."
        })
        score_points += 10
    elif 30 <= title_len < 50:
        checks.append({
            "id": "title_length",
            "name": "Title Tag Length",
            "status": "warning",
            "weight": 10,
            "message": f"Title is slightly short ({title_len} chars). 50–65 chars maximizes SERP real estate."
        })
        score_points += 6
    elif title_len > 65:
        checks.append({
            "id": "title_length",
            "name": "Title Tag Length",
            "status": "warning",
            "weight": 10,
            "message": f"Title is {title_len} chars long and will likely be truncated on Google desktop/mobile SERPs."
        })
        score_points += 5
    else:
        checks.append({
            "id": "title_length",
            "name": "Title Tag Length",
            "status": "fail",
            "weight": 10,
            "message": "Title is missing or far too short (<30 chars)."
        })

    # 2. Keyword in Title (10 pts)
    if kw_lower and kw_lower in title_clean.lower():
        checks.append({
            "id": "kw_in_title",
            "name": "Primary Keyword in Title",
            "status": "pass",
            "weight": 10,
            "message": f"Title includes primary keyword '{primary_keyword}'."
        })
        score_points += 10
    else:
        checks.append({
            "id": "kw_in_title",
            "name": "Primary Keyword in Title",
            "status": "fail",
            "weight": 10,
            "message": f"Primary keyword '{primary_keyword}' was not found in the title."
        })

    # 3. Meta Description Presence & Length (10 pts)
    meta_len = len(meta_clean)
    if 135 <= meta_len <= 165:
        checks.append({
            "id": "meta_length",
            "name": "Meta Description Length",
            "status": "pass",
            "weight": 10,
            "message": f"Optimal length ({meta_len} characters, recommended 135–165)."
        })
        score_points += 10
    elif 100 <= meta_len < 135:
        checks.append({
            "id": "meta_length",
            "name": "Meta Description Length",
            "status": "warning",
            "weight": 10,
            "message": f"Meta description is somewhat concise ({meta_len} chars). Expand to 150 chars for better CTR."
        })
        score_points += 7
    elif meta_len > 165:
        checks.append({
            "id": "meta_length",
            "name": "Meta Description Length",
            "status": "warning",
            "weight": 10,
            "message": f"Meta description is {meta_len} chars; Google typically truncates at ~155-160 chars."
        })
        score_points += 5
    else:
        checks.append({
            "id": "meta_length",
            "name": "Meta Description Length",
            "status": "fail",
            "weight": 10,
            "message": "Meta description is missing or too short to persuade searchers."
        })

    # 4. Keyword in Meta Description (8 pts)
    if kw_lower and kw_lower in meta_clean.lower():
        checks.append({
            "id": "kw_in_meta",
            "name": "Keyword in Meta Description",
            "status": "pass",
            "weight": 8,
            "message": f"Meta description contains '{primary_keyword}' to trigger SERP bolding."
        })
        score_points += 8
    else:
        checks.append({
            "id": "kw_in_meta",
            "name": "Keyword in Meta Description",
            "status": "warning",
            "weight": 8,
            "message": f"Consider adding '{primary_keyword}' to the meta description for search query relevance."
        })
        score_points += 3

    # 5. Single H1 Tag Check (10 pts)
    h1_matches = re.findall(r'^#\s+(.+)$', body_clean, re.MULTILINE)
    effective_h1 = h1 or (h1_matches[0] if h1_matches else "")
    total_h1s = len(h1_matches) + (1 if h1 and not h1_matches else 0)

    if total_h1s == 1:
        checks.append({
            "id": "single_h1",
            "name": "Single H1 Tag",
            "status": "pass",
            "weight": 10,
            "message": "Exactly one main H1 header is defined."
        })
        score_points += 10
    elif total_h1s > 1:
        checks.append({
            "id": "single_h1",
            "name": "Single H1 Tag",
            "status": "warning",
            "weight": 10,
            "message": f"Found {total_h1s} H1 tags in the content. Use exactly one H1 per page for clear semantic hierarchy."
        })
        score_points += 5
    else:
        checks.append({
            "id": "single_h1",
            "name": "Single H1 Tag",
            "status": "fail",
            "weight": 10,
            "message": "No H1 tag detected. Ensure an H1 header represents the document's main subject."
        })

    # 6. Keyword in H1 (10 pts)
    if kw_lower and effective_h1 and kw_lower in effective_h1.lower():
        checks.append({
            "id": "kw_in_h1",
            "name": "Primary Keyword in H1",
            "status": "pass",
            "weight": 10,
            "message": f"H1 header includes the primary keyword '{primary_keyword}'."
        })
        score_points += 10
    else:
        checks.append({
            "id": "kw_in_h1",
            "name": "Primary Keyword in H1",
            "status": "warning",
            "weight": 10,
            "message": f"Primary keyword was not found in the H1 tag."
        })
        score_points += 4

    # 7. Subheading Structure (H2 / H3) (10 pts)
    h2_matches = re.findall(r'^##\s+(.+)$', body_clean, re.MULTILINE)
    h3_matches = re.findall(r'^###\s+(.+)$', body_clean, re.MULTILINE)

    if len(h2_matches) >= 3:
        checks.append({
            "id": "heading_hierarchy",
            "name": "Heading Hierarchy (H2 / H3)",
            "status": "pass",
            "weight": 10,
            "message": f"Strong structure: {len(h2_matches)} H2 sections and {len(h3_matches)} H3 subsections."
        })
        score_points += 10
    elif len(h2_matches) >= 1:
        checks.append({
            "id": "heading_hierarchy",
            "name": "Heading Hierarchy (H2 / H3)",
            "status": "warning",
            "weight": 10,
            "message": f"Only {len(h2_matches)} H2 heading(s) found. Break content into at least 3-4 H2 logical sections."
        })
        score_points += 6
    else:
        checks.append({
            "id": "heading_hierarchy",
            "name": "Heading Hierarchy (H2 / H3)",
            "status": "fail",
            "weight": 10,
            "message": "No H2 subheadings found. Walls of text hurt scannability and SEO."
        })

    # 8. Keyword in H2 Subheadings (8 pts)
    h2_with_kw = [h for h in h2_matches if kw_lower in h.lower()]
    if h2_with_kw:
        checks.append({
            "id": "kw_in_h2",
            "name": "Keyword in Subheadings",
            "status": "pass",
            "weight": 8,
            "message": f"Primary keyword appears in {len(h2_with_kw)} H2 heading(s)."
        })
        score_points += 8
    else:
        checks.append({
            "id": "kw_in_h2",
            "name": "Keyword in Subheadings",
            "status": "warning",
            "weight": 8,
            "message": "Primary keyword is missing from all H2 subheadings."
        })
        score_points += 3

    # 9. First 150 Words Keyword Placement (8 pts)
    first_paragraph = ""
    paragraphs = [p.strip() for p in body_clean.split("\n\n") if p.strip() and not p.startswith("#")]
    if paragraphs:
        first_paragraph = paragraphs[0]

    if kw_lower and kw_lower in first_paragraph.lower():
        checks.append({
            "id": "kw_in_intro",
            "name": "Keyword in First 150 Words",
            "status": "pass",
            "weight": 8,
            "message": "Primary keyword introduced naturally in the opening section."
        })
        score_points += 8
    else:
        checks.append({
            "id": "kw_in_intro",
            "name": "Keyword in First 150 Words",
            "status": "warning",
            "weight": 8,
            "message": "Place the primary keyword naturally within the first 100-150 words."
        })
        score_points += 3

    # 10. Content Length & Comprehensive Coverage (8 pts)
    readability = calculate_readability(body_clean)
    word_count = readability["total_words"]

    if word_count >= 1000:
        checks.append({
            "id": "word_count",
            "name": "Comprehensive Content Length",
            "status": "pass",
            "weight": 8,
            "message": f"Deep comprehensive coverage ({word_count} words)."
        })
        score_points += 8
    elif word_count >= 600:
        checks.append({
            "id": "word_count",
            "name": "Comprehensive Content Length",
            "status": "pass",
            "weight": 8,
            "message": f"Good solid length ({word_count} words). Meets standard informational intent."
        })
        score_points += 6
    elif word_count >= 300:
        checks.append({
            "id": "word_count",
            "name": "Comprehensive Content Length",
            "status": "warning",
            "weight": 8,
            "message": f"Content is somewhat brief ({word_count} words). Consider adding practical steps or examples."
        })
        score_points += 4
    else:
        checks.append({
            "id": "word_count",
            "name": "Comprehensive Content Length",
            "status": "fail",
            "weight": 8,
            "message": f"Very short content ({word_count} words). Risk of being categorized as thin content."
        })

    # 11. Readability & Sentence Flow (5 pts)
    fre = readability["flesch_reading_ease"]
    if 50 <= fre <= 80:
        checks.append({
            "id": "readability",
            "name": "Reading Ease Score",
            "status": "pass",
            "weight": 5,
            "message": f"Flesch Reading Ease: {fre}/100 ({readability['reading_level_label']})."
        })
        score_points += 5
    elif fre > 80:
        checks.append({
            "id": "readability",
            "name": "Reading Ease Score",
            "status": "pass",
            "weight": 5,
            "message": f"Flesch Reading Ease: {fre}/100 (Very easy to scan)."
        })
        score_points += 5
    else:
        checks.append({
            "id": "readability",
            "name": "Reading Ease Score",
            "status": "warning",
            "weight": 5,
            "message": f"Flesch Reading Ease: {fre}/100. Sentences average {readability['avg_sentence_length']} words. Shorten complex sentences."
        })
        score_points += 2

    # 12. Internal Links or Citations (5 pts)
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', body_clean)
    if len(links) >= 2:
        checks.append({
            "id": "links_count",
            "name": "Internal / Contextual Links",
            "status": "pass",
            "weight": 5,
            "message": f"Contains {len(links)} contextual links."
        })
        score_points += 5
    elif len(links) == 1:
        checks.append({
            "id": "links_count",
            "name": "Internal / Contextual Links",
            "status": "warning",
            "weight": 5,
            "message": "Only 1 link detected. Add 2-3 relevant topic links to strengthen the content cluster."
        })
        score_points += 3
    else:
        checks.append({
            "id": "links_count",
            "name": "Internal / Contextual Links",
            "status": "warning",
            "weight": 5,
            "message": "No links found in the body text. Add internal links to your pillar/supporting pages."
        })
        score_points += 1

    # 13. Call-To-Action (CTA) Detection (6 pts)
    cta_patterns = r'(contact us|get started|learn more|schedule a consultation|try free|sign up|book a call|request a quote|download our guide)'
    if re.search(cta_patterns, body_clean, re.IGNORECASE):
        checks.append({
            "id": "cta_present",
            "name": "Call to Action (CTA)",
            "status": "pass",
            "weight": 6,
            "message": "Clear business call-to-action detected."
        })
        score_points += 6
    else:
        checks.append({
            "id": "cta_present",
            "name": "Call to Action (CTA)",
            "status": "warning",
            "weight": 6,
            "message": "No prominent call-to-action found. Include a next step for the reader."
        })
        score_points += 2

    final_score = min(100, max(0, score_points))

    passed_count = sum(1 for c in checks if c["status"] == "pass")
    warning_count = sum(1 for c in checks if c["status"] == "warning")
    fail_count = sum(1 for c in checks if c["status"] == "fail")

    return {
        "score": final_score,
        "max_score": max_points,
        "score_label": "Excellent" if final_score >= 85 else ("Good" if final_score >= 70 else "Needs Improvement"),
        "passed_count": passed_count,
        "warning_count": warning_count,
        "fail_count": fail_count,
        "checks": checks,
        "readability": readability,
        "word_count": word_count,
        "heading_summary": {
            "h1": effective_h1,
            "h2_count": len(h2_matches),
            "h3_count": len(h3_matches),
        },
        "disclaimer": "This score is computed deterministically from transparent on-page SEO best practices and content readability metrics. It is not an organic Google search ranking guarantee."
    }

def generate_schema_json(
    schema_type: str,
    title: str,
    description: str,
    canonical_url: str,
    business_name: str,
    business_url: str,
    faqs: Optional[List[Dict[str, str]]] = None,
    image_url: Optional[str] = None
) -> Dict[str, Any]:
    """Generate structured data in JSON-LD format."""
    schema_type = schema_type or "Article"

    base_schema = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "headline": title,
        "description": description,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical_url or "https://example.com/article"
        },
        "author": {
            "@type": "Organization",
            "name": business_name or "Editorial Team",
            "url": business_url or "https://example.com"
        },
        "publisher": {
            "@type": "Organization",
            "name": business_name or "Business",
            "url": business_url or "https://example.com"
        }
    }

    if image_url:
        base_schema["image"] = image_url

    if faqs and len(faqs) > 0:
        faq_entities = []
        for item in faqs:
            q = item.get("question") or item.get("q")
            a = item.get("answer") or item.get("a")
            if q and a:
                faq_entities.append({
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": a
                    }
                })
        if faq_entities:
            # If primary is FAQPage or include as secondary entity
            if schema_type == "FAQPage":
                return {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": faq_entities
                }
            else:
                base_schema["hasPart"] = {
                    "@type": "FAQPage",
                    "mainEntity": faq_entities
                }

    if schema_type == "LocalBusiness":
        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": business_name,
            "url": business_url or canonical_url,
            "description": description,
            "priceRange": "$$",
            "areaServed": "Service Area"
        }

    return base_schema

def check_keyword_cannibalization(topics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Flag potential keyword cannibalization when two articles target the same or overlapping keywords with similar intent."""
    warnings = []
    seen = {}

    for t in topics:
        kw = (t.get("target_keyword") or "").lower().strip()
        intent = (t.get("search_intent") or "").lower().strip()
        title = t.get("title") or ""

        if not kw:
            continue

        words = set(kw.split())
        for other_kw, other_data in seen.items():
            other_words = set(other_kw.split())
            overlap = words.intersection(other_words)

            # If 80%+ word overlap or exact match with same intent
            is_exact = (kw == other_kw)
            is_high_overlap = (len(words) > 1 and len(overlap) / max(len(words), len(other_words)) >= 0.75)

            if is_exact or is_high_overlap:
                warnings.append({
                    "keyword_a": kw,
                    "title_a": title,
                    "keyword_b": other_kw,
                    "title_b": other_data["title"],
                    "reason": f"High topical overlap between '{kw}' and '{other_kw}'. Both target {intent} intent.",
                    "recommendation": "Differentiate search angle, consolidate into a single pillar page, or link hierarchically rather than competing for identical search queries."
                })

        seen[kw] = {"title": title, "intent": intent}

    return warnings
