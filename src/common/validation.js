const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/;

const colorRegex = /^([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;

const parseIntWithValidation = (value, min, max, defaultValue) => {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, parsed));
};

const validateUsername = (username) => {
  if (!username || typeof username !== "string") {
    return false;
  }
  return usernameRegex.test(username);
};

const validateColor = (color) => {
  if (!color || typeof color !== "string") {
    return false;
  }
  if (color.startsWith("#")) {
    color = color.substring(1);
  }
  return colorRegex.test(color);
};

const validateLocale = (locale) => {
  if (!locale || typeof locale !== "string") {
    return false;
  }
  const validLocales = [
    "az",
    "bn",
    "cn",
    "co",
    "cs",
    "da",
    "de",
    "en",
    "es",
    "fa",
    "fr",
    "hi",
    "hu",
    "id",
    "it",
    "ja",
    "kr",
    "mk",
    "nl",
    "np",
    "pl",
    "pt",
    "ro",
    "rs",
    "ru",
    "sk",
    "sv",
    "th",
    "tr",
    "ua",
    "uz",
    "vi",
    "zh",
  ];
  return validLocales.includes(locale.toLowerCase());
};

const validateYear = (year) => {
  if (year === undefined || year === null || year === "") {
    return true;
  }
  const parsed = parseInt(year, 10);
  if (isNaN(parsed)) {
    return false;
  }
  const currentYear = new Date().getFullYear();
  return parsed >= 2010 && parsed <= currentYear;
};

const validateTheme = (theme) => {
  if (!theme || typeof theme !== "string") {
    return false;
  }
  const validThemes = [
    "default",
    "transparent",
    "dark",
    "radical",
    "merko",
    "gruvbox",
    "tokyonight",
    "onedark",
    "cobalt",
    "synthwave",
    "dracula",
    "monokai",
    "peach",
    "none",
  ];
  return validThemes.includes(theme.toLowerCase());
};

export {
  parseIntWithValidation,
  validateUsername,
  validateColor,
  validateLocale,
  validateYear,
  validateTheme,
};
export default {
  parseIntWithValidation,
  validateUsername,
  validateColor,
  validateLocale,
  validateYear,
  validateTheme,
};
