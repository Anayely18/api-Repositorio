import pool from "../config/database.js";
import Application from "../models/Application.js";
import { v4 as uuidv4 } from "uuid";
class ApplicationRepository {

    async create(
        id,
        applicationType,
        name,
        surname,
        email,
        dni,
        contactNumber,
        professionalSchool,
        acceptTerms,
        ajustedFormat,
        errorsRead,
        informedProcedure,
        declaresTruth,
        financingType,
        projectName,
        observations,
        linkToPublishedTesis,
        status,
        applicationDate,
        createdAt,
        updatedAt
    ) {
        const query = `
            INSERT INTO t_solicitudes (
                id_solicitud,
                tipo_solicitud,
                nombres,
                apellidos,
                email,
                dni,
                numero_contacto,
                escuela_profesional,
                acepta_terminos,
                formato_ajustado,
                errores_leidos,
                tramite_informado,
                declara_verdad,
                tipo_financiamiento,
                nombre_proyecto,
                observaciones,
                link_tesis_publicada,
                estado,
                fecha_solicitud,
                created_at,
                updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const [result] = await pool.execute(query, [
            id,
            applicationType,
            name,
            surname,
            email,
            dni,
            contactNumber,
            professionalSchool,
            acceptTerms,
            ajustedFormat,
            errorsRead,
            informedProcedure,
            declaresTruth,
            financingType,
            projectName,
            observations,
            linkToPublishedTesis,
            status,
            applicationDate,
            createdAt,
            updatedAt
        ]);

        return result.insertId;
    }

    async getApplications(options = {}) {
        const {
            page = 1,
            limit = 10,
            status = null,
            search = null,
            professionalSchool = null,
            condition = null
        } = options;

        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const offset = (pageInt - 1) * limitInt;

        if (isNaN(pageInt) || isNaN(limitInt) || pageInt < 1 || limitInt < 1) {
            throw new Error('Invalid pagination parameters');
        }

        const conditions = [`s.tipo_solicitud = '${condition}'`];
        const params = [];

        if (status) {
            conditions.push('s.estado = ?');
            params.push(status);
        }

        if (search) {
            conditions.push(`(
            s.nombres LIKE ? OR 
            s.apellidos LIKE ? OR 
            s.dni LIKE ? OR
            s.nombre_proyecto LIKE ?
        )`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (professionalSchool) {
            conditions.push('s.escuela_profesional = ?');
            params.push(professionalSchool);
        }

        const whereClause = conditions.join(' AND ');

        const countQuery = `
        SELECT COUNT(DISTINCT s.id_solicitud) as total
        FROM t_solicitudes s
        WHERE ${whereClause}
    `;

        const query = `
        SELECT 
            s.id_solicitud,
            s.fecha_solicitud AS fecha_subida,
            s.nombres,
            s.apellidos,
            s.dni,
            s.email,
            s.escuela_profesional,
            s.observaciones,
            s.tipo_solicitud,
            s.estado,
            s.nombre_proyecto,
            s.created_at,
            s.updated_at,
            COALESCE(
                GROUP_CONCAT(
                    DISTINCT CONCAT(a.nombres, ' ', a.apellidos) 
                    ORDER BY a.orden_autor
                    SEPARATOR ' | '
                ),
                CONCAT(s.nombres, ' ', s.apellidos)
            ) AS autores_busqueda
        FROM t_solicitudes s
        LEFT JOIN t_autores a ON a.id_solicitud = s.id_solicitud
        WHERE ${whereClause}
        GROUP BY 
            s.id_solicitud,
            s.fecha_solicitud,
            s.nombres,
            s.apellidos,
            s.dni,
            s.email,
            s.escuela_profesional,
            s.observaciones,
            s.tipo_solicitud,
            s.estado,
            s.nombre_proyecto,
            s.created_at,
            s.updated_at
        ORDER BY s.fecha_solicitud DESC
        LIMIT ${limitInt} OFFSET ${offset}
    `;

        try {
            const [countResult] = await pool.execute(countQuery, params);
            const [rows] = await pool.execute(query, params);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitInt);

            const applications = rows.map(row => new Application(row));

            return {
                data: applications.map(app => app.toListJSON()),
                pagination: {
                    currentPage: pageInt,
                    totalPages: totalPages,
                    totalRecords: total,
                    recordsPerPage: limitInt,
                    hasNextPage: pageInt < totalPages,
                    hasPreviousPage: pageInt > 1
                }
            };
        } catch (error) {
            console.error('Error en getStudents:', error);
            throw error;
        }
    }

    async getDocumentsWithApplicationDetails(id) {
        const query = `
            SELECT 
                s.id_solicitud,
                s.tipo_solicitud,
                s.nombres AS solicitante_nombres,
                s.apellidos AS solicitante_apellidos,
                s.email AS solicitante_email,
                s.dni AS solicitante_dni,
                s.numero_contacto,
                s.escuela_profesional,
                s.acepta_terminos,
                s.formato_ajustado,
                s.errores_leidos,
                s.tramite_informado,
                s.declara_verdad,
                s.nombre_proyecto,
                s.observaciones,
                s.link_tesis_publicada,
                s.estado,
                s.tipo_financiamiento,
                s.fecha_solicitud,
                s.created_at AS solicitud_created_at,
                s.updated_at AS solicitud_updated_at,
                
                IFNULL(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'author_id', a.id_autor,
                            'author_order', a.orden_autor,
                            'collaborator_type', a.tipo_colaborador,
                            'location_type', a.tipo_ubicacion,
                            'role_type', a.tipo_rol,
                            'role', a.rol,
                            'first_name', a.nombres,
                            'last_name', a.apellidos,
                            'dni', a.dni,
                            'orcid_url', a.url_orcid,
                            'professional_school', a.escuela_profesional
                        )
                    )
                    FROM t_autores a
                    WHERE a.id_solicitud = s.id_solicitud),
                    '[]'
                ) AS autores,
                
                IFNULL(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'advisor_id', ase.id_asesor,
                            'advisor_order', ase.orden_asesor,
                            'full_name', ase.apellidos_nombres,
                            'dni', ase.dni,
                            'orcid', ase.orcid
                        )
                    )
                    FROM t_asesores ase
                    WHERE ase.id_solicitud = s.id_solicitud),
                    '[]'
                ) AS asesores,
                
                IFNULL(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'jury_id', j.id_jurado,
                            'jury_role', j.rol_jurado,
                            'full_name', j.apellidos_nombres,
                            'dni', j.dni,
                            'email', j.email,
                            'orcid', j.orcid
                        )
                    )
                    FROM t_jurados j
                    WHERE j.id_solicitud = s.id_solicitud),
                    '[]'
                ) AS jurados,
                
                IFNULL(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'document_id', d.id_documento,
                            'document_type', d.tipo_documento,
                            'file_name', d.nombre_archivo,
                            'file_path', d.ruta_archivo,
                            'size_kb', d.tamano_kb,
                            'upload_date', d.fecha_subida,
                            'status', d.estado,
                            'rejection_reason', d.razon_rechazo
                        )
                    )
                    FROM t_documentos d
                    WHERE d.id_solicitud = s.id_solicitud),
                    '[]'
                ) AS documentos,
                
                IFNULL(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'history_id', h.id_historial,
                            'previous_status', h.estado_anterior,
                            'new_status', h.estado_nuevo,
                            'comment', h.comentario,
                            'change_date', h.fecha_cambio,
                            'admin_name', adm.nombre_usuario
                        )
                    )
                    FROM t_historial_solicitudes h
                    LEFT JOIN t_administradores adm ON h.id_admin = adm.id_admin
                    WHERE h.id_solicitud = s.id_solicitud
                    ORDER BY h.fecha_cambio DESC),
                    '[]'
                ) AS historial
                
            FROM t_solicitudes s
            WHERE s.id_solicitud = ?
        `;

        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        const result = rows[0];

        const safeJSONParse = (value) => {
            if (!value || value === '' || value === 'null') {
                return [];
            }
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('Error parsing JSON:', value, error);
                return [];
            }
        };
        result.autores = safeJSONParse(result.autores);
        result.asesores = safeJSONParse(result.asesores);
        result.jurados = safeJSONParse(result.jurados);
        result.documentos = safeJSONParse(result.documentos);
        result.historial = safeJSONParse(result.historial);

        return {
            application_id: result.id_solicitud,
            application_type: result.tipo_solicitud,
            applicant_first_name: result.solicitante_nombres,
            applicant_last_name: result.solicitante_apellidos,
            applicant_email: result.solicitante_email,
            applicant_dni: result.solicitante_dni,
            contact_number: result.numero_contacto,
            professional_school: result.escuela_profesional,
            accepts_terms: result.acepta_terminos,
            adjusted_format: result.formato_ajustado,
            errors_read: result.errores_leidos,
            procedure_informed: result.tramite_informado,
            declares_truth: result.declara_verdad,
            project_name: result.nombre_proyecto,
            observations: result.observaciones,
            published_thesis_link: result.link_tesis_publicada,
            status: result.estado,
            funding_type: result.tipo_financiamiento,
            application_date: result.fecha_solicitud,
            created_at: result.solicitud_created_at,
            updated_at: result.solicitud_updated_at,
            authors: result.autores,
            advisors: result.asesores,
            jury: result.jurados,
            documents: result.documentos,
            history: result.historial
        };
    }

    async getApplicationByDni(dni, applicationType) {
        console.log('🔍 Repository - Buscando DNI:', dni, 'Tipo:', applicationType);

        const query = `
        SELECT 
            s.id_solicitud,
            s.tipo_solicitud,
            s.nombres AS solicitante_nombres,
            s.apellidos AS solicitante_apellidos,
            s.email AS solicitante_email,
            s.dni AS solicitante_dni,
            s.numero_contacto,
            s.escuela_profesional,
            s.nombre_proyecto,
            s.observaciones,
            s.estado,
            s.fecha_solicitud,
            s.created_at AS solicitud_created_at,
            s.updated_at AS solicitud_updated_at,
            
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'document_id', d.id_documento,
                        'document_type', d.tipo_documento,
                        'file_name', d.nombre_archivo,
                        'file_path', d.ruta_archivo,
                        'status', d.estado,
                        'rejection_reason', d.razon_rechazo,
                        'upload_date', d.fecha_subida
                    )
                )
                FROM t_documentos d
                WHERE d.id_solicitud = s.id_solicitud),
                '[]'
            ) AS documentos,
            
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'history_id', h.id_historial,
                        'previous_status', h.estado_anterior,
                        'new_status', h.estado_nuevo,
                        'comment', h.comentario,
                        'change_date', h.fecha_cambio,
                        'admin_name', adm.nombre_usuario
                    )
                )
                FROM t_historial_solicitudes h
                LEFT JOIN t_administradores adm ON h.id_admin = adm.id_admin
                WHERE h.id_solicitud = s.id_solicitud
                ORDER BY h.fecha_cambio DESC),
                '[]'
            ) AS historial
            
        FROM t_solicitudes s
        WHERE s.dni = ? AND s.tipo_solicitud = ?
        ORDER BY s.fecha_solicitud DESC
        LIMIT 1
    `;

        console.log('📝 Ejecutando query con params:', [dni, applicationType]);

        try {
            const [rows] = await pool.execute(query, [dni, applicationType]);

            console.log('📊 Número de resultados:', rows.length);

            if (rows.length > 0) {
                console.log('✅ Registro encontrado:', {
                    id: rows[0].id_solicitud,
                    dni: rows[0].solicitante_dni,
                    tipo: rows[0].tipo_solicitud,
                    nombre: rows[0].solicitante_nombres
                });
            } else {
                console.log('❌ No se encontraron resultados');

                // Query de verificación para ver qué hay en la BD
                const checkQuery = `
                SELECT dni, tipo_solicitud, nombres, apellidos 
                FROM t_solicitudes 
                WHERE dni LIKE ? OR tipo_solicitud = ?
                LIMIT 5
            `;
                const [checkRows] = await pool.execute(checkQuery, [`%${dni}%`, applicationType]);
                console.log('🔍 Registros similares en BD:', checkRows);
            }

            if (rows.length === 0) {
                return null;
            }

            const result = rows[0];

            const safeJSONParse = (value) => {
                if (!value || value === '' || value === 'null') {
                    return [];
                }
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    console.error('Error parsing JSON:', value, error);
                    return [];
                }
            };

            result.documentos = safeJSONParse(result.documentos);
            result.historial = safeJSONParse(result.historial);

            const formattedResult = {
                application_id: result.id_solicitud,
                application_type: result.tipo_solicitud,
                applicant: {
                    name: result.solicitante_nombres,
                    surname: result.solicitante_apellidos,
                    email: result.solicitante_email,
                    dni: result.solicitante_dni,
                    phone: result.numero_contacto,
                    professional_school: result.escuela_profesional
                },
                project_name: result.nombre_proyecto,
                observations: result.observaciones,
                status: result.estado,
                created_at: result.fecha_solicitud,
                documents: result.documentos.map(doc => ({
                    name: doc.document_type,
                    status: doc.status,
                    observation: doc.rejection_reason,
                    images: []
                })),
                timeline: result.historial.map(h => ({
                    date: h.change_date,
                    status: h.new_status,
                    description: h.comment || 'Cambio de estado'
                }))
            };

            console.log('✅ Datos formateados correctamente');
            return formattedResult;

        } catch (error) {
            console.error('❌ Error en query:', error);
            throw error;
        }
    }

    // En applicationRepository.js

    async updateDocumentStatus(documentId, status, rejectionReason = null, images = []) {
        const query = `
        UPDATE t_documentos 
        SET 
            estado = ?,
            razon_rechazo = ?,
            updated_at = NOW()
        WHERE id_documento = ?
    `;

        await pool.execute(query, [status, rejectionReason, documentId]);

        // Si hay imágenes, guardarlas en una tabla relacionada
        if (images && images.length > 0) {
            await this.saveDocumentImages(documentId, images);
        }

        return { success: true };
    }

    async saveDocumentImages(documentId, images) {
        // Crear tabla si no existe
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS t_documentos_imagenes (
            id_imagen INT AUTO_INCREMENT PRIMARY KEY,
            id_documento VARCHAR(36) NOT NULL,
            ruta_imagen VARCHAR(500) NOT NULL,
            nombre_archivo VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_documento) REFERENCES t_documentos(id_documento) ON DELETE CASCADE
        )
    `;

        await pool.execute(createTableQuery);

        // Insertar imágenes
        const insertQuery = `
        INSERT INTO t_documentos_imagenes (id_documento, ruta_imagen, nombre_archivo)
        VALUES (?, ?, ?)
    `;

        for (const image of images) {
            await pool.execute(insertQuery, [
                documentId,
                image.path,
                image.filename
            ]);
        }
    }

    async getDocumentImages(documentId) {
        const query = `
        SELECT 
            id_imagen,
            ruta_imagen,
            nombre_archivo,
            created_at
        FROM t_documentos_imagenes
        WHERE id_documento = ?
        ORDER BY created_at DESC
    `;

        const [rows] = await pool.execute(query, [documentId]);
        return rows;
    }

    async updateApplicationStatus(applicationId, newStatus, comment = null, adminId = null) {
        // Actualizar estado de la solicitud
        const updateQuery = `
        UPDATE t_solicitudes 
        SET 
            estado = ?,
            observaciones = ?,
            updated_at = NOW()
        WHERE id_solicitud = ?
    `;

        await pool.execute(updateQuery, [newStatus, comment, applicationId]);

        const idHistory = uuidv4();
        const historyQuery = `
    INSERT INTO t_historial_solicitudes 
    (id_historial, id_solicitud, estado_anterior, estado_nuevo, comentario, id_admin, fecha_cambio)
    SELECT 
        ?,        -- id_historial
        ?,        -- id_solicitud
        estado,   -- estado_anterior
        ?,        -- estado_nuevo
        ?,        -- comentario
        ?,        -- id_admin
        NOW()
    FROM t_solicitudes 
    WHERE id_solicitud = ?
    LIMIT 1
`;


        await pool.execute(historyQuery, [
            idHistory,
            applicationId,
            newStatus,
            comment,
            adminId,
            applicationId
        ]);

        return { success: true };
    }

    async bulkUpdateDocuments(applicationId, documentUpdates) {
        // documentUpdates es un array de { documentId, status, observation, images }

        for (const update of documentUpdates) {
            await this.updateDocumentStatus(
                update.documentId,
                update.status,
                update.observation,
                update.images
            );
        }

        return { success: true };
    }
}

export default new ApplicationRepository();
