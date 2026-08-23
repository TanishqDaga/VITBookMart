import { EXAM_SLOT_ROWS, type ExamSlot } from "@/types";
import { cn } from "@/lib/cn";

interface ExamSlotPickerProps {
  value: ExamSlot[];
  onChange: (value: ExamSlot[]) => void;
}

/**
 * The 7x2 slot board, laid out the way the enum is declared (A1/A2 … G1/G2).
 *
 * The helper text stays factual. The backend defines only two things about these
 * values: they are attached to RENT listings, and the field is called
 * "unavailableExamSlots". Nothing in the codebase documents any further meaning,
 * so nothing further is claimed here.
 */
export function ExamSlotPicker({ value, onChange }: ExamSlotPickerProps) {
  const selected = new Set(value);

  const toggle = (slot: ExamSlot) => {
    const next = new Set(selected);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);

    // Keep the submitted order matching the enum's declaration order.
    onChange(EXAM_SLOT_ROWS.flat().filter((item) => next.has(item)));
  };

  return (
    <div>
      <div
        role="group"
        aria-label="Unavailable exam slots"
        className="grid grid-cols-2 gap-2 sm:max-w-xs"
      >
        {EXAM_SLOT_ROWS.flat().map((slot) => {
          const isSelected = selected.has(slot);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => toggle(slot)}
              aria-pressed={isSelected}
              className={cn(
                "rounded-xl border px-3 py-2.5 font-mono text-sm font-semibold transition-colors",
                isSelected
                  ? "border-accent-600 bg-accent-600 text-white"
                  : "border-line bg-white text-ink-muted hover:border-brand-300 hover:text-ink",
              )}
            >
              {slot}
              {/* Selection isn't signalled by colour alone. */}
              <span className="sr-only">{isSelected ? " selected" : " not selected"}</span>
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-3 rounded-md text-[13px] font-semibold text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
        >
          Clear all slots
        </button>
      )}
    </div>
  );
}
