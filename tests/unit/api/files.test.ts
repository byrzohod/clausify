import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/options', () => ({
  authOptions: {},
}));

vi.mock('@/lib/storage', () => ({
  downloadFile: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { downloadFile } from '@/lib/storage';

describe('Files API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/files/[...path]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test.pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test.pdf'] } }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for path traversal attempts with ..', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/../etc/passwd');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['..', 'etc', 'passwd'] } }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid path');
    });

    it('should return 400 for path traversal attempts with ./', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/./test.pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['.', 'test.pdf'] } }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid path');
    });

    it('should return 400 for path traversal attempts with absolute path', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files//etc/passwd');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['', 'etc', 'passwd'] } }
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid file type', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test.exe');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test.exe'] } }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid file type');
    });

    it('should return 403 when accessing another users files', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-2/test.pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-2', 'test.pdf'] } }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should return file for valid PDF request', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(downloadFile).mockResolvedValue(Buffer.from('PDF content'));

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test.pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test.pdf'] } }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('test.pdf');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(downloadFile).toHaveBeenCalledWith('user-1/test.pdf');
    });

    it('should return file for valid DOCX request', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(downloadFile).mockResolvedValue(Buffer.from('DOCX content'));

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test.docx');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test.docx'] } }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('should return file for valid DOC request', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(downloadFile).mockResolvedValue(Buffer.from('DOC content'));

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test.doc');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test.doc'] } }
      );

      expect(response.status).toBe(200);
    });

    it('should return 404 when file not found', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(downloadFile).mockRejectedValue(new Error('File not found'));

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/missing.pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'missing.pdf'] } }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('File not found');
    });

    it('should sanitize special characters in filename', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(downloadFile).mockResolvedValue(Buffer.from('PDF content'));

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test file (1).pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test file (1).pdf'] } }
      );

      expect(response.status).toBe(200);
      // Special characters should be sanitized in Content-Disposition
      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toBeDefined();
      expect(disposition).not.toContain('(');
      expect(disposition).not.toContain(')');
    });

    it('should include no-cache headers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(downloadFile).mockResolvedValue(Buffer.from('PDF content'));

      const { GET } = await import('@/app/api/files/[...path]/route');
      const request = new Request('http://localhost/api/files/user-1/test.pdf');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: { path: ['user-1', 'test.pdf'] } }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      expect(response.headers.get('Pragma')).toBe('no-cache');
    });
  });
});
