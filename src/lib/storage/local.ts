import { promises as fs } from 'fs';
import path from 'path';

// Local storage directory (relative to project root)
const STORAGE_DIR = process.env.LOCAL_STORAGE_PATH || './uploads';

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function uploadFileLocal(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<{ path: string; url: string }> {
  const userDir = path.join(STORAGE_DIR, userId);
  await ensureDir(userDir);

  const uniqueFileName = `${Date.now()}-${fileName}`;
  const filePath = path.join(userDir, uniqueFileName);
  const relativePath = `${userId}/${uniqueFileName}`;

  await fs.writeFile(filePath, file);

  // Return a URL that our API can serve
  return {
    path: relativePath,
    url: `/api/files/${relativePath}`,
  };
}

export async function downloadFileLocal(filePath: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_DIR, filePath);
  try {
    return await fs.readFile(fullPath);
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

export async function deleteFileLocal(filePath: string): Promise<void> {
  const fullPath = path.join(STORAGE_DIR, filePath);
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    // Ignore if file doesn't exist
    console.warn(`Failed to delete file: ${filePath}`);
  }
}

export async function getFileUrl(filePath: string): Promise<string> {
  // For local storage, just return the API URL
  return `/api/files/${filePath}`;
}
