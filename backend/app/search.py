"""Offline TF-IDF search over document section chunks.

A small, dependency-free TF-IDF implementation (standard library only) that
ranks :class:`~app.models.Section` chunks against a natural-language query.
Each result carries a citation back to its source document and section.

The ranking uses TF-IDF weighted cosine similarity:
- term frequency: raw count of a term within a section
- inverse document frequency: ``ln(N / df) + 1`` smoothed, where ``N`` is the
  number of sections and ``df`` the number of sections containing the term
- score: cosine similarity between the query vector and the section vector
"""
from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass

from .models import Section

# Minimal English stopword list — enough to keep common filler out of ranking.
_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "have", "in", "into", "is", "it", "its", "of", "on", "or", "that", "the",
    "to", "was", "were", "will", "with", "which", "this", "these", "those",
    "they", "their", "them", "than", "then", "there", "but", "not", "no",
    "any", "all", "may", "must", "can", "shall", "should", "would", "we",
    "our", "you", "your", "i", "he", "she", "his", "her",
}

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _stem(token: str) -> str:
    """Very small suffix-stripping stemmer.

    This is deliberately lightweight (not Porter): it unifies common variants
    like approval/approved, threshold/thresholds, deadline/deadlines so a
    natural-language query matches the document wording. Short tokens and pure
    numbers are left untouched.
    """
    if len(token) <= 3 or token.isdigit():
        return token
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    # Verb/noun suffixes, longest first. Plurals are handled separately below so
    # that e.g. "deadlines" -> "deadline" (strip "s") rather than "deadlin".
    for suffix in ("ements", "ement", "ings", "ing", "edly", "ers", "ions",
                   "ion", "ed", "al", "ly", "er"):
        if token.endswith(suffix) and len(token) - len(suffix) >= 3:
            return token[: -len(suffix)]
    # Plural: strip only a trailing "s" (not "es"), leaving the singular stem.
    if token.endswith("s") and not token.endswith("ss") and len(token) > 3:
        return token[:-1]
    return token


def tokenize(text: str) -> list[str]:
    """Lowercase, split on non-alphanumerics, drop stopwords, and stem."""
    return [
        _stem(t)
        for t in _TOKEN_RE.findall(text.lower())
        if t not in _STOPWORDS
    ]


@dataclass
class SearchHit:
    """A ranked section match with its citation details."""

    doc_id: str
    section_title: str
    order: int
    snippet: str
    score: float


class SearchEngine:
    """TF-IDF index over a fixed list of (doc_id, Section) pairs."""

    def __init__(self, sections: list[tuple[str, Section]]):
        self._sections = sections
        self._doc_term_freqs: list[Counter[str]] = []
        self._idf: dict[str, float] = {}
        self._vectors: list[dict[str, float]] = []
        self._norms: list[float] = []
        self._build()

    def _build(self) -> None:
        n = len(self._sections)
        self._doc_term_freqs = [
            Counter(tokenize(section.text + " " + section.section_title))
            for _, section in self._sections
        ]

        # Document frequency per term.
        doc_freq: Counter[str] = Counter()
        for tf in self._doc_term_freqs:
            doc_freq.update(tf.keys())

        self._idf = {
            term: math.log(n / df) + 1.0 for term, df in doc_freq.items()
        } if n else {}

        # Precompute TF-IDF vectors and their norms for cosine similarity.
        self._vectors = []
        self._norms = []
        for tf in self._doc_term_freqs:
            vec = {term: count * self._idf.get(term, 0.0) for term, count in tf.items()}
            self._vectors.append(vec)
            self._norms.append(math.sqrt(sum(w * w for w in vec.values())))

    def search(self, query: str, limit: int = 5) -> list[SearchHit]:
        """Return up to ``limit`` ranked hits for ``query`` (empty if no match)."""
        query_tokens = tokenize(query)
        if not query_tokens or not self._sections:
            return []

        q_tf = Counter(query_tokens)
        q_vec = {term: count * self._idf.get(term, 0.0) for term, count in q_tf.items()}
        q_norm = math.sqrt(sum(w * w for w in q_vec.values()))
        if q_norm == 0.0:
            # Query shares no indexed terms with the corpus.
            return []

        distinct_query_terms = set(q_tf)

        scored: list[SearchHit] = []
        for idx, (doc_id, section) in enumerate(self._sections):
            vec = self._vectors[idx]
            norm = self._norms[idx]
            if norm == 0.0:
                continue
            # Dot product over the smaller of the two term sets.
            if len(q_vec) < len(vec):
                dot = sum(w * vec.get(term, 0.0) for term, w in q_vec.items())
            else:
                dot = sum(w * q_vec.get(term, 0.0) for term, w in vec.items())
            if dot <= 0.0:
                continue
            cosine = dot / (q_norm * norm)
            # Coverage (how many distinct query terms the section contains) is
            # the strongest relevance signal for short queries, so weight it
            # heavily: a section matching all query terms should beat one that
            # matches a single rare term with a high TF-IDF weight. The squared
            # coverage term sharply penalizes partial matches.
            matched = sum(1 for term in distinct_query_terms if term in vec)
            coverage = matched / len(distinct_query_terms)
            score = cosine * coverage * coverage
            scored.append(
                SearchHit(
                    doc_id=doc_id,
                    section_title=section.section_title,
                    order=section.order,
                    snippet=_make_snippet(section.text, query_tokens),
                    score=round(score, 6),
                )
            )

        scored.sort(key=lambda h: (-h.score, h.doc_id, h.order))
        return scored[:limit]


def _make_snippet(text: str, query_tokens: list[str], window: int = 240) -> str:
    """Return a short snippet, preferring a window around the first query hit."""
    flat = " ".join(text.split())
    if not flat:
        return ""
    lowered = flat.lower()
    wanted = set(query_tokens)
    best_pos = -1
    for match in _TOKEN_RE.finditer(lowered):
        if match.group(0) in wanted:
            best_pos = match.start()
            break
    if best_pos < 0 or len(flat) <= window:
        return flat[:window] + ("…" if len(flat) > window else "")

    start = max(0, best_pos - window // 3)
    end = min(len(flat), start + window)
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(flat) else ""
    return f"{prefix}{flat[start:end].strip()}{suffix}"
