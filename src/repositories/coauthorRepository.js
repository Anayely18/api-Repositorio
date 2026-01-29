import pool from "../config/database.js";

class CoauthorRepository {
  async create(
    id,
    idSolicitud,
    tipoUbicacion,
    tipoRol,
    nombres,
    apellidos,
    orcidUrl,
    createdAt,
    updatedAt
  ) {
    const query = `
      INSERT INTO t_coautores (
        id_coautor,
        id_solicitud,
        tipo_ubicacion,
        tipo_rol,
        nombres,
        apellidos,
        orcid_url,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      id,
      idSolicitud,
      tipoUbicacion,
      tipoRol,
      nombres,
      apellidos,
      orcidUrl,
      createdAt,
      updatedAt,
    ]);

    // ✅ como tu PK es UUID, devuelve el mismo id
    return { id, affectedRows: result.affectedRows };
  }
}

export default new CoauthorRepository();
