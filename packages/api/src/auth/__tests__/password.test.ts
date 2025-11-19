/**
 * Password Security Tests
 *
 * Tests for minimal password utilities (hashPassword, verifyPassword)
 * Better Auth handles password validation and complexity requirements
 */

import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("Password Hashing", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "TestPass123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are 60 chars
    });

    it("should create different hashes for same password", async () => {
      const password = "TestPass123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts = different hashes
    });

    it("should use custom salt rounds", async () => {
      const password = "TestPass123!";
      const hash10 = await hashPassword(password, 10);
      const hash12 = await hashPassword(password, 12);

      expect(hash10).toBeDefined();
      expect(hash12).toBeDefined();
      expect(hash10).not.toBe(hash12);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "TestPass123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPass123!";
      const wrongPassword = "WrongPass123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it("should handle empty password", async () => {
      const hash = await hashPassword("TestPass123!");

      const isValid = await verifyPassword("", hash);
      expect(isValid).toBe(false);
    });

    it("should handle invalid hash", async () => {
      const isValid = await verifyPassword("TestPass123!", "invalid-hash");
      expect(isValid).toBe(false);
    });
  });
});
