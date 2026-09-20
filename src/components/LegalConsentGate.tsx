import { useState } from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowRight, FileText, LogOut, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { PRIVACY_URL, TERMS_URL, isExternalUrl } from "@/lib/legal";

/**
 * Blocks the authenticated app until the user has accepted the CURRENT
 * revisions of the Terms & Conditions and Privacy Policy.
 *
 * This is the re-acceptance path for a document version bump: existing accounts
 * are never silently grandfathered into new terms. The gate is bypassable on the
 * client — the server independently records consent and reports
 * `requires_acceptance`, so the flag comes from the backend, not local state.
 */

function DocumentLink({ to, children }: { to: string; children: React.ReactNode }) {
  const className =
    "inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-2 hover:text-primary/80";
  if (isExternalUrl(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} target="_blank" className={className}>
      {children}
    </Link>
  );
}

export function LegalConsentGate({ children }: { children: React.ReactNode }) {
  const { legalConsent, acceptTerms, signOut } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No consent data yet (still loading) or nothing outstanding → let them in.
  if (!legalConsent || !legalConsent.requires_acceptance) {
    return <>{children}</>;
  }

  const handleContinue = async () => {
    if (!accepted || saving) return;
    setSaving(true);
    setError(null);
    const res = await acceptTerms();
    setSaving(false);
    if (res?.error) setError(res.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-lg nova-card p-7 sm:p-9">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="size-6" aria-hidden />
        </span>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">
          Terms &amp; Conditions updated
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          You need to review and accept the latest Terms &amp; Conditions and
          Privacy Policy to continue using Learnova.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
            <dt className="font-semibold text-muted-foreground">Terms version</dt>
            <dd className="mt-0.5 font-mono text-foreground">{legalConsent.terms_version}</dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
            <dt className="font-semibold text-muted-foreground">Privacy version</dt>
            <dd className="mt-0.5 font-mono text-foreground">{legalConsent.privacy_version}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-2.5">
          <DocumentLink to={TERMS_URL}>
            <FileText className="size-3.5" />
            View Terms &amp; Conditions
          </DocumentLink>
          <br />
          <DocumentLink to={PRIVACY_URL}>
            <FileText className="size-3.5" />
            View Privacy Policy
          </DocumentLink>
        </div>

        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
          <Checkbox
            id="reaccept-consent"
            checked={accepted}
            onCheckedChange={(checked) => {
              setAccepted(checked === true);
              if (checked === true) setError(null);
            }}
            className="mt-0.5 size-5 shrink-0 rounded-md"
          />
          <label
            htmlFor="reaccept-consent"
            className="cursor-pointer select-none text-sm leading-relaxed text-foreground"
          >
            I agree to the updated Terms &amp; Conditions and Privacy Policy.
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleContinue}
            disabled={!accepted || saving}
            className="gap-2 rounded-xl font-bold"
          >
            {saving ? "Recording…" : "Continue"}
            {!saving ? <ArrowRight className="size-4" /> : null}
          </Button>
          <Button
            variant="ghost"
            onClick={signOut}
            className="gap-2 rounded-xl font-semibold text-muted-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
