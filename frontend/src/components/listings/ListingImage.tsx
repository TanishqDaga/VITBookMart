import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

interface ListingImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Detail pages load their image immediately; grid cards defer. */
  priority?: boolean;
  sizes?: string;
}

/**
 * Cloudinary-backed listing image with its own loading and failure states, so a
 * single broken URL degrades to a placeholder instead of an empty card.
 */
export function ListingImage({
  src,
  alt,
  className,
  priority,
  sizes,
}: ListingImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error",
  );

  if (!src || status === "error") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface-sunken text-ink-soft/60",
          className,
        )}
        role="img"
        aria-label={`${alt} — no image available`}
      >
        <ImageOff className="h-7 w-7" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-surface-sunken", className)}>
      {status === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          status === "loaded" ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
