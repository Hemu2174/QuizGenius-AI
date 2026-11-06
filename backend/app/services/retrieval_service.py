"""
QuizGenius AI — Document Retrieval Service (Phase 3 RAG)
Provides modular, keyword-ranked context retrieval from Supabase PostgreSQL
document_chunks with strict document and user ownership isolation.

NOTE ON RETRIEVAL STRATEGY:
This service currently utilizes keyword-based relevance ranking (term frequency
scoring across chunk contents) and structured stratified sampling. Vector embeddings
(e.g., pgvector / embeddings API) are architected to plug in seamlessly in a future phase.
Vector search is NOT claimed or implemented in Phase 3.
"""
import re
import math
from typing import List, Dict, Any, Optional, Set
from supabase import Client


# Standard English stop words to filter during keyword extraction and scoring
STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any",
    "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "can't", "cannot", "could", "couldn't", "did",
    "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few",
    "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
    "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself",
    "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
    "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd",
    "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd",
    "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
}


class RetrievalService:
    """
    RAG Context Retrieval Engine.
    Queries PostgreSQL document_chunks table, verifies ownership, and returns
    relevance-ranked chunks with page numbers and chunk IDs preserved.
    """

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """Extracts cleaned alphanumeric word tokens."""
        words = re.findall(r"\b[a-zA-Z0-9_-]{3,}\b", text.lower())
        return [w for w in words if w not in STOP_WORDS]

    def score_chunk_by_keywords(self, chunk_text: str, query_keywords: List[str]) -> float:
        """
        Calculates a term-frequency relevance score between query keywords and a chunk.
        """
        if not query_keywords:
            return 0.0

        chunk_lower = chunk_text.lower()
        chunk_words = self._tokenize(chunk_lower)
        total_words = max(len(chunk_words), 1)

        score = 0.0
        for kw in query_keywords:
            count = chunk_words.count(kw)
            if count > 0:
                # TF with logarithmic scaling
                score += (1.0 + math.log(count))

        # Normalize slightly by length to prevent bias towards unnecessarily long chunks
        normalized_score = score / math.sqrt(total_words)
        return normalized_score

    def get_relevant_chunks(
        self,
        client: Client,
        document_id: str,
        user_id: str,
        topics: Optional[List[str]] = None,
        max_chunks: int = 10,
        max_chars: int = 14000,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves grounded document chunks for a verified user and document.
        
        If topics are provided:
          Performs keyword-based relevance scoring and ranks chunks by term frequency.
        If no topics (or empty):
          Performs stratified uniform sampling across the document chunks to ensure
          balanced topic coverage across the beginning, middle, and end of the document.
        """
        # Step 1: Query chunks strictly scoped to document_id AND user_id (RLS enforced)
        res = (
            client.from_("document_chunks")
            .select("id, chunk_index, content, page_start, page_end")
            .eq("document_id", document_id)
            .eq("user_id", user_id)
            .order("chunk_index", desc=False)
            .execute()
        )
        all_chunks = res.data or []
        if not all_chunks:
            return []

        # If document has fewer chunks than max_chunks, take all under max_chars
        if len(all_chunks) <= max_chunks:
            selected: List[Dict[str, Any]] = []
            curr_chars = 0
            for c in all_chunks:
                content = c.get("content", "")
                if curr_chars + len(content) > max_chars and selected:
                    break
                selected.append({
                    "id": str(c["id"]),
                    "chunk_index": c["chunk_index"],
                    "content": content,
                    "page_start": c.get("page_start"),
                    "page_end": c.get("page_end"),
                })
                curr_chars += len(content)
            return selected

        # Step 2: Relevance filtering vs. Stratified sampling
        cleaned_topics = [t.strip() for t in (topics or []) if t and t.strip().lower() != "all topics"]

        if cleaned_topics:
            # Topic-guided retrieval: collect keywords from topics
            topic_keywords: List[str] = []
            for t in cleaned_topics:
                topic_keywords.extend(self._tokenize(t))

            # Score each chunk
            scored_chunks = []
            for c in all_chunks:
                score = self.score_chunk_by_keywords(c.get("content", ""), topic_keywords)
                scored_chunks.append((score, c))

            # Sort descending by score; break ties by chunk_index
            scored_chunks.sort(key=lambda x: (x[0], -x[1]["chunk_index"]), reverse=True)

            # Filter top scoring chunks
            top_scored = [item[1] for item in scored_chunks[:max_chunks]]
            # Sort back by chunk_index for narrative reading order
            top_scored.sort(key=lambda x: x["chunk_index"])

            selected = []
            curr_chars = 0
            for c in top_scored:
                content = c.get("content", "")
                if curr_chars + len(content) > max_chars and selected:
                    break
                selected.append({
                    "id": str(c["id"]),
                    "chunk_index": c["chunk_index"],
                    "content": content,
                    "page_start": c.get("page_start"),
                    "page_end": c.get("page_end"),
                })
                curr_chars += len(content)
            return selected

        else:
            # Stratified uniform sampling: Pick chunks distributed evenly across the document
            total_count = len(all_chunks)
            step = total_count / float(max_chunks)
            selected_indices = sorted(list({int(round(i * step)) for i in range(max_chunks)}))
            # Bound indices
            selected_indices = [idx for idx in selected_indices if idx < total_count]

            selected = []
            curr_chars = 0
            for idx in selected_indices:
                c = all_chunks[idx]
                content = c.get("content", "")
                if curr_chars + len(content) > max_chars and selected:
                    break
                selected.append({
                    "id": str(c["id"]),
                    "chunk_index": c["chunk_index"],
                    "content": content,
                    "page_start": c.get("page_start"),
                    "page_end": c.get("page_end"),
                })
                curr_chars += len(content)
            return selected

    def extract_document_topics(
        self,
        client: Client,
        document_id: str,
        user_id: str,
    ) -> List[str]:
        """
        Discovers representative section topics from document headings and recurring key themes.
        Returns a list of 3 to 8 topic names for the document.
        """
        # Fetch first 12 chunks
        res = (
            client.from_("document_chunks")
            .select("chunk_index, content")
            .eq("document_id", document_id)
            .eq("user_id", user_id)
            .order("chunk_index", desc=False)
            .limit(12)
            .execute()
        )
        chunks = res.data or []
        if not chunks:
            return ["General Content", "Key Concepts"]

        discovered_topics: List[str] = []
        seen_lower: Set[str] = set()

        for c in chunks:
            text = c.get("content", "")
            lines = text.split("\n")
            for line in lines:
                clean_line = line.strip()
                # Check for Markdown headings (# Heading), numbered headings (1. Intro), or Title Case lines
                is_heading = False
                candidate = clean_line

                if clean_line.startswith(("#", "##", "###")):
                    candidate = clean_line.lstrip("#").strip()
                    is_heading = True
                elif re.match(r"^(\d+\.|\d+\.\d+|[A-Z]\.)\s+[A-Za-z]", clean_line):
                    candidate = re.sub(r"^(\d+\.|\d+\.\d+|[A-Z]\.)\s+", "", clean_line).strip()
                    is_heading = True
                elif clean_line.isupper() and 3 < len(clean_line) < 50:
                    candidate = clean_line.title()
                    is_heading = True
                elif (
                    len(clean_line) < 60
                    and clean_line.endswith(":")
                    and not clean_line.startswith(("http", "www"))
                ):
                    candidate = clean_line.rstrip(":").strip()
                    is_heading = True

                if is_heading and 3 <= len(candidate) <= 65:
                    # Ignore pure numbers or single words that are stopwords
                    if candidate.lower() not in seen_lower and not candidate.isdigit():
                        seen_lower.add(candidate.lower())
                        discovered_topics.append(candidate)
                        if len(discovered_topics) >= 8:
                            break
            if len(discovered_topics) >= 8:
                break

        # Fallback to key concept extraction if no explicit headings were found
        if len(discovered_topics) < 2:
            all_text = " ".join(c.get("content", "") for c in chunks[:5])
            words = self._tokenize(all_text)
            # Find common capitalized multi-word phrases or bigrams
            bigrams = re.findall(r"\b([A-Z][a-z]+ [A-Z][a-z]+)\b", all_text)
            for bg in bigrams:
                if bg.lower() not in seen_lower and len(bg) > 6:
                    seen_lower.add(bg.lower())
                    discovered_topics.append(bg)
                    if len(discovered_topics) >= 6:
                        break

        # Guarantee at least some default meaningful topics
        if not discovered_topics:
            discovered_topics = ["Core Concepts", "Key Definitions", "Analytical Principles"]

        return discovered_topics[:8]


retrieval_service = RetrievalService()

