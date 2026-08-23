import { Handshake, IndianRupee, RefreshCw, ShoppingBag } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShoppingBag, label: "Buy", body: "Get what you need for the semester." },
  { icon: IndianRupee, label: "Sell", body: "Turn last year's books into cash." },
  { icon: RefreshCw, label: "Rent", body: "Borrow study material when you need it." },
  { icon: Handshake, label: "Connect", body: "Meet students on your own campus." },
];

export function WelcomeSection() {
  return (
    <section aria-labelledby="welcome" className="page-shell pt-12 sm:pt-14">
      <div className="rounded-3xl border border-line bg-white px-6 py-10 shadow-card sm:px-10 sm:py-12">
        <div className="max-w-2xl">
          <h2 id="welcome" className="text-display-md font-extrabold">
            Welcome to VITBookMart
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Your campus marketplace for books, notes and study material. Buy what you need,
            sell what you no longer use, and rent study material when you need it.
          </p>
        </div>

        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, label, body }) => (
            <li key={label} className="flex gap-3.5">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block font-display text-[15px] font-bold text-ink">{label}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-muted">
                  {body}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
