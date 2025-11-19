/**
 * Password Reset Email Template Tests
 *
 * Tests for password reset email template rendering
 */

import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import * as React from "react";
import { PasswordResetEmail } from "../password-reset";

describe("PasswordResetEmail", () => {
  it("should render email template with username and reset URL", async () => {
    const html = await render(
      PasswordResetEmail({
        username: "testuser",
        resetUrl: "https://example.com/reset?token=abc123",
      }) as React.ReactElement,
    );

    expect(html).toContain("testuser");
    expect(html).toContain("https://example.com/reset?token=abc123");
    expect(html).toContain("Reset Your Password");
    expect(html).toContain("Reset Password");
  });

  it("should include security messaging", async () => {
    const html = await render(
      PasswordResetEmail({
        username: "testuser",
        resetUrl: "https://example.com/reset?token=abc123",
      }) as React.ReactElement,
    );

    expect(html).toContain("expire in 1 hour");
    // HTML entities are used in rendered output (apostrophe becomes &#x27;)
    expect(html).toMatch(/didn.*request/);
    expect(html).toContain("safely ignore");
  });
});

