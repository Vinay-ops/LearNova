import { Children, isValidElement, type ReactNode } from "react";

/**
 * Pure helpers behind the AI Markdown renderer, kept separate from the
 * component so the component file only exports components.
 */

/** Recursively flatten a React child tree back to its raw text. */
export function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToText(node.props.children);
  }
  return "";
}

/**
 * Protocols an AI-authored link may use. Deliberately tiny: `http(s)` for
 * normal links and `mailto:` for contact addresses. Everything else — most
 * importantly `javascript:`, `data:` and `vbscript:` — is dropped.
 */
const SAFE_PROTOCOL = /^(https?|mailto):$/i;

/**
 * Characters browsers discard when resolving a URL (NUL through space, plus
 * DEL). Matching them is the whole point of this regex, so the lint rule that
 * discourages control characters is disabled deliberately.
 */
// eslint-disable-next-line no-control-regex
const URL_IGNORED_CHARS = /[\u0000-\u0020\u007f]+/g;

/**
 * Decide whether a URL from AI-generated Markdown is safe to render.
 *
 * `react-markdown` already ships a default transform, but relying on a
 * library's default for a security decision is fragile: a version bump or a
 * custom component could silently reintroduce `javascript:` links. This is an
 * explicit, allowlist-based policy that we control and test.
 *
 * The control-character strip matters: browsers ignore embedded tabs/newlines
 * when parsing a URL, so `java\tscript:alert(1)` executes in some browsers even
 * though a naive `startsWith("javascript:")` check would not match it.
 *
 * @returns the URL when safe, otherwise `""` (the caller renders no link).
 */
export function safeUrlTransform(url: string | null | undefined): string {
  const value = (url ?? "").trim();
  if (!value) return "";

  const normalized = value.replace(URL_IGNORED_CHARS, "");

  const colon = normalized.indexOf(":");
  const slash = normalized.indexOf("/");
  const question = normalized.indexOf("?");
  const hash = normalized.indexOf("#");

  // No scheme at all, or the colon belongs to the path/query/fragment rather
  // than a scheme (e.g. "/docs/a:b", "a?b:c") — a relative URL is safe.
  if (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (question !== -1 && colon > question) ||
    (hash !== -1 && colon > hash)
  ) {
    return value;
  }

  return SAFE_PROTOCOL.test(normalized.slice(0, colon + 1)) ? value : "";
}

/** Pull the ```lang fence label out of a fenced code block's child element. */
export function fenceLanguage(children: ReactNode): string | undefined {
  const child = Children.toArray(children)[0];
  if (!isValidElement<{ className?: string }>(child)) return undefined;
  return /language-([\w+#-]+)/.exec(child.props.className ?? "")?.[1];
}
