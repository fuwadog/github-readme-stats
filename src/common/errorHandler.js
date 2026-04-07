import { renderError } from "./render.js";

const errorHandler = (err, req, res) => {
  console.error("Error:", err.message);

  const isProduction =
    process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test";
  const message = isProduction ? "An error occurred" : err.message;
  const secondaryMessage = isProduction
    ? "Please try again later"
    : err.message || "Unknown error";

  res.setHeader("Content-Type", "image/svg+xml");
  return res.status(err.statusCode || 500).send(
    renderError({
      message,
      secondaryMessage,
      renderOptions: {},
    }),
  );
};

export { errorHandler };
export default errorHandler;
