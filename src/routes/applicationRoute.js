import { Router } from 'express';
import multer from 'multer';
import applicationController from '../controllers/applicationController.js';

const router = Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

const uploadFields = upload.fields([
    { name: 'authorization', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
    { name: 'thesis', maxCount: 1 },
    { name: 'originality', maxCount: 1 }
]);

const parseFormData = (req, res, next) => {
    try {
        if (req.body.checkboxes && typeof req.body.checkboxes === 'string') {
            req.body.checkboxes = JSON.parse(req.body.checkboxes);
        }
        if (req.body.students && typeof req.body.students === 'string') {
            req.body.students = JSON.parse(req.body.students);
        }
        if (req.body.advisors && typeof req.body.advisors === 'string') {
            req.body.advisors = JSON.parse(req.body.advisors);
        }
        if (req.body.jury && typeof req.body.jury === 'string') {
            req.body.jury = JSON.parse(req.body.jury);
        }

        if (req.files) {
            const filesObj = {};
            for (const [key, fileArr] of Object.entries(req.files)) {
                filesObj[key] = fileArr[0];
            }
            req.files = filesObj;
        }

        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al parsear datos del formulario',
            error: error.message
        });
    }
};

router.post(
    '',
    uploadFields,
    parseFormData,
    applicationController.createApplication
);

export default router;
