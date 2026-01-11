'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, X, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SelectedFile {
  file: File;
  preview: string;
}

interface DualFileUploadProps {
  onFilesSelected: (leftFile: File | null, rightFile: File | null) => void;
  onCompare: () => void;
  isComparing?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function DualFileUpload({
  onFilesSelected,
  onCompare,
  isComparing = false,
  leftLabel = 'First Contract',
  rightLabel = 'Second Contract',
  className,
}: DualFileUploadProps) {
  const [leftFile, setLeftFile] = useState<SelectedFile | null>(null);
  const [rightFile, setRightFile] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLeftDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length > 0) {
        setError(rejections[0].errors[0]?.message || 'File rejected');
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setLeftFile({ file, preview: file.name });
        onFilesSelected(file, rightFile?.file || null);
      }
    },
    [rightFile, onFilesSelected]
  );

  const handleRightDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length > 0) {
        setError(rejections[0].errors[0]?.message || 'File rejected');
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setRightFile({ file, preview: file.name });
        onFilesSelected(leftFile?.file || null, file);
      }
    },
    [leftFile, onFilesSelected]
  );

  const leftDropzone = useDropzone({
    onDrop: handleLeftDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isComparing,
  });

  const rightDropzone = useDropzone({
    onDrop: handleRightDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isComparing,
  });

  const removeLeft = () => {
    setLeftFile(null);
    onFilesSelected(null, rightFile?.file || null);
  };

  const removeRight = () => {
    setRightFile(null);
    onFilesSelected(leftFile?.file || null, null);
  };

  const canCompare = leftFile && rightFile && !isComparing;

  return (
    <div className={cn('w-full', className)} data-testid="dual-file-upload">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Upload Zone */}
        <div>
          <label className="mb-2 block text-sm font-medium">{leftLabel}</label>
          {!leftFile ? (
            <div
              {...leftDropzone.getRootProps()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                leftDropzone.isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50',
                isComparing && 'pointer-events-none opacity-50'
              )}
              data-testid="left-dropzone"
            >
              <input {...leftDropzone.getInputProps()} />
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {leftDropzone.isDragActive ? 'Drop here' : 'Drop or click'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX</p>
            </div>
          ) : (
            <div
              className="rounded-lg border bg-card p-4"
              data-testid="left-file-preview"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{leftFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(leftFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isComparing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeLeft}
                    aria-label="Remove left file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Upload Zone */}
        <div>
          <label className="mb-2 block text-sm font-medium">{rightLabel}</label>
          {!rightFile ? (
            <div
              {...rightDropzone.getRootProps()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                rightDropzone.isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50',
                isComparing && 'pointer-events-none opacity-50'
              )}
              data-testid="right-dropzone"
            >
              <input {...rightDropzone.getInputProps()} />
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {rightDropzone.isDragActive ? 'Drop here' : 'Drop or click'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX</p>
            </div>
          ) : (
            <div
              className="rounded-lg border bg-card p-4"
              data-testid="right-file-preview"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{rightFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(rightFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isComparing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeRight}
                    aria-label="Remove right file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-center">
        <Button
          onClick={onCompare}
          disabled={!canCompare}
          className="min-w-[200px]"
          data-testid="compare-button"
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {isComparing ? 'Comparing...' : 'Compare Contracts'}
        </Button>
      </div>
    </div>
  );
}
