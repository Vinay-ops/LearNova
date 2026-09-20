import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft, Scale } from "lucide-react";

/**
 * Shared shell for the public legal pages (/terms, /privacy).
 *
 * Renders structured placeholder content with an explicit, unmissable notice
 * that the text has not been reviewed by counsel. It must not read as
 * lawyer-approved policy: presenting invented wording as reviewed legal text
 * would be worse than having none.
 */

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  title: string;
  /** ISO date the current revision took effect. */
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDocument({
  title,
  effectiveDate,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to Learnova
        </Link>

        <header className="mt-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective date:{" "}
            <time dateTime={effectiveDate} className="font-semibold text-foreground">
              {effectiveDate}
            </time>
          </p>
        </header>

        {/* Unreviewed-template notice. Deliberately prominent. */}
        <aside
          role="note"
          className="mt-8 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4"
        >
          <Scale className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div className="text-sm leading-relaxed text-amber-900">
            <p className="font-bold">Draft — pending legal review</p>
            <p className="mt-1.5">
              This document is a structured template describing how the product
              actually behaves. It has <strong>not</strong> been reviewed by
              qualified legal counsel and is not legal advice. Every clause
              marked <em>[REVIEW REQUIRED]</em> must be finalised by a lawyer
              before this is relied upon. Until then it is not binding policy.
            </p>
          </div>
        </aside>

        <p className="mt-8 text-base leading-relaxed text-muted-foreground">{intro}</p>

        <div className="mt-10 space-y-9">
          {sections.map((section, index) => (
            <section key={section.heading} id={`section-${index + 1}`}>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {index + 1}. {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-14 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            Questions about this document?{" "}
            <span className="font-semibold text-foreground">
              [REVIEW REQUIRED: insert legal contact address]
            </span>
          </p>
          <p className="mt-2">
            See also{" "}
            <Link to="/terms" className="font-medium text-primary underline underline-offset-2">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-medium text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
