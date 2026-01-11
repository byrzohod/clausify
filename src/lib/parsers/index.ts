import { parsePdf, ParseError, type ParsedDocument } from './pdf';
import { parseDocx } from './docx';

export { ParseError };
export type { ParsedDocument };

const SUPPORTED_TYPES = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    parseDocx,
  'application/msword': parseDocx, // Legacy .doc format (best effort)
};

export type SupportedMimeType = keyof typeof SUPPORTED_TYPES;

export function isSupportedType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType in SUPPORTED_TYPES;
}

/**
 * File magic bytes signatures for validation
 * This prevents MIME type spoofing by checking actual file content
 */
const FILE_SIGNATURES = {
  // PDF files start with %PDF
  pdf: {
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
  },
  // DOCX/XLSX/PPTX are ZIP files with specific structure
  // ZIP files start with PK (0x50, 0x4B)
  zip: {
    signature: [0x50, 0x4B, 0x03, 0x04], // PK..
    offset: 0,
  },
  // Alternative ZIP signatures (empty archive, spanned archive)
  zipEmpty: {
    signature: [0x50, 0x4B, 0x05, 0x06],
    offset: 0,
  },
  zipSpanned: {
    signature: [0x50, 0x4B, 0x07, 0x08],
    offset: 0,
  },
};

/**
 * Validate file content matches the expected type by checking magic bytes.
 * Returns true if the file content matches the declared MIME type.
 */
export function validateFileMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) {
    return false; // File too small to validate
  }

  switch (mimeType) {
    case 'application/pdf':
      return matchesSignature(buffer, FILE_SIGNATURES.pdf);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      // DOCX files are ZIP archives - check for ZIP signature
      return (
        matchesSignature(buffer, FILE_SIGNATURES.zip) ||
        matchesSignature(buffer, FILE_SIGNATURES.zipEmpty) ||
        matchesSignature(buffer, FILE_SIGNATURES.zipSpanned)
      );

    default:
      return false;
  }
}

/**
 * Check if buffer matches a file signature at the specified offset
 */
function matchesSignature(
  buffer: Buffer,
  sig: { signature: number[]; offset: number }
): boolean {
  if (buffer.length < sig.offset + sig.signature.length) {
    return false;
  }

  for (let i = 0; i < sig.signature.length; i++) {
    if (buffer[sig.offset + i] !== sig.signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Detect the actual file type from magic bytes (independent of declared MIME type)
 */
export function detectFileType(buffer: Buffer): string | null {
  if (buffer.length < 4) {
    return null;
  }

  // Check for PDF
  if (matchesSignature(buffer, FILE_SIGNATURES.pdf)) {
    return 'application/pdf';
  }

  // Check for ZIP-based formats (DOCX, XLSX, etc.)
  if (
    matchesSignature(buffer, FILE_SIGNATURES.zip) ||
    matchesSignature(buffer, FILE_SIGNATURES.zipEmpty) ||
    matchesSignature(buffer, FILE_SIGNATURES.zipSpanned)
  ) {
    // Could be DOCX, XLSX, PPTX, or plain ZIP
    // For simplicity, we return the DOCX type since that's what we support
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return null;
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedDocument> {
  if (!isSupportedType(mimeType)) {
    throw new ParseError(
      `Unsupported file type: ${mimeType}. Supported types: PDF, DOCX`
    );
  }

  const parser = SUPPORTED_TYPES[mimeType];
  return parser(buffer);
}

export function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    case 'application/msword':
      return '.doc';
    default:
      return '';
  }
}

export function getMimeTypeFromExtension(extension: string): string | null {
  const ext = extension.toLowerCase().replace('.', '');
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    default:
      return null;
  }
}
