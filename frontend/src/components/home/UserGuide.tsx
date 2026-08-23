import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Handshake, MapPin, MessageCircle, Search, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * These are numbered because they genuinely are a sequence: this is the order a
 * transaction happens in, from finding a listing to handing over the book.
 */
const STEPS = [
  {
    number: "01",
    title: "Browse",
    body: "Find books, notes and study material from fellow students.",
    icon: Search,
  },
  {
    number: "02",
    title: "Choose",
    body: "Check the listing details, price and availability.",
    icon: Tag,
  },
  {
    number: "03",
    title: "Contact",
    body: "Connect with the seller through WhatsApp.",
    icon: MessageCircle,
  },
  {
    number: "04",
    title: "Meet",
    body: "Complete the transaction conveniently on campus.",
    icon: MapPin,
  },
  {
    number: "05",
    title: "Sell",
    body: "Have something you no longer need? List it for another student.",
    icon: Handshake,
  },
];

const AUTO_SCROLL_INTERVAL = 4200;

export function UserGuide() {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [interacted, setInteracted] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  const updateArrows = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 8);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const node = scrollerRef.current;
    if (!node) return;

    node.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      node.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector("li");
    const step = card ? card.clientWidth + 16 : node.clientWidth * 0.8;
    node.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  /**
   * Drifts one card at a time and loops back to the start. It stops permanently
   * the moment the reader touches it, and never starts at all under
   * prefers-reduced-motion.
   */
  useEffect(() => {
    if (interacted || reducedMotion) return;

    const timer = window.setInterval(() => {
      const node = scrollerRef.current;
      if (!node) return;

      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 8;
      if (atEnd) {
        node.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, AUTO_SCROLL_INTERVAL);

    return () => window.clearInterval(timer);
  }, [interacted, reducedMotion, scrollByCard]);

  const stop = () => setInteracted(true);

  return (
    <section aria-labelledby="how-it-works" className="page-shell py-12 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="how-it-works" className="text-display-sm font-extrabold">
            How VITBookMart works
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            Five steps from finding a book to handing it over.
          </p>
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => {
              stop();
              scrollByCard(-1);
            }}
            disabled={!canScrollLeft}
            aria-label="Previous steps"
            className="rounded-xl border border-line bg-white p-2.5 text-ink-muted transition-colors hover:border-brand-300 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              stop();
              scrollByCard(1);
            }}
            disabled={!canScrollRight}
            aria-label="More steps"
            className="rounded-xl border border-line bg-white p-2.5 text-ink-muted transition-colors hover:border-brand-300 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={scrollerRef}
        onPointerDown={stop}
        onWheel={stop}
        onFocusCapture={stop}
        onTouchStart={stop}
        // Focusable so keyboard users can scroll it with the arrow keys.
        tabIndex={0}
        aria-label="How VITBookMart works, five steps"
        className={cn(
          "scrollbar-none mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2",
          // Bleed to the screen edges on mobile so cards don't look clipped.
          "-mx-4 px-4 sm:mx-0 sm:px-0",
        )}
      >
        {STEPS.map(({ number, title, body, icon: Icon }) => (
          <li
            key={number}
            className="w-[15.5rem] shrink-0 snap-start sm:w-[16.5rem]"
          >
            <div className="h-full rounded-2xl border border-line bg-white p-5 shadow-card transition-colors hover:border-brand-200">
              <div className="flex items-center justify-between">
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm font-bold text-line-strong">{number}</span>
              </div>
              <h3 className="mt-4 text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
