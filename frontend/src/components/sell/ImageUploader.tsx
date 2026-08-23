import { useCallback, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatFileSize } from "@/lib/format";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/constants/app";

interface ImageUploaderProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

/**
 * Mirrors ListingService.validateImage: JPEG, PNG or WEBP, under 5 MB, exactly one
 * file. Failing fast here saves a wasted upload — the backend still validates.
 */
export function validateImageFile(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Only JPG, PNG and WEBP images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${formatFileSize(file.size)}. Pick one under 5 MB.`;
  }
  return null;
}

export function ImageUploader({ file, onChange, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const descriptionId = useId();

  const accept = useCallback(
    (candidate: File | undefined) => {
      if (!candidate) return;

      const problem = validateImageFile(candidate);
      if (problem) {
        setLocalError(problem);
        onChange(null);
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return null;
        });
        return;
      }

      setLocalError(null);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(candidate);
      });
      onChange(candidate);
    },
    [onChange],
  );

  const clear = () => {
    setLocalError(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const shownError = localError ?? error;

  if (file && preview) {
    return (
      <div className="space-y-3">
        <div className="flex gap-4 rounded-2xl border border-line bg-white p-3.5">
          <img
            src={preview}
            alt="Preview of the image you selected"
            className="h-28 w-24 shrink-0 rounded-xl object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{formatFileSize(file.size)}</p>

            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Replace
              </button>
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-danger-600 transition-colors hover:bg-danger-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_EXTENSIONS}
          className="sr-only"
          onChange={(event) => accept(event.target.files?.[0])}
        />

        {shownError && (
          <p role="alert" className="text-xs font-medium text-danger-600">
            {shownError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-line-strong bg-white",
          shownError && "border-danger-600",
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={descriptionId}
          aria-invalid={shownError ? true : undefined}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl px-6 py-10 text-center"
        >
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
          >
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="mt-1 text-sm font-semibold text-ink">
            Drop a photo here, or tap to choose
          </span>
          <span id={descriptionId} className="text-xs text-ink-soft">
            One image · JPG, PNG or WEBP · up to 5 MB
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {shownError && (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {shownError}
        </p>
      )}
    </div>
  );
}
