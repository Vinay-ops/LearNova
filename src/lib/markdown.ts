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

/** Pull the ```lang fence label out of a fenced code block's child element. */
export function fenceLanguage(children: ReactNode): string | undefined {
  const child = Children.toArray(children)[0];
  if (!isValidElement<{ className?: string }>(child)) return undefined;
  return /language-([\w+#-]+)/.exec(child.props.className ?? "")?.[1];
}
