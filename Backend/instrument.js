if (process.env.NODE_ENV === "production") {
  const Sentry = require("@sentry/node");

  console.log("Initializing Sentry for error tracking...");

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: true
  });
}
