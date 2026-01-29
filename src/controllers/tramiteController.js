import db from '../db/connection.js';

// =============== ESTUDIANTE ===============
export const crearTramiteEstudiante = async (req, res) => {
  try {
    const p = req.body;

    const [r] = await db.query(`
      INSERT INTO TramiteConstancia (tipo_tramite, solicitante_dni, solicitante_nombre, estado)
      VALUES ('informe_estudiante', ?, ?, 'pendiente')
    `, [p.dni, `${p.nombres} ${p.apellidos}`]);

    const tramiteId = r.insertId;

    await db.query(`
      INSERT INTO InformeEstudiante (
        tramite_id, escuela_profesional, correo, telefono,
        titulo_trabajo, nombre_proyecto, observaciones
      ) VALUES (?,?,?,?,?,?,?)
    `, [tramiteId, p.escuela_profesional, p.correo, p.telefono, p.titulo_trabajo, p.nombre_proyecto, p.observaciones]);

    res.json({ id: tramiteId, estado: 'pendiente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar trámite de estudiante' });
  }
};

// =============== DOCENTE ===============
export const crearTramiteDocente = async (req, res) => {
  try {
    const p = req.body;

    const [r] = await db.query(`
      INSERT INTO TramiteConstancia (tipo_tramite, solicitante_dni, solicitante_nombre, estado)
      VALUES ('informe_docente', ?, ?, 'pendiente')
    `, [p.dni, `${p.nombres} ${p.apellidos}`]);

    const tramiteId = r.insertId;

    await db.query(`
      INSERT INTO InformeDocente (
        tramite_id, escuela_profesional, correo, telefono,
        titulo_trabajo, titulo_informe, observaciones
      ) VALUES (?,?,?,?,?,?,?)
    `, [tramiteId, p.escuela_profesional, p.correo, p.telefono, p.titulo_trabajo, p.titulo_informe, p.observaciones]);

    res.json({ id: tramiteId, estado: 'pendiente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar trámite de docente' });
  }
};

// =============== ARCHIVOS ===============
export const subirArchivosTramite = async (req, res) => {
  try {
    const tramiteId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) return res.status(400).json({ error: 'No se enviaron archivos' });

    for (const f of files) {
      const campo = f.fieldname;
      const ruta = f.path;

      // Buscar si pertenece a informe_docente o estudiante
      await db.query(`
        UPDATE InformeEstudiante SET ${campo}=? WHERE tramite_id=?;
      `, [ruta, tramiteId]);
      await db.query(`
        UPDATE InformeDocente SET ${campo}=? WHERE tramite_id=?;
      `, [ruta, tramiteId]);
    }

    res.json({ ok: true, message: 'Archivos subidos correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir archivos' });
  }
};

// =============== ASESORES ===============
export const registrarAsesores = async (req, res) => {
  try {
    const { asesores } = req.body;
    const tramiteId = req.params.id;

    for (const a of asesores) {
      await db.query(`
        INSERT INTO Asesor (tramite_id, tipo, nombre, dni, orcid)
        VALUES (?,?,?,?,?)
      `, [tramiteId, a.tipo, a.nombre, a.dni, a.orcid]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar asesores' });
  }
};

// =============== JURADOS ===============
export const registrarJurados = async (req, res) => {
  try {
    const { jurados } = req.body;
    const tramiteId = req.params.id;

    for (const j of jurados) {
      await db.query(`
        INSERT INTO Jurado (tramite_id, rol, nombre)
        VALUES (?,?,?)
      `, [tramiteId, j.rol, j.nombre]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar jurados' });
  }
};

// =============== COAUTORES ===============
export const registrarCoautores = async (req, res) => {
  try {
    const { coautores } = req.body;
    const tramiteId = req.params.id;

    for (const c of coautores) {
      await db.query(`
        INSERT INTO Coautor (tramite_id, nombre, dni, orcid)
        VALUES (?,?,?,?)
      `, [tramiteId, c.nombre, c.dni, c.orcid]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar coautores' });
  }
};
