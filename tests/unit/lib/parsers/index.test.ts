import { describe, it, expect, vi } from 'vitest';
import {
  isSupportedType,
  getFileExtension,
  getMimeTypeFromExtension,
  ParseError,
} from '@/lib/parsers';

describe('Parser utilities', () => {
  describe('isSupportedType', () => {
    it('returns true for PDF mime type', () => {
      expect(isSupportedType('application/pdf')).toBe(true);
    });

    it('returns true for DOCX mime type', () => {
      expect(
        isSupportedType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe(true);
    });

    it('returns true for DOC mime type', () => {
      expect(isSupportedType('application/msword')).toBe(true);
    });

    it('returns false for unsupported mime types', () => {
      expect(isSupportedType('text/plain')).toBe(false);
      expect(isSupportedType('image/png')).toBe(false);
      expect(isSupportedType('application/json')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('returns .pdf for PDF mime type', () => {
      expect(getFileExtension('application/pdf')).toBe('.pdf');
    });

    it('returns .docx for DOCX mime type', () => {
      expect(
        getFileExtension(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe('.docx');
    });

    it('returns .doc for DOC mime type', () => {
      expect(getFileExtension('application/msword')).toBe('.doc');
    });

    it('returns empty string for unknown mime types', () => {
      expect(getFileExtension('text/plain')).toBe('');
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('returns correct mime type for .pdf', () => {
      expect(getMimeTypeFromExtension('.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('pdf')).toBe('application/pdf');
    });

    it('returns correct mime type for .docx', () => {
      expect(getMimeTypeFromExtension('.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('returns correct mime type for .doc', () => {
      expect(getMimeTypeFromExtension('.doc')).toBe('application/msword');
    });

    it('returns null for unknown extensions', () => {
      expect(getMimeTypeFromExtension('.txt')).toBeNull();
      expect(getMimeTypeFromExtension('.png')).toBeNull();
    });

    it('is case insensitive', () => {
      expect(getMimeTypeFromExtension('.PDF')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('.DOCX')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });
  });
});
