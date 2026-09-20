// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MarkdownMessage } from "@/components/nova/MarkdownMessage";
import { fenceLanguage, nodeToText, safeUrlTransform } from "@/lib/markdown";

/**
 * The AI answers in Markdown. Before this renderer existed the chat printed raw
 * syntax (`**bold**`, `| tables |`, ``` fences```) straight into the bubble.
 * These tests pin the contract: real elements, no visible Markdown markers, and
 * nothing that can escape the bubble.
 */

afterEach(cleanup);

const renderMd = (content: string) => render(<MarkdownMessage content={content} />);

describe("MarkdownMessage — headings", () => {
  it("renders headings as real heading elements, not literal hashes", () => {
    renderMd("# Roadmap\n\n## Phase one\n\n### Step one");

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Roadmap");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Phase one");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Step one");
    expect(screen.queryByText("## Phase one")).toBeNull();
  });

  it("renders bold and italic without the asterisks", () => {
    const { container } = renderMd("This is **important** and *subtle*.");

    expect(container.querySelector("strong")?.textContent).toBe("important");
    expect(container.querySelector("em")?.textContent).toBe("subtle");
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("*subtle*");
  });
});

describe("MarkdownMessage — lists", () => {
  it("renders ordered and unordered lists as real list elements", () => {
    const { container } = renderMd("1. Start with the basics\n2. Learn arrays\n\n- tip\n- trick");

    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    expect(within(ol as HTMLElement).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Start with the basics",
      "Learn arrays",
    ]);

    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(within(ul as HTMLElement).getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nested lists as nested list elements", () => {
    const { container } = renderMd("- Outer\n  - Inner\n  - Inner two");

    const outer = container.querySelector("ul");
    const inner = outer?.querySelector("ul");
    expect(inner).not.toBeNull();
    expect(within(inner as HTMLElement).getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("MarkdownMessage — tables", () => {
  const TABLE = [
    "| Structure | Search | Insert |",
    "| --- | ---: | ---: |",
    "| Array | O(n) | O(n) |",
    "| Linked List | O(n) | O(1) |",
    "| Hash Table | O(1) | O(1) |",
  ].join("\n");

  it("renders a GFM table as a real table with headers and rows", () => {
    const { container } = renderMd(TABLE);

    const table = container.querySelector("table");
    expect(table).not.toBeNull();

    const headers = container.querySelectorAll("th");
    expect(Array.from(headers).map((h) => h.textContent)).toEqual([
      "Structure",
      "Search",
      "Insert",
    ]);

    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows).toHaveLength(3);
    expect(within(bodyRows[2] as HTMLElement).getAllByRole("cell").map((c) => c.textContent)).toEqual(
      ["Hash Table", "O(1)", "O(1)"],
    );
  });

  it("wraps the table in a horizontally scrollable container", () => {
    const { container } = renderMd(TABLE);
    const scroller = container.querySelector("table")?.parentElement;
    expect(scroller?.className).toContain("overflow-x-auto");
  });

  it("never leaks raw pipe syntax into the bubble text", () => {
    const { container } = renderMd(TABLE);
    expect(container.textContent).not.toContain("|");
    expect(container.textContent).not.toContain("---");
  });
});

describe("MarkdownMessage — code", () => {
  it("renders a fenced block as pre/code with a language label and copy button", () => {
    const { container } = renderMd("```python\nprint('hi')\n```");

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.querySelector("code")?.textContent).toContain("print('hi')");
    // Horizontal scrolling so long lines cannot overflow the chat bubble.
    expect(pre?.className).toContain("overflow-x-auto");
    expect(screen.getByText("python")).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy code/i })).toBeTruthy();
    expect(container.textContent).not.toContain("```");
  });

  it("renders inline code as code without a pre block", () => {
    const { container } = renderMd("Use `python-docx` to read DOCX files.");

    expect(container.querySelector("pre")).toBeNull();
    const code = container.querySelector("code");
    expect(code?.textContent).toBe("python-docx");
  });

  it("preserves whitespace inside fenced blocks", () => {
    const { container } = renderMd("```\nline one\n  indented\n```");
    expect(container.querySelector("code")?.textContent).toContain("line one\n  indented");
  });
});

describe("MarkdownMessage — other block elements", () => {
  it("renders blockquotes, links, rules and strikethrough", () => {
    const { container } = renderMd(
      "> A quoted insight\n\n[Learnova](https://example.com)\n\n---\n\n~~old~~",
    );

    expect(container.querySelector("blockquote")?.textContent).toContain("A quoted insight");

    const link = screen.getByRole("link", { name: "Learnova" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toContain("noopener");

    expect(container.querySelector("hr")).not.toBeNull();
    expect(container.querySelector("del")?.textContent).toBe("old");
  });
});

describe("MarkdownMessage — safety and layout", () => {
  it("does not render embedded HTML as markup", () => {
    const { container } = renderMd("<script>alert('xss')</script>\n\n<b>bold?</b>");

    // No injected elements — react-markdown builds a React tree, and the
    // component never uses dangerouslySetInnerHTML.
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("<script>alert('xss')</script>");
  });

  it("keeps an unbroken long token from escaping the bubble", () => {
    const { container } = renderMd("https://example.com/averyveryverylongunbrokenpath".repeat(4));
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("[overflow-wrap:anywhere]");
    expect(root.className).toContain("min-w-0");
  });

  it("renders nothing (no crash) for empty content", () => {
    const { container } = renderMd("");
    expect(container.textContent).toBe("");
  });
});

describe("MarkdownMessage — malicious AI output (XSS)", () => {
  it.each([
    ["<script>alert(1)</script>"],
    ["<img src=x onerror=alert(1)>"],
    ["<svg onload=alert(1)>"] ,
    ['<iframe src="javascript:alert(1)"></iframe>'],
    ["<body onload=alert(1)>"],
    ["<a href=\"javascript:alert(1)\">click</a>"],
  ])("renders %s as inert text, not markup", (payload) => {
    const { container } = renderMd(payload);

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    // No event-handler attribute can exist because no raw HTML is ever parsed
    // into the DOM — every payload above is escaped into text content.
    const withHandlers = Array.from(container.querySelectorAll("*")).filter((el) =>
      Array.from(el.attributes).some((attr) => attr.name.toLowerCase().startsWith("on")),
    );
    expect(withHandlers).toEqual([]);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  ])("drops the dangerous URL scheme in %s", (url) => {
    expect(safeUrlTransform(url)).toBe("");
  });

  it("renders a javascript: link as plain text with no href", () => {
    const { container } = renderMd("[click me](javascript:alert(1))");

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("click me");
    expect(container.innerHTML).not.toContain("javascript:");
  });

  it("renders a data: image as text with no src attribute", () => {
    const { container } = renderMd("![pixel](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg)");

    // Either the image is dropped entirely, or it is rendered without a src.
    const img = container.querySelector("img");
    expect(img?.getAttribute("src") ?? "").not.toContain("data:");
    expect(container.querySelector("img[src^='data:']")).toBeNull();
  });

  it("keeps a normal https link working", () => {
    const { container } = renderMd("[docs](https://example.com/guide)");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com/guide",
    );
  });

  it("keeps a relative link working", () => {
    const { container } = renderMd("[practice](/practice)");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/practice");
  });
});

describe("MarkdownMessage — exported helpers", () => {
  it("flattens a React child tree back to text", () => {
    expect(nodeToText(["a", ["b", "c"]])).toBe("abc");
    expect(nodeToText(null)).toBe("");
    expect(nodeToText(42)).toBe("42");
  });

  it("reads the fence language and returns undefined for plain blocks", () => {
    const fenced = <code className="language-typescript">x</code>;
    const plain = <code>x</code>;
    expect(fenceLanguage(fenced)).toBe("typescript");
    expect(fenceLanguage(plain)).toBeUndefined();
  });
});
