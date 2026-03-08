import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolCallLabel, ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// getToolCallLabel — pure function tests

test("getToolCallLabel: str_replace_editor create", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Button.jsx" })).toBe("Editing Button.jsx");
});

test("getToolCallLabel: str_replace_editor insert", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolCallLabel: str_replace_editor view", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Viewing App.jsx");
});

test("getToolCallLabel: str_replace_editor undo_edit", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Undoing edit in App.jsx");
});

test("getToolCallLabel: file_manager rename", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/OldName.jsx" })).toBe("Renaming OldName.jsx");
});

test("getToolCallLabel: file_manager delete", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/unused.jsx" })).toBe("Deleting unused.jsx");
});

test("getToolCallLabel: unknown tool falls back to toolName", () => {
  expect(getToolCallLabel("some_unknown_tool", { command: "foo", path: "/file.jsx" })).toBe("some_unknown_tool");
});

test("getToolCallLabel: nested path extracts filename", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/src/components/Card.tsx" })).toBe("Creating Card.tsx");
});

test("getToolCallLabel: empty args falls back to toolName", () => {
  expect(getToolCallLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

// ToolCallBadge — rendered component tests

test("ToolCallBadge renders label text", () => {
  const invocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "ok",
  };
  render(<ToolCallBadge toolInvocation={invocation} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolCallBadge state=call shows spinner, no green dot", () => {
  const invocation: ToolInvocation = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  };
  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge state=result with result shows green dot, no spinner", () => {
  const invocation: ToolInvocation = {
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "ok",
  };
  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge state=result without result shows spinner", () => {
  const invocation = {
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result" as const,
    result: null,
  } as unknown as ToolInvocation;
  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
