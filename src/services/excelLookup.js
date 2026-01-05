import fs from "fs";
import path from "path";
import xlsx from "xlsx";

let studentsByCode = new Map();   // key: codigo (6 dígitos o más), value: { nombres, apellidos }
let teachersByDni = new Map();    // key: dni (8 dígitos), value: { nombres, apellidos }

const cleanDigits = (v) => String(v ?? "").replace(/\.0$/, "").replace(/\D/g, "");
const cleanCode = (v) => cleanDigits(v).slice(0, 6);  // tu regla: 6 dígitos
const cleanDni  = (v) => cleanDigits(v).slice(0, 8);

export function loadExcelLookups(filePath) {
  const excelPath =
    filePath ||
    process.env.EXCEL_LOOKUP_PATH ||
    path.join(process.cwd(), "data", "Relacion_Estudiantes_doentes.xlsx");

  if (!fs.existsSync(excelPath)) {
    console.warn("⚠️ Excel no encontrado en:", excelPath);
    return;
  }

  const wb = xlsx.readFile(excelPath);

  // ===== ESTUDIANTE =====
  const shStudents = wb.Sheets["ESTUDIANTE"];
  const rowsStudents = xlsx.utils.sheet_to_json(shStudents, { defval: "" });

  studentsByCode = new Map();
  for (const r of rowsStudents) {
    const codigo = cleanCode(r["CODIGO"]);
    if (!codigo) continue;

    const nombres = String(r["NOMBRES"] || "").trim();
    const apellidos = [r["AP PATERNO"], r["AP MATERNO"]]
      .filter(Boolean)
      .map((x) => String(x).trim())
      .join(" ")
      .trim();

    if (nombres || apellidos) studentsByCode.set(codigo, { nombres, apellidos });
  }

  // ===== DOCENTE =====
  const shTeachers = wb.Sheets["DOCENTE"];
  const rowsTeachers = xlsx.utils.sheet_to_json(shTeachers, { defval: "" });

  teachersByDni = new Map();
  for (const r of rowsTeachers) {
    const dni = cleanDni(r["DNI"]);
    if (!dni) continue;

    const nombres = String(r["NOMBRES"] || "").trim();
    const apellidos = [r["AP PATERNO"], r["AP MATERNO"]]
      .filter(Boolean)
      .map((x) => String(x).trim())
      .join(" ")
      .trim();

    if (nombres || apellidos) teachersByDni.set(dni, { nombres, apellidos });
  }

  console.log(
    `✅ Excel cargado: estudiantes=${studentsByCode.size}, docentes=${teachersByDni.size} (${excelPath})`
  );
}

export function findStudentByCode(codigo) {
  return studentsByCode.get(cleanCode(codigo));
}

export function findTeacherByDni(dni) {
  return teachersByDni.get(cleanDni(dni));
}
