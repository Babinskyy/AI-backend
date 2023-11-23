import express from "express";
import { config } from "dotenv";
import appRouter from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config();

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// app.use((_req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:5174");
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });

app.use("/api/v1", appRouter);

export default app;
