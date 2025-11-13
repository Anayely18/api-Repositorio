import express from 'express';
import multer from 'multer';
import {
  crearTramiteEstudiante,
  crearTramiteDocente,
  subirArchivosTramite,
  registrarAsesores,
  registrarJurados,
  registrarCoautores
} from '../controllers/tramiteController.js';

const router = express.Router();

// Configuración de subida de archivos PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'src/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === ESTUDIANTE ===
router.post('/estudiante', crearTramiteEstudiante);
router.post('/:id/asesores', registrarAsesores);
router.post('/:id/jurados', registrarJurados);

// === DOCENTE ===
router.post('/docente', crearTramiteDocente);
router.post('/:id/coautores', registrarCoautores);

// === ARCHIVOS (ambos flujos usan el mismo) ===
router.post('/:id/archivos', upload.any(), subirArchivosTramite);


router.get('/ping', (req, res) => {
  res.send('✅ Router de tramites activo');
});

export default router;
