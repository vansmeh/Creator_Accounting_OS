import "dotenv/config";
import express from "express";
import cors from "cors";
import dealRoutes      from "./routes/dealRoutes.js";
import incomeRoutes    from "./routes/incomeRoutes.js";
import invoiceRoutes   from "./routes/invoiceRoutes.js";
import dashboardRouter from "./routes/dashboard.js";
import aiRouter        from "./routes/ai.js";
import { connectDb }   from "./lib/db.js";

const app  = express();
const port = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// All routes under /api
app.use("/api/deals",     dealRoutes);
app.use("/api/income",    incomeRoutes);
app.use("/api/invoices",  invoiceRoutes);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai",        aiRouter);

// 404 catch
app.use((_req, res) => res.status(404).json({ message: "Not found" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Server error" });
});

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
