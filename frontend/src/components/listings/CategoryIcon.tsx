import { BookOpen, FileText, Printer } from "lucide-react";
import type { ListingCategory } from "@/types";

const ICONS = {
  BOOK: BookOpen,
  NOTES: FileText,
  EBOOK_PRINTOUT: Printer,
} as const satisfies Record<ListingCategory, unknown>;

/** Keeps one icon per backend category value across the whole app. */
export function CategoryIcon({
  category,
  className,
}: {
  category: ListingCategory;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon aria-hidden className={className} />;
}
