import mammoth from 'mammoth';
import { ParseError, type ParsedDocument } from './pdf';

export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      return {
        text: '',
        pageCount: 1,
      };
    }

    // Log any warnings
    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }

    // Clean up the text
    const cleanedText = cleanText(result.value);

    // Estimate page count (roughly 3000 characters per page)
    const estimatedPages = Math.max(1, Math.ceil(cleanedText.length / 3000));

    return {
      text: cleanedText,
      pageCount: estimatedPages,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new ParseError(`Failed to parse DOCX: ${error.message}`);
    }
    throw new ParseError('Failed to parse DOCX: Unknown error');
  }
}

function cleanText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove null characters
      .replace(/\0/g, '')
      .trim()
  );
}
