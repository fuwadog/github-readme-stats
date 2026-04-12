// @ts-check

import { z } from "zod";
import { renderError } from "./render.js";

// Validation schemas (keep types as strings to work with existing parsing logic)
const usernameSchema = z
  .string()
  .min(1, "Username is required")
  .max(39, "Username must be less than 39 characters")
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
    "Invalid username format",
  );

const colorSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^[#]?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/i.test(val),
    "Invalid color format. Use 3 or 6-digit hex code.",
  );

const coerceToString = (val) => {
  if (val === undefined || val === null) {
    return val;
  }
  if (val === true || val === "true" || val === "1") {
    return "true";
  }
  if (val === false || val === "false" || val === "0") {
    return "false";
  }
  if (typeof val === "number") {
    return val.toString();
  }
  if (Array.isArray(val)) {
    return val.join(",");
  }
  return val;
};

const booleanSchema = z
  .string()
  .or(z.boolean())
  .transform((val) => coerceToString(val))
  .pipe(
    z
      .string()
      .refine(
        (val) => !val || ["true", "false", "1", "0", ""].includes(val),
        "Invalid boolean value",
      ),
  )
  .optional();

const numberSchema = z
  .string()
  .or(z.number())
  .transform((val) => coerceToString(val))
  .pipe(
    z
      .string()
      .refine((val) => !val || /^\d+$/.test(val), "Invalid number format"),
  )
  .optional();

const arraySchema = z
  .string()
  .or(z.array(z.string()))
  .transform((val) => coerceToString(val))
  .optional();

const localeSchema = z.string().optional();

const themeSchema = z.string().optional();

// Stats card validation schema
const statsCardSchema = z.object({
  username: usernameSchema,
  hide: arraySchema,
  hide_title: booleanSchema,
  hide_border: booleanSchema,
  card_width: numberSchema,
  hide_rank: booleanSchema,
  show_icons: booleanSchema,
  include_all_commits: booleanSchema,
  commits_year: numberSchema,
  line_height: numberSchema,
  title_color: colorSchema,
  ring_color: colorSchema,
  icon_color: colorSchema,
  text_color: colorSchema,
  text_bold: booleanSchema,
  bg_color: colorSchema,
  theme: themeSchema,
  cache_seconds: numberSchema,
  exclude_repo: arraySchema,
  custom_title: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/[<>]/g, "") : undefined)), // Sanitize to prevent XSS
  locale: localeSchema,
  disable_animations: booleanSchema,
  border_radius: numberSchema,
  border_color: colorSchema,
  number_format: z.enum(["short", "long"]).optional(),
  number_precision: numberSchema,
  rank_icon: z.string().optional(),
  show: arraySchema,
});

/**
 * Validate stats card request.
 *
 * @param {import('express').Request & { validatedQuery?: any }} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
const validateStatsCardRequest = (req, res, next) => {
  try {
    const validated = statsCardSchema.parse(req.query);
    req.validatedQuery = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return res.send(
        renderError({
          message: "Invalid request parameters",
          secondaryMessage: `${firstError.path.join(".")}: ${firstError.message}`,
          renderOptions: {
            title_color: String(req.query.title_color || ""),
            text_color: String(req.query.text_color || ""),
            bg_color: String(req.query.bg_color || ""),
            border_color: String(req.query.border_color || ""),
            theme: String(req.query.theme || ""),
          },
        }),
      );
    }
    return res.status(400).json({ error: "Validation failed" });
  }
  return undefined;
};

export { validateStatsCardRequest, statsCardSchema };
export default validateStatsCardRequest;
