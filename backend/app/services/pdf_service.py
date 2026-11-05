"""
QuizGenius AI — PDF Processing Service (PyMuPDF)
Extracts page-by-page text, validates readability, and chunks content with page references.
"""
from typing import Dict, Any, List
import re
import pymupdf


class ScannedPDFException(ValueError):
    """Raised when a PDF contains no extractable text (e.g. scanned image)."""
    pass


class PDFProcessingService:
    def __init__(self, default_chunk_size: int = 1000, default_chunk_overlap: int = 150):
        self.chunk_size = default_chunk_size
        self.chunk_overlap = default_chunk_overlap

    def extract_text_and_chunks(
        self,
        pdf_bytes: bytes,
        chunk_size: int = None,
        chunk_overlap: int = None,
    ) -> Dict[str, Any]:
        """
        Extracts digital text from raw PDF bytes page by page.
        Validates that text exists, raises a clear error for scanned or empty PDFs,
        and produces structured chunks with preserved page boundaries.
        """
        c_size = chunk_size or self.chunk_size
        c_overlap = chunk_overlap or self.chunk_overlap

        if not pdf_bytes or len(pdf_bytes) == 0:
            raise ValueError("Empty or invalid PDF byte stream.")

        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Unable to parse PDF file. The file may be corrupted: {str(e)}")

        page_count = len(doc)
        if page_count == 0:
            doc.close()
            raise ValueError("The provided PDF file contains zero pages.")

        page_data: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []

        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = doc[page_idx]
            text = page.get_text("text") or ""
            # Normalize whitespace
            cleaned_text = re.sub(r'[ \t]+', ' ', text).strip()
            if cleaned_text:
                full_text_parts.append(f"[Page {page_num}]\n{cleaned_text}")
                page_data.append({
                    "page_num": page_num,
                    "text": cleaned_text
                })

        doc.close()

        total_extracted_text = "\n\n".join(full_text_parts).strip()

        # Check for scanned or unreadable PDF
        if not total_extracted_text or len(total_extracted_text.strip()) < 10:
            raise ScannedPDFException(
                "This document contains no extractable digital text (e.g., scanned images or blank pages). "
                "Optical Character Recognition (OCR) support will be added in a later phase."
            )

        # Generate chunks preserving page references
        chunks = self._generate_chunks(page_data, chunk_size=c_size, chunk_overlap=c_overlap)

        if not chunks:
            # Fallback for small content
            chunks = [{
                "chunk_index": 0,
                "content": total_extracted_text,
                "page_start": page_data[0]["page_num"] if page_data else 1,
                "page_end": page_data[-1]["page_num"] if page_data else 1,
            }]

        return {
            "page_count": page_count,
            "extracted_text": total_extracted_text,
            "chunks": chunks,
            "char_count": len(total_extracted_text),
            "word_count": len(total_extracted_text.split()),
        }

    def _generate_chunks(
        self,
        page_data: List[Dict[str, Any]],
        chunk_size: int,
        chunk_overlap: int,
    ) -> List[Dict[str, Any]]:
        """
        Splits page text into coherent chunks without slicing words in half,
        accurately tracking the page_start and page_end for each chunk.
        """
        chunks: List[Dict[str, Any]] = []
        chunk_index = 0

        # Build tokenized / sentence-aware elements with page attribution
        elements: List[Dict[str, Any]] = []
        for p in page_data:
            p_num = p["page_num"]
            # Split page text into paragraphs or sentences
            paragraphs = [para.strip() for para in p["text"].split("\n") if para.strip()]
            for para in paragraphs:
                elements.append({"text": para, "page": p_num})

        current_chunk_text = ""
        current_page_start = None
        current_page_end = None

        for el in elements:
            el_text = el["text"]
            el_page = el["page"]

            if not current_chunk_text:
                current_chunk_text = el_text
                current_page_start = el_page
                current_page_end = el_page
            elif len(current_chunk_text) + len(el_text) + 1 <= chunk_size:
                current_chunk_text += "\n" + el_text
                current_page_end = el_page
            else:
                # Save completed chunk
                if current_chunk_text.strip():
                    chunks.append({
                        "chunk_index": chunk_index,
                        "content": current_chunk_text.strip(),
                        "page_start": current_page_start,
                        "page_end": current_page_end,
                    })
                    chunk_index += 1

                # Carry over overlap if possible
                overlap_text = ""
                if chunk_overlap > 0 and len(current_chunk_text) > chunk_overlap:
                    # Take last words within overlap limit
                    words = current_chunk_text.split()
                    acc = []
                    acc_len = 0
                    for w in reversed(words):
                        if acc_len + len(w) + 1 <= chunk_overlap:
                            acc.insert(0, w)
                            acc_len += len(w) + 1
                        else:
                            break
                    overlap_text = " ".join(acc)

                if overlap_text:
                    current_chunk_text = overlap_text + "\n" + el_text
                else:
                    current_chunk_text = el_text

                current_page_start = el_page
                current_page_end = el_page

        # Append trailing chunk
        if current_chunk_text.strip():
            chunks.append({
                "chunk_index": chunk_index,
                "content": current_chunk_text.strip(),
                "page_start": current_page_start,
                "page_end": current_page_end,
            })

        return chunks


pdf_service = PDFProcessingService()

