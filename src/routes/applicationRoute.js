import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import applicationController from '../controllers/applicationController.js';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        const folder = req.originalUrl.includes('/teachers')
            ? 'ReportTesisDocente'
            : 'ReportTesisStudent';

        const uploadPath = path.join('uploads', folder);
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF'), false);
    }
});


const uploadFieldsStudent = upload.fields([
    { name: 'authorization', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
    { name: 'thesis', maxCount: 1 },
    { name: 'originality', maxCount: 1 }
]);

const uploadFieldsTeacher = upload.fields([
    { name: 'authorization', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'similarity', maxCount: 1 },
    { name: 'report', maxCount: 1 }
]);

const parseFormData = (req, res, next) => {
    try {
        const jsonFields = [
            "checkboxes",
            "students",
            "teachers",
            "advisors",
            "coauthors",
            "jury"
        ];

        for (const field of jsonFields) {
            if (req.body[field] && typeof req.body[field] === "string") {
                req.body[field] = JSON.parse(req.body[field]);
            }
        }

        if (req.files) {
            const simplified = {};
            for (const [key, fileArr] of Object.entries(req.files)) {
                simplified[key] = fileArr[0];
            }
            req.files = simplified;
        }

        next();

    } catch (error) {
        console.error("Error parseFormData:", error);
        return res.status(400).json({
            success: false,
            message: "Error al parsear datos del formulario",
            error: error.message
        });
    }
};

const uploads = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF'), false);
    }
});

// Nuevo upload para imágenes
const uploadImages = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'), false);
        }
    }
});

router.post(
    '/students',
    uploadFieldsStudent,
    parseFormData,
    (req, res) => applicationController.createApplication(req, res)
);

router.post(
    '/teachers',
    uploadFieldsTeacher,
    parseFormData,
    (req, res) => applicationController.createTeacherApplication(req, res)
);

router.get(
    '/list', applicationController.getApplications
);

router.get(
    '/details/:id',
    (req, res) => applicationController.getTeacherApplicationDetails(req, res)
);

router.get('/search', applicationController.getApplicationByDni);

router.patch('/documents/:documentId/review', uploadImages.array('images', 10), applicationController.updateDocumentReview);

// Actualizar estado de la solicitud completa
router.patch('/:id/review', applicationController.updateApplicationReview);
// Actualizar múltiples documentos a la vez
router.patch('/:applicationId/documents/bulk-update', applicationController.bulkUpdateDocuments);

// Consulta por DNI (ya existe)
router.get('/search', applicationController.getApplicationByDni);

router.post('/:id/publication-link', applicationController.savePublicationLink);

router.get(
    '/:id/history-with-paths',
    applicationController.getHistoryWithPaths
);


export default router;