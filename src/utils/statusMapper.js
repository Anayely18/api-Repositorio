export const mapDbStatusToApi = (dbStatus) => {
  const s = String(dbStatus ?? '').toLowerCase();

  const map = {
    pendiente: 'pendiente',
    en_revision: 'en_revision',
    aprobado: 'aprobado',
    observado: 'observado',
    requiere_correccion: 'requiere_correccion',
    publicado: 'publicado',

    // compatibilidad
    rechazado: 'observado',
    validado: 'aprobado'
  };

  return map[s] || s;
};
