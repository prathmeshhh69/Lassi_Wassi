import express from "express";
import cors from "cors";
import morgan from "morgan";
import env from "./config/env.js";
import router from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "production") {
  app.use(morgan("dev"));
}

app.use(router);

app.use(notFound);
app.use(errorHandler);

export default app;

