// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockGet = vi.fn();
const mockDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockGet, delete: mockDelete })),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// Must import after mocks are set up
const { getSession, deleteSession, verifySession } = await import("@/lib/auth");

import type { NextRequest } from "next/server";

function makeRequest(token?: string): NextRequest {
  return {
    cookies: { get: vi.fn().mockReturnValue(token ? { value: token } : undefined) },
  } as unknown as NextRequest;
}

describe("verifySession", () => {
  test("returns null when no cookie is present", async () => {
    expect(await verifySession(makeRequest())).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const payload = { userId: "user-456", email: "verify@example.com" };
    const token = await makeToken(payload);
    const session = await verifySession(makeRequest(token));

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-456");
    expect(session?.email).toBe("verify@example.com");
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken({ userId: "user-456", email: "verify@example.com" }, "-1s");
    expect(await verifySession(makeRequest(token))).toBeNull();
  });

  test("returns null for a tampered token", async () => {
    const token = await makeToken({ userId: "user-456", email: "verify@example.com" });
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(await verifySession(makeRequest(tampered))).toBeNull();
  });

  test("returns null for a malformed token string", async () => {
    expect(await verifySession(makeRequest("not.a.jwt"))).toBeNull();
  });
});

describe("deleteSession", () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  test("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledWith("auth-token");
  });
});

describe("getSession", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  test("returns null when no cookie is present", async () => {
    mockGet.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    const token = await makeToken(payload);
    mockGet.mockReturnValue({ value: token });

    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-123");
    expect(session?.email).toBe("test@example.com");
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken(
      { userId: "user-123", email: "test@example.com" },
      "-1s"
    );
    mockGet.mockReturnValue({ value: token });

    expect(await getSession()).toBeNull();
  });

  test("returns null for a tampered token", async () => {
    const token = await makeToken({ userId: "user-123", email: "test@example.com" });
    const tampered = token.slice(0, -5) + "XXXXX";
    mockGet.mockReturnValue({ value: tampered });

    expect(await getSession()).toBeNull();
  });

  test("returns null for a malformed token string", async () => {
    mockGet.mockReturnValue({ value: "not.a.jwt" });
    expect(await getSession()).toBeNull();
  });
});
