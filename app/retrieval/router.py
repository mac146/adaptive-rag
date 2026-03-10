import re
from loguru import logger

CONCEPT_WORDS = {
    "how", "why", "what", "explain", "describe",
    "summarize", "define", "compare", "difference",
    "overview", "tell", "relationship", "effect", "impact"
}

def classify_question(question: str) -> dict:
    words        = question.split()
    lower_words  = set(w.lower() for w in words)
    word_count   = len(words)

    concept_hits = lower_words & CONCEPT_WORDS
    has_numbers  = any(re.search(r'\d', w) for w in words)
    has_symbols  = bool(re.search(r'[%/=@#<>]', question))

    # non-first words that are all caps or mixed caps → acronyms or technical terms
    has_acronyms = any(
        w.isupper() or (w[0].isupper() and not w.istitle())
        for w in words[1:]
        if len(w) > 1
    )

    concept_score = len(concept_hits) * 2
    term_score    = (
        (2 if has_numbers  else 0) +
        (1 if has_symbols  else 0) +
        (1 if has_acronyms else 0) +
        (2 if word_count <= 5 and concept_score == 0 else 0)
    )

    question_type = "concept" if concept_score >= term_score else "term"

    return {
        "type":         question_type,
        "concept_hits": list(concept_hits),
        "has_numbers":  has_numbers,
        "has_symbols":  has_symbols,
        "has_acronyms": has_acronyms,
        "word_count":   word_count
    }


def match_sections(question: str, sections: list[dict], top_n: int = 3) -> list[str]:
    question_words = set(question.lower().split())
    scored = []

    for section in sections:
        if not section.get("title"):
            continue
        title_words = set(section["title"].lower().split())
        overlap     = len(question_words & title_words)
        if overlap > 0:
            scored.append((section["title"], overlap))

    # sort by overlap score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    top_sections = [title for title, _ in scored[:top_n]]

    # also include children of matched sections
    matched_parents = set(top_sections)
    for section in sections:
        if section.get("parent") in matched_parents:
            if section["title"] not in top_sections:
                top_sections.append(section["title"])

    return top_sections


def decide_strategy(profile: dict, question: str, sections: list[dict], force_strategy: str = None) -> dict:

    # --- override ---
    if force_strategy:
        logger.info(f"Strategy manually overridden to: {force_strategy}")
        return {
            "strategy":        force_strategy,
            "reason":          f"Manually overridden by user to {force_strategy}",
            "target_sections": [],
            "confidence":      "forced"
        }

    structure_score = profile.get("structure_score", "low")
    length          = profile.get("length", "short")
    q_analysis      = classify_question(question)
    question_type   = q_analysis["type"]

    
    if length == "short":
        reason = "Document is short — full hybrid search across entire document"
        logger.info(reason)
        return {
            "strategy":        "hybrid",
            "reason":          reason,
            "target_sections": [],
            "confidence":      "high"
        }

    
    if structure_score in ("low", "medium"):
        reason = f"Structure score is {structure_score} — section boundaries unreliable, using hybrid"
        logger.info(reason)
        return {
            "strategy":        "hierarchical+hybrid",
            "reason":          reason,
            "target_sections": target_sections,
            "confidence":      confidence
        }  
    
    if structure_score == "high" and question_type == "concept":
        target_sections = match_sections(question, sections)

        if target_sections:
            reason = (
                f"High structure document, concept-based question "
                f"(matched words: {q_analysis['concept_hits']}), "
                f"targeting sections: {target_sections}"
            )
            confidence = "high"
        else:
            # high structure but no section matched — fall back to hybrid
            reason = (
                f"High structure document but no matching sections found "
                f"for question — falling back to full hybrid"
            )
            confidence = "low"
            logger.warning(reason)
            return {
                "strategy":        "hybrid",
                "reason":          reason,
                "target_sections": [],
                "confidence":      confidence
            }

        logger.info(reason)
        return {
            "strategy":        "hierarchical+hybrid",
            "reason":          reason,
            "target_sections": target_sections,
            "confidence":      confidence
    }

    # --- high structure + term question → hybrid only ---
    if structure_score == "high" and question_type == "term":
        reason = (
            f"High structure document but term-based question "
            f"(has_numbers: {q_analysis['has_numbers']}, has_acronyms: {q_analysis['has_acronyms']}) "
            f"— using hybrid across full document"
        )
        logger.info(reason)
        return {
            "strategy":        "hybrid",
            "reason":          reason,
            "target_sections": [],
            "confidence":      "high"
        }

    # --- fallback ---
    reason = "Could not confidently classify — defaulting to hybrid"
    logger.warning(reason)
    return {
        "strategy":        "hybrid",
        "reason":          reason,
        "target_sections": [],
        "confidence":      "low"
    }