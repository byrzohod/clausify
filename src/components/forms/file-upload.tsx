'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  progress?: number;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({
  onUpload,
  isUploading = false,
  progress = 0,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorCode = rejection.errors[0]?.code;

        // Map error codes to user-friendly messages
        let errorMessage: string;
        switch (errorCode) {
          case 'file-too-large':
            const sizeMB = (rejection.file.size / 1024 / 1024).toFixed(1);
            errorMessage = `File is too large (${sizeMB}MB). Maximum size is 10MB. Try compressing the file or removing images.`;
            break;
          case 'file-invalid-type':
            errorMessage = `"${rejection.file.name}" is not a supported file type. Please upload a PDF or DOCX file.`;
            break;
          case 'too-many-files':
            errorMessage = 'Only one file can be uploaded at a time. Please select a single contract.';
            break;
          default:
            errorMessage = rejection.errors[0]?.message || 'File could not be uploaded. Please try again.';
        }

        setError(errorMessage);
        return;
      }

      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">
            {isDragActive ? 'Drop your contract here' : 'Upload your contract'}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop or click to select
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Supported: PDF, DOCX (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {!isUploading && (
            <Button className="mt-4 w-full" onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Analyze
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
