// @ts-check

import { describe, expect, it } from "@jest/globals";
import {
  isThemeAvailable,
  isLocaleAvailable,
  availableLocales,
} from "../src/translations.js";
import { isValidHexColor } from "../src/common/color.js";
import { clampValue, parseArray } from "../src/common/ops.js";

describe("validation.test.js - Input validation tests", () => {
  describe("Theme validation", () => {
    it("should return true for valid theme", () => {
      expect(isThemeAvailable("dark")).toBe(true);
      expect(isThemeAvailable("default")).toBe(true);
      expect(isThemeAvailable("radical")).toBe(true);
    });

    it("should return false for invalid theme", () => {
      expect(isThemeAvailable("nonexistent")).toBe(false);
      expect(isThemeAvailable("")).toBe(false);
    });
  });

  describe("Locale validation", () => {
    it("should return true for valid locale", () => {
      expect(isLocaleAvailable("en")).toBe(true);
      expect(isLocaleAvailable("cn")).toBe(true);
      expect(isLocaleAvailable("es")).toBe(true);
    });

    it("should return false for invalid locale", () => {
      expect(isLocaleAvailable("invalid")).toBe(false);
      expect(isLocaleAvailable("")).toBe(false);
    });

    it("should have available locales", () => {
      expect(availableLocales.length).toBeGreaterThan(0);
      expect(availableLocales).toContain("en");
    });
  });

  describe("Color validation", () => {
    it("should accept valid hex color", () => {
      expect(isValidHexColor("ffffff")).toBe(true);
      expect(isValidHexColor("000")).toBe(true);
      expect(isValidHexColor("2f80ed")).toBe(true);
    });

    it("should accept 3-char hex color", () => {
      expect(isValidHexColor("fff")).toBe(true);
    });

    it("should reject invalid hex color", () => {
      expect(isValidHexColor("gggggg")).toBe(false);
      expect(isValidHexColor("")).toBe(false);
    });
  });

  describe("Number validation", () => {
    it("should clamp values to min/max range", () => {
      expect(clampValue(5, 0, 10)).toBe(5);
      expect(clampValue(-5, 0, 10)).toBe(0);
      expect(clampValue(15, 0, 10)).toBe(10);
    });
  });

  describe("Array parsing", () => {
    it("should parse comma-separated values", () => {
      expect(parseArray("a,b,c")).toEqual(["a", "b", "c"]);
      expect(parseArray("a")).toEqual(["a"]);
      expect(parseArray("")).toEqual([]);
    });

    it("should return empty array for null/undefined input", () => {
      expect(parseArray(null)).toEqual([]);
      expect(parseArray(undefined)).toEqual([]);
    });
  });
});
