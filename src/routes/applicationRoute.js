import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import applicationController from '../controllers/applicationController.js';

const router = Router();

/* ==========================
   CONFIGURACIÓN DE MULTER
   ========================== */

// Storage en disco, con carpeta según tipo de solicitud
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'otros';

        // Si la ruta contiene /teacher => carpeta de docentes
        if (req.originalUrl.includes('/teacher')) {
            folder = 'ReportTesisDocente';
        } else {
            // Estudiante (formulario de tesis)
            folder = 'ReportTesisStudent';
        }

        const uploadPath = path.join('uploads', folder);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

// Campos para solicitud de estudiante
const uploadFieldsStudent = upload.fields([
    { name: 'authorization', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
    { name: 'thesis', maxCount: 1 },
    { name: 'originality', maxCount: 1 }
]);

// Campos para solicitud de docente
const uploadFieldsTeacher = upload.fields([
    { name: 'authorization', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'similarity', maxCount: 1 },
    { name: 'report', maxCount: 1 }
]);

/* ==========================
   PARSEAR FORM-DATA
   ========================== */

const parseFormData = (req, res, next) => {
    try {
        if (req.body.checkboxes && typeof req.body.checkboxes === 'string') {
            req.body.checkboxes = JSON.parse(req.body.checkboxes);
        }
        if (req.body.students && typeof req.body.students === 'string') {
            req.body.students = JSON.parse(req.body.students);
        }
        if (req.body.teachers && typeof req.body.teachers === 'string') {
            req.body.teachers = JSON.parse(req.body.teachers);
        }
        if (req.body.advisors && typeof req.body.advisors === 'string') {
            req.body.advisors = JSON.parse(req.body.advisors);
        }
        if (req.body.coauthors && typeof req.body.coauthors === 'string') {
            req.body.coauthors = JSON.parse(req.body.coauthors);
        }
        if (req.body.jury && typeof req.body.jury === 'string') {
            req.body.jury = JSON.parse(req.body.jury);
        }

        // Simplificar estructura de req.files:
        // de { authorization: [file], thesis: [file] } a { authorization: file, thesis: file }
        if (req.files) {
            const filesObj = {};
            for (const [key, fileArr] of Object.entries(req.files)) {
                filesObj[key] = fileArr[0];
            }
            req.files = filesObj;
        }

        next();
    } catch (error) {
        console.error('Error parseFormData:', error);
        return res.status(400).json({
            success: false,
            message: 'Error al parsear datos del formulario',
            error: error.message
        });
    }
};

/* ==========================
   RUTAS
   ========================== */

// ====== ESTUDIANTES (TESIS) ======
router.post(
    '/',
    uploadFieldsStudent,
    parseFormData,
    (req, res) => applicationController.createApplication(req, res)
);

// ====== DOCENTES (INFORME) ======
router.post(
    '/teacher',
    uploadFieldsTeacher,
    parseFormData,
    (req, res) => applicationController.createTeacherApplication(req, res)
);

// Obtener detalles completos de una solicitud de docente
router.get(
    '/teacher/:applicationId',
    (req, res) => applicationController.getTeacherApplicationDetails(req, res)
);

// Obtener todos los documentos con detalles
router.get(
    '/',
    (req, res) => applicationController.getDocumentsWithApplicationDetails(req, res)
);

export default router;
