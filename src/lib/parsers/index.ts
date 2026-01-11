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
