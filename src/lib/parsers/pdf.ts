import pdf from 'pdf-parse';

export interface ParsedDocument {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return {
        text: '',
        pageCount: data.numpages,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          creationDate: data.info?.CreationDate,
        },
      };
    }

    // Clean up the text
    const cleanedText = cleanText(data.text);

    return {
      text: cleanedText,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new ParseError(`Failed to parse PDF: ${error.message}`);
    }
    throw new ParseError('Failed to parse PDF: Unknown error');
  }
}

function cleanText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR issues
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Remove page numbers patterns
      .replace(/\b(Page|PAGE)\s*\d+\s*(of|OF)?\s*\d*\b/gi, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove null characters
      .replace(/\0/g, '')
      .trim()
  );
}
