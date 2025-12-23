export const mapApiStatusToDb = (apiStatus) => {
  const s = String(apiStatus ?? '').trim().toLowerCase();

  const map = {
    pendiente: 'pendiente',
    aprobado: 'aprobado',
    observado: 'observado',

    // legacy (por si aún llegan)
    validado: 'aprobado',
    rechazado: 'observado',
  };

  return map[s] || 'pendiente';
};

export const mapDbStatusToApi = (dbStatus) => {
  const s = String(dbStatus ?? '').trim().toLowerCase();

  const map = {
    pendiente: 'pendiente',
    aprobado: 'aprobado',
    observado: 'observado',

    // legacy
    validado: 'aprobado',
    rechazado: 'observado',
  };

  return map[s] || 'pendiente';
};
