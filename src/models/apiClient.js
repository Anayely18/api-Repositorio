import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

// 1) crear trámite estudiante (SIN archivos)
export const crearTramiteEstudiante = (payload) =>
  API.post('/tramites/estudiante', payload); // ← debe devolver { id, numero_tramite, ... }

// 2) subir archivos (FormData)
export const subirArchivosTramite = (tramiteId, formData, onUploadProgress) =>
  API.post(`/tramites/${tramiteId}/archivos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });

// 3) registrar asesores (array)
export const registrarAsesores = (tramiteId, asesores) =>
  API.post(`/tramites/${tramiteId}/asesores`, { asesores });

// 4) registrar jurados (array)
export const registrarJurados = (tramiteId, jurados) =>
  API.post(`/tramites/${tramiteId}/jurados`, { jurados });
