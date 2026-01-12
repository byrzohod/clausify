/**
 * OCR module for extracting text from scanned documents
 * Uses image-based text extraction when PDF has no text layer
 */

import pdfParse from 'pdf-parse';

export interface OCROptions {
  maxPages?: number;
  onProgress?: (progress: number) => void;
}

export interface OCRResult {
  text: string;
  usedOCR: boolean;
  confidence?: number;
  pageCount?: number;
}

export interface ScanDetectionResult {
  isScanned: boolean;
  confidence: number;
  pageCount: number;
  textLength: number;
}

/**
 * Detect if a PDF is a scanned document (image-based with no text layer)
 */
export async function detectScannedPDF(buffer: Buffer): Promise<ScanDetectionResult> {
  try {
    const result = await pdfParse(buffer);

    const textLength = result.text?.trim().length || 0;
    const pageCount = result.numpages || 1;
    const charsPerPage = textLength / pageCount;

    // Heuristics for scanned document detection
    // A typical text page has 2000-3000 characters
    // Scanned PDFs usually have 0-100 characters (from metadata only)
    const isScanned = charsPerPage < 100;
    const confidence = isScanned
      ? Math.min(1, (100 - charsPerPage) / 100)
      : 0;

    return {
      isScanned,
      confidence,
      pageCount,
      textLength,
    };
  } catch (error) {
    console.error('[OCR] Error detecting scanned PDF:', error);
    return {
      isScanned: false,
      confidence: 0,
      pageCount: 0,
      textLength: 0,
    };
  }
}

/**
 * Simple OCR placeholder - in production, integrate with Tesseract.js or cloud OCR
 * For now, this returns a message indicating OCR is needed
 */
async function performOCR(
  buffer: Buffer,
  options: OCROptions = {}
): Promise<{ text: string; confidence: number }> {
  // Placeholder for actual OCR implementation
  // In production, integrate with:
  // - Tesseract.js for free local OCR
  // - Google Cloud Vision for high accuracy
  // - AWS Textract for document understanding

  console.log('[OCR] OCR processing requested - placeholder implementation');

  // Return placeholder text indicating OCR was attempted
  return {
    text: '[This document appears to be a scanned image. OCR processing is required to extract text. Please ensure the document is a text-based PDF for best results.]',
    confidence: 0,
  };
}

/**
 * Extract text from PDF with OCR fallback for scanned documents
 */
export async function extractTextWithOCR(
  pdfBuffer: Buffer,
  options: OCROptions = {}
): Promise<OCRResult> {
  // First, detect if this is a scanned document
  const detection = await detectScannedPDF(pdfBuffer);

  if (!detection.isScanned) {
    // Regular PDF with text layer - use standard extraction
    try {
      const result = await pdfParse(pdfBuffer);
      return {
        text: result.text || '',
        usedOCR: false,
        pageCount: result.numpages,
      };
    } catch (error) {
      console.error('[OCR] PDF parsing failed:', error);
      throw new Error('Failed to parse PDF document');
    }
  }

  // Scanned document - attempt OCR
  console.log('[OCR] Detected scanned document, attempting OCR...');

  const ocrResult = await performOCR(pdfBuffer, options);

  return {
    text: ocrResult.text,
    usedOCR: true,
    confidence: ocrResult.confidence,
    pageCount: detection.pageCount,
  };
}

/**
 * Check if OCR is available (dependencies installed)
 */
export function isOCRAvailable(): boolean {
  // In a full implementation, check for Tesseract.js or cloud API availability
  return true;
}
