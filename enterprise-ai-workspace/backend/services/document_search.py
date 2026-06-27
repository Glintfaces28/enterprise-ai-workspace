import re
from pathlib import Path

import models
from services.pdf_reader import read_pdf

STOPWORDS = {
    "a",
    "about",
    "all",
    "am",
    "an",
    "and",
    "anything",
    "are",
    "auf",
    "bitte",
    "can",
    "der",
    "die",
    "das",
    "document",
    "documents",
    "ein",
    "eine",
    "for",
    "from",
    "is",
    "it",
    "me",
    "mir",
    "of",
    "please",
    "sage",
    "say",
    "tell",
    "the",
    "this",
    "to",
    "und",
    "was",
    "what",
    "with",
    "you",
}


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _query_tokens(text: str) -> set[str]:
    return {token for token in _tokenize(text) if token not in STOPWORDS and len(token) > 2}


def _split_passages(text: str, max_words: int = 90) -> list[str]:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    paragraphs = []
    current_words = []

    for line in lines:
        words = line.split()
        if len(words) <= 3 and current_words:
            paragraphs.append(" ".join(current_words))
            current_words = words
            continue

        current_words.extend(words)
        if len(current_words) >= max_words:
            paragraphs.append(" ".join(current_words))
            current_words = []

    if current_words:
        paragraphs.append(" ".join(current_words))

    passages = []

    for paragraph in paragraphs:
        words = paragraph.split()
        for start in range(0, len(words), max_words):
            passage = " ".join(words[start : start + max_words]).strip()
            if passage:
                passages.append(passage)

    return passages


def _is_useful_overview_passage(passage: str) -> bool:
    words = passage.split()
    return len(words) >= 8


def _score_passage(query_tokens: set[str], passage: str) -> int:
    passage_tokens = _tokenize(passage)
    return sum(1 for token in passage_tokens if token in query_tokens)


def _is_pdf_document(document: models.Document) -> bool:
    return document.content_type == "application/pdf" or document.filename.lower().endswith(".pdf")


def _document_passages(document: models.Document) -> list[str]:
    file_path = Path(document.file_path)
    if not file_path.exists():
        return []

    text = read_pdf(str(file_path))
    return _split_passages(text)


def _overview_results(documents: list[models.Document], limit: int) -> list[dict]:
    results = []

    for document in documents:
        if not _is_pdf_document(document):
            continue

        passages = _document_passages(document)
        useful_passage = next((passage for passage in passages if _is_useful_overview_passage(passage)), None)
        if useful_passage:
            results.append(
                {
                    "document_id": document.id,
                    "filename": document.filename,
                    "score": 0,
                    "passage": useful_passage,
                }
            )

        if len(results) >= limit:
            break

    return results


def search_documents(db, query: str, limit: int = 5, document_id: int | None = None) -> list[dict]:
    query_tokens = _query_tokens(query)

    documents_query = db.query(models.Document)
    if document_id is not None:
        documents_query = documents_query.filter(models.Document.id == document_id)

    documents = documents_query.all()
    if not query_tokens:
        return _overview_results(documents, limit)

    results = []
    for document in documents:
        if not _is_pdf_document(document):
            continue

        for passage in _document_passages(document):
            score = _score_passage(query_tokens, passage)
            if score > 0:
                results.append(
                    {
                        "document_id": document.id,
                        "filename": document.filename,
                        "score": score,
                        "passage": passage,
                    }
                )

    results.sort(key=lambda result: result["score"], reverse=True)
    if results:
        return results[:limit]

    return _overview_results(documents, limit)


def build_document_answer(query: str, results: list[dict]) -> str:
    if not results:
        return (
            "I found no readable text in the uploaded PDF documents. "
            "If the PDF is scanned, it may need OCR before I can search it."
        )

    best_passage = results[0]["passage"]
    filename = results[0]["filename"]
    if results[0]["score"] == 0:
        return f"Based on {filename}, here is the first readable context I found: {best_passage}"

    return f"Based on {filename}, the most relevant information I found is: {best_passage}"
