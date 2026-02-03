
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import applicationRoutes from "./routes/applicationRoute.js";
import profileRoutes from "./routes/profileRoutes.js";

import lookupRoutes from "./routes/lookupRoutes.js";
import personasRoutes from "./routes/personasRoutes.js"; // ✅ si usarás /api/personas
import { loadExcelLookups } from "./services/excelLookup.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "dist")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ 1) CARGA EXCEL PRIMERO
loadExcelLookups();

// ✅ 2) MONTA RUTAS AQUÍ
app.use("/api/applications", applicationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.use("/api/lookup", lookupRoutes);
app.use("/api/personas", personasRoutes); // ✅ para /api/personas/dni/:dni

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});
/*app.get(/^\/(?!api).*//*, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});*/



// ✅ 3) 404 AL FINAL SIEMPRE
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => console.log(`🚀 Servidor activo en http://${HOST}:${PORT}`));

