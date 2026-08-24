import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Github, Mail } from "lucide-react";
import { env } from "@/config/env";
import { SITE } from "@/constants/app";
import { Modal } from "@/components/common/Modal";
import { BrandMark } from "@/components/navbar/BrandMark";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/sell", label: "Sell" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/profile", label: "Profile" },
];

export function Footer() {
  const [contributeOpen, setContributeOpen] = useState(false);

  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="page-shell pb-24 pt-12 sm:py-14 md:pb-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2">
              <BrandMark className="h-8 w-8" />
              <span className="font-display text-[17px] font-extrabold tracking-tight text-ink">
                {SITE.name}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
              {SITE.description}
            </p>
          </div>

          <nav aria-label="Quick links" className="lg:col-span-3">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">
              Quick links
            </h2>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm font-medium text-ink-muted transition-colors hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">
              Developer: TANISHQ DAGA
            </h2>

            <div className="mt-4 rounded-2xl border border-line bg-surface-muted p-4">
              <p className="text-sm font-semibold text-ink">
                Want to contribute and get your name into the developers section?
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                Help improve {SITE.name} and we'll credit you here.
              </p>

              {env.contributeUrl ? (
                <a
                  href={env.contributeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Contribute to {SITE.name}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setContributeOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Contribute to {SITE.name}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            <h2 className="mt-6 text-[13px] font-bold uppercase tracking-wider text-ink-soft">
              Contact
            </h2>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm text-ink-muted">
                <Mail className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
                {env.contactEmail ? (
                  <a
                    href={`mailto:${env.contactEmail}`}
                    className="transition-colors hover:text-brand-600"
                  >
                    {env.contactEmail}
                  </a>
                ) : (
                  // No real address was provided — say so rather than invent one.
                  <span className="text-ink-soft">Set VITE_CONTACT_EMAIL to show a contact</span>
                )}
              </li>
             
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1.5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-soft">
            © {SITE.year} {SITE.name}
          </p>
          <p className="text-[13px] text-ink-soft">Built for the VIT student community.</p>
        </div>
      </div>

      <Modal
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
        title="Contribute to VITBookMart"
        description="This build doesn't have a contribution link configured yet."
      >
        <div className="space-y-3 pb-6 text-sm leading-relaxed text-ink-muted">
          <p>
            Set <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[13px] text-ink">VITE_CONTRIBUTE_URL</code>{" "}
            in your <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[13px] text-ink">.env</code> file to point this
            call to action at your repository or contribution guide.
          </p>
        
        </div>
      </Modal>
    </footer>
  );
}
