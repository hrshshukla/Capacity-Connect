import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";
import type { ErrorRequestHandler } from "express";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/api", (_req, res) => {
  return res.status(404).json({ message: "We could not find that request." });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../client/dist/public",
  );
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(clientDist, "index.html"));
  });
}

const handleServerError: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  logger.error(
    { err: error, method: req.method, url: req.originalUrl },
    "Unhandled request error",
  );

  const status =
    typeof error?.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode < 500
      ? error.statusCode
      : typeof error?.status === "number" &&
          error.status >= 400 &&
          error.status < 500
        ? error.status
        : 500;
  const messages: Record<number, string> = {
    400: "Please check the information and try again.",
    401: "Please sign in again to continue.",
    403: "You do not have permission to do that.",
    404: "We could not find that request.",
    409: "That request conflicts with an existing record.",
    422: "Please check the information and try again.",
  };

  return res.status(status).json({
    message:
      messages[status] ??
      "We could not complete that request right now. Please try again.",
  });
};

app.use(handleServerError);

export default app;
