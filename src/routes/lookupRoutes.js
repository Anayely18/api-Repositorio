import express from "express";
import { findStudentByCode, findTeacherByDni } from "../services/excelLookup.js";

const router = express.Router();

// GET /api/lookup/students/201064
router.get("/students/:codigo", (req, res) => {
  const data = findStudentByCode(req.params.codigo);
  if (!data) return res.status(404).json({ success: false, message: "Código no encontrado" });
  return res.json({ success: true, data });
});

// GET /api/lookup/teachers/dni/46111994
router.get("/teachers/dni/:dni", (req, res) => {
  const data = findTeacherByDni(req.params.dni);
  if (!data) return res.status(404).json({ success: false, message: "DNI no encontrado" });
  return res.json({ success: true, data });
});

export default router;
