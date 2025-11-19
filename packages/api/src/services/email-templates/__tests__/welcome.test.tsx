/**
 * Welcome Email Template Tests
 *
 * Tests for welcome email template rendering
 */

import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import * as React from "react";
import { WelcomeEmail } from "../welcome";

describe("WelcomeEmail", () => {
  it("should render email template with username and app URL", async () => {
    const html = await render(
      WelcomeEmail({
        username: "newuser",
        appUrl: "https://example.com/app",
      }) as React.ReactElement,
    );

    expect(html).toContain("newuser");
    expect(html).toContain("https://example.com/app");
    expect(html).toContain("Welcome to Tuvix");
    expect(html).toContain("Go to Dashboard");
  });

  it("should include getting started information", async () => {
    const html = await render(
      WelcomeEmail({
        username: "newuser",
        appUrl: "https://example.com/app",
      }) as React.ReactElement,
    );

    // Check for key phrases (HTML encoding may vary)
    expect(html).toContain("thrilled you chose us");
    expect(html).toContain("To get started");
    expect(html).toContain("manage your RSS feeds");
  });
});

