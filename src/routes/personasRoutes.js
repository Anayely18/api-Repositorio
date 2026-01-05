import express from "express";
import { findTeacherByDni } from "../services/excelLookup.js";

const router = express.Router();

router.get("/dni/:dni", (req, res) => {
  const data = findTeacherByDni(req.params.dni);
  if (!data) return res.status(404).json({ success:false, message:"DNI no encontrado" });
  return res.json({ success:true, data }); // {nombres, apellidos}
});

export default router;
