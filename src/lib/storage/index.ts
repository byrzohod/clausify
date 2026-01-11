import {
  uploadFileLocal,
  downloadFileLocal,
  deleteFileLocal,
  getFileUrl as getLocalFileUrl,
} from './local';

// Check if we should use local storage
const useLocalStorage = process.env.STORAGE_PROVIDER === 'local' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Lazy import Supabase storage only when needed
async function getSupabaseStorage() {
  const { uploadFile, downloadFile, deleteFile, getSignedUrl } = await import(
    '../supabase/storage'
  );
  return { uploadFile, downloadFile, deleteFile, getSignedUrl };
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<{ path: string; url: string }> {
  if (useLocalStorage) {
    console.log('[Storage] Using local file storage');
    return uploadFileLocal(file, fileName, userId);
  }

  console.log('[Storage] Using Supabase storage');
  const storage = await getSupabaseStorage();
  return storage.uploadFile(file, fileName, userId);
}

export async function downloadFile(path: string): Promise<Buffer> {
  if (useLocalStorage) {
    return downloadFileLocal(path);
  }

  const storage = await getSupabaseStorage();
  return storage.downloadFile(path);
}

export async function deleteFile(path: string): Promise<void> {
  if (useLocalStorage) {
    return deleteFileLocal(path);
  }

  const storage = await getSupabaseStorage();
  return storage.deleteFile(path);
}

export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  if (useLocalStorage) {
    // Local storage doesn't need signed URLs
    return getLocalFileUrl(path);
  }

  const storage = await getSupabaseStorage();
  return storage.getSignedUrl(path, expiresIn);
}
