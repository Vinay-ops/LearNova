import { useState, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { fenceLanguage, nodeToText, safeUrlTransform } from "@/lib/markdown";

/**
 * Markdown renderer for AI-generated text (tutor answers, interviewer turns,
 * evaluations). AI models answer in Markdown — rendering it as plain text left
 * raw `**bold**`, `| tables |` and fenced code visible to the learner.
 *
 * Safety: `react-markdown` parses to a React element tree and does NOT render
 * embedded HTML, so there is no `dangerouslySetInnerHTML` and no XSS surface.
 * URLs are additionally filtered by `safeUrlTransform`, which drops
 * `javascript:`/`data:`/`vbscript:` schemes an AI could be tricked into
 * emitting. GitHub-flavoured Markdown (tables, task lists, strikethrough) comes
 * from `remark-gfm`.
 */

/** A fenced code block with a language label and a copy button. */
function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = fenceLanguage(children);
  const raw = nodeToText(children).replace(/\n$/, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context) — no-op */
    }
  }

  return (
    <div className="group/code my-3 min-w-0">
      <div className="flex items-center justify-between gap-2 rounded-t-xl border border-b-0 border-slate-800 bg-slate-900 px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Code copied" : "Copy code"}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          {copied ? (
            <>
              <Check className="size-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-b-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 [&>code]:bg-transparent [&>code]:p-0 [&>code]:font-mono [&>code]:text-xs [&>code]:text-slate-100">
        {children}
      </pre>
    </div>
  );
}

const components: Components = {
  // Real heading elements (h1–h6) so the document outline stays valid; the
  // type scale is deliberately compact because these live inside a chat bubble.
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-base font-bold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-[15px] font-bold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3.5 text-sm font-bold text-foreground first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1.5 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-muted-foreground line-through">{children}</del>,
  a: ({ children, href }) => {
    // A rejected URL renders as plain text rather than a dead/unsafe link.
    if (!href) return <span className="font-medium">{children}</span>;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-primary [&_ol]:my-1 [&_ul]:my-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:font-semibold marker:text-primary [&_ol]:my-1 [&_ul]:my-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-r-xl border-l-2 border-primary/40 bg-muted/60 px-3.5 py-2 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  // Only http(s) images survive `safeUrlTransform`; anything rejected renders
  // as its alt text. An empty `src` is withheld too — browsers treat it as a
  // request for the current document.
  img: ({ src, alt }) => {
    if (!src) return alt ? <span className="text-muted-foreground">{alt}</span> : null;
    return (
      <img src={src} alt={alt ?? ""} className="my-2 max-w-full rounded-xl" loading="lazy" />
    );
  },
  // Enables a block code block to be a real block with copy affordance.
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ children, className }) => (
    <code
      className={cn(
        "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
        className,
      )}
    >
      {children}
    </code>
  ),
  // Tables render as real tables inside a horizontally scrollable container so
  // wide comparison tables (e.g. Big-O complexities) never overflow the bubble.
  table: ({ children }) => (
    <div className="my-3 min-w-0 max-w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-t border-border transition-colors even:bg-muted/30">{children}</tr>
  ),
  th: ({ children, style }) => (
    <th
      style={style}
      className="whitespace-nowrap px-3 py-2 font-semibold text-foreground"
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td style={style} className="px-3 py-2 align-top text-muted-foreground">
      {children}
    </td>
  ),
};

interface MarkdownMessageProps {
  /** Raw Markdown produced by the model. */
  content: string;
  className?: string;
}

/**
 * Renders one AI message body. `overflow-wrap:anywhere` keeps a long unbroken
 * token (URL, hash) from breaking the bubble layout on narrow screens, while
 * tables and code blocks scroll horizontally inside their own containers.
 */
export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={safeUrlTransform}
      >
        {content}
      </Markdown>
    </div>
  );
}
