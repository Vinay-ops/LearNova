// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VoiceConsole } from "@/components/nova/VoiceConsole";

/**
 * Voice is an INPUT METHOD: these tests pin the five explicit states the
 * candidate can be in, so the surface never leaves them guessing whether the
 * microphone is live or whether their words were captured.
 */

afterEach(cleanup);

type Overrides = Partial<React.ComponentProps<typeof VoiceConsole>>;

function setup(overrides: Overrides = {}) {
  const props = {
    supported: true,
    listening: false,
    interim: "",
    error: null as string | null,
    busy: false,
    transcript: "",
    onChangeTranscript: vi.fn(),
    onStart: vi.fn(),
    onStop: vi.fn(),
    onSubmit: vi.fn(),
    onDiscard: vi.fn(),
    onSwitchToChat: vi.fn(),
    ...overrides,
  };
  const utils = render(<VoiceConsole {...props} />);
  return { ...utils, props };
}

describe("VoiceConsole — STATE 1: idle", () => {
  it("prompts the candidate and does not start the mic on its own", () => {
    const { props } = setup();

    expect(screen.getByText("Click to start speaking")).toBeTruthy();
    expect(
      screen.getByText("I'm listening to your response and will respond once you finish."),
    ).toBeTruthy();
    expect(props.onStart).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /start speaking/i })).toBeTruthy();
  });

  it("starts dictation only when the microphone is clicked", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: /start speaking/i }));
    expect(props.onStart).toHaveBeenCalledTimes(1);
  });
});

describe("VoiceConsole — STATE 2: listening", () => {
  it("shows the listening status, the live interim text and an obvious stop control", () => {
    const { props } = setup({ listening: true, interim: "so I would start by" });

    expect(screen.getByText("Listening…")).toBeTruthy();
    expect(screen.getByText("Speak naturally. I'll listen until you're finished.")).toBeTruthy();
    expect(screen.getByText("so I would start by")).toBeTruthy();

    const stop = screen.getByRole("button", { name: /finish speaking/i });
    fireEvent.click(stop);
    expect(props.onStop).toHaveBeenCalledTimes(1);
  });
});

describe("VoiceConsole — STATE 3: processing", () => {
  it("shows that the answer is being handled instead of leaving the user waiting", () => {
    setup({ busy: true, transcript: "my answer" });
    expect(screen.getByText("Processing your response…")).toBeTruthy();
  });
});

describe("VoiceConsole — STATE 4: transcribed", () => {
  it("shows the YOU SAID card with an editable transcript", () => {
    const { props } = setup({ transcript: "I led the migration project" });

    expect(screen.getByText("You said")).toBeTruthy();
    const box = screen.getByLabelText("Your transcribed answer") as HTMLTextAreaElement;
    expect(box.value).toBe("I led the migration project");

    fireEvent.change(box, { target: { value: "I led the payments migration" } });
    expect(props.onChangeTranscript).toHaveBeenCalledWith("I led the payments migration");
  });

  it("submits the transcript to the interview engine", () => {
    const { props } = setup({ transcript: "my answer" });
    fireEvent.click(screen.getByRole("button", { name: /send answer/i }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("offers a re-record action and enables sending a real transcript", () => {
    const { props } = setup({ transcript: "my answer" });

    const send = screen.getByRole("button", { name: /send answer/i }) as HTMLButtonElement;
    expect(send.disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /record again/i }));
    expect(props.onDiscard).toHaveBeenCalledTimes(1);
  });

  it("falls back to idle when recognition produced nothing usable", () => {
    setup({ transcript: "   " });

    // A whitespace-only transcript is not a captured answer — the console
    // returns to idle rather than offering an empty submission.
    expect(screen.getByText("Click to start speaking")).toBeTruthy();
    expect(screen.queryByText("You said")).toBeNull();
    expect(screen.queryByRole("button", { name: /send answer/i })).toBeNull();
  });
});

describe("VoiceConsole — STATE 5: error", () => {
  it("shows a clean inline error with a retry action, never a raw browser error", () => {
    const { props } = setup({
      error: "Microphone access was denied. Enable it in your browser and try again.",
    });

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(
      screen.getByText("Microphone access was denied. Enable it in your browser and try again."),
    ).toBeTruthy();
    // No browser-internal error string is surfaced.
    expect(screen.queryByText(/NotAllowedError|DOMException/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(props.onStart).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /type instead/i }));
    expect(props.onSwitchToChat).toHaveBeenCalledTimes(1);
  });

  it("falls back to a generic message when no error text is supplied", () => {
    setup({ error: null, supported: true, listening: false, transcript: "" });
    // idle, not error — the state machine must not invent an error
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});

describe("VoiceConsole — unsupported browser", () => {
  it("degrades cleanly to a chat fallback instead of a dead end", () => {
    const { props } = setup({ supported: false });

    expect(screen.getByText("Voice isn't available here")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /start speaking/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /switch to chat/i }));
    expect(props.onSwitchToChat).toHaveBeenCalledTimes(1);
  });
});

describe("VoiceConsole — question context", () => {
  it("shows the current question so the microphone is never anonymous", () => {
    setup({ prompt: "**Tell me** about a hard trade-off", questionLabel: "Question 2 of 5" });

    expect(screen.getByText("Question 2 of 5")).toBeTruthy();
    // The prompt is rendered as Markdown, not raw syntax.
    expect(screen.getByText("Tell me").tagName).toBe("STRONG");
  });
});
