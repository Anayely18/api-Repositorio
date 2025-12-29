import pool from "../config/database.js";
import Application from "../models/Application.js";
import { v4 as uuidv4 } from "uuid";
import { mapApiStatusToDb, mapDbStatusToApi } from "../utils/statusMapper.js";


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


        const normalizedStatus = status ? mapApiStatusToDb(status) : null;

        if (normalizedStatus) {
            conditions.push("s.estado = ?");
            params.push(normalizedStatus);
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
                        'rejection_reason', d.razon_rechazo,
                        'images', IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'image_id', di.id_imagen,
                                    'image_path', di.ruta_imagen,
                                    'file_name', di.nombre_archivo,
                                    'created_at', di.created_at
                                )
                            )
                            FROM t_documentos_imagenes di
                            WHERE di.id_documento = d.id_documento),
                            JSON_ARRAY()
                        ),
                        'rejection_history', IFNULL(
                            (
                                SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'history_id', hr.id_historial,
                                    'status', hr.estado,
                                    'rejection_reason', hr.razon_rechazo,
                                    'rejected_at', hr.fecha_registro
                                )
                                )
                                FROM (
                                SELECT id_historial, estado, razon_rechazo, fecha_registro
                                FROM t_historial_rechazos
                                WHERE id_documento = d.id_documento
                                ORDER BY fecha_registro DESC
                                ) hr
                            ),
                            JSON_ARRAY()
                            )
                    )
                )
                FROM t_documentos d
                WHERE d.id_solicitud = s.id_solicitud),
                '[]'
            ) AS documentos,
            
            IFNULL(
                (
                    SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'history_id', hx.id_historial,
                        'previous_status', hx.estado_anterior,
                        'new_status', hx.estado_nuevo,
                        'comment', hx.comentario,
                        'change_date', hx.fecha_cambio,
                        'admin_name', hx.admin_name,
                        'document_id', hx.id_documento,
                        'document_type', hx.document_type
                    )
                    )
                    FROM (
                    SELECT
                        h.id_historial,
                        h.estado_anterior,
                        h.estado_nuevo,
                        h.comentario,
                        h.fecha_cambio,
                        h.id_documento,
                        adm.nombre_usuario AS admin_name,
                        d.tipo_documento AS document_type
                    FROM t_historial_solicitudes h
                    LEFT JOIN t_administradores adm ON h.id_admin = adm.id_admin
                    LEFT JOIN t_documentos d ON h.id_documento = d.id_documento
                    WHERE h.id_solicitud = s.id_solicitud
                    ORDER BY h.fecha_cambio DESC
                    ) hx
                ),
                JSON_ARRAY()
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
            if (value == null) return [];
            if (Array.isArray(value)) return value;
            if (typeof value === "object") return value; // ya viene parseado
            if (value === "" || value === "null") return [];

            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };


        result.autores = safeJSONParse(result.autores);
        result.asesores = safeJSONParse(result.asesores);
        result.jurados = safeJSONParse(result.jurados);
        result.documentos = safeJSONParse(result.documentos).map((document) => ({
            ...document,
            status: mapDbStatusToApi(document.status),
            rejection_history: (document.rejection_history || []).map((rejection) => ({
                ...rejection,
                status: mapDbStatusToApi(rejection.status)
            }))
        }));
        result.historial = safeJSONParse(result.historial).map((entry) => ({
            ...entry,
            previous_status: mapDbStatusToApi(entry.previous_status),
            new_status: mapDbStatusToApi(entry.new_status)
        }));

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
            status: mapDbStatusToApi(result.estado),
            funding_type: result.tipo_financiamiento,
            application_date: result.fecha_solicitud,
            created_at: result.solicitud_created_at,
            updated_at: result.solicitud_updated_at,
            authors: result.autores,
            advisors: result.asesores,
            jury: result.jurados,
            documents: result.documentos,
            history: result.historial,
            file_path: document.file_path,
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
            s.link_tesis_publicada,
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
                        'upload_date', d.fecha_subida,
                        'images', IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'image_id', di.id_imagen,
                                    'image_path', di.ruta_imagen,
                                    'file_name', di.nombre_archivo,
                                    'created_at', di.created_at
                                )
                            )
                            FROM t_documentos_imagenes di
                            WHERE di.id_documento = d.id_documento),
                            JSON_ARRAY()
                        ),
                        'rejection_history', IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'history_id', hr.id_historial,
                                    'status', hr.estado,
                                    'rejection_reason', hr.razon_rechazo,
                                    'rejected_at', hr.fecha_registro
                                )
                            )
                            FROM t_historial_rechazos hr
                            WHERE hr.id_documento = d.id_documento
                            ORDER BY hr.fecha_registro DESC),
                            JSON_ARRAY()
                        )
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
                        'admin_name', adm.nombre_usuario,
                        'document_type', d.tipo_documento
                    )
                )
                FROM t_historial_solicitudes h
                LEFT JOIN t_administradores adm ON h.id_admin = adm.id_admin
                LEFT JOIN t_documentos d ON h.id_documento = d.id_documento
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

            result.documentos = safeJSONParse(result.documentos).map((document) => ({
                ...document,
                status: mapDbStatusToApi(document.status),
                rejection_history: (document.rejection_history || []).map((rejection) => ({
                    ...rejection,
                    status: mapDbStatusToApi(rejection.status)
                }))
            }));
            result.historial = safeJSONParse(result.historial).map((entry) => ({
                ...entry,
                previous_status: mapDbStatusToApi(entry.previous_status),
                new_status: mapDbStatusToApi(entry.new_status)
            }));

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
                status: mapDbStatusToApi(result.estado),
                created_at: result.fecha_solicitud,
                publication_link: result.link_tesis_publicada,
                documents: result.documentos.map(doc => ({
                    name: doc.document_type,
                    status: doc.status,
                    observation: doc.rejection_reason,
                    images: (doc.images || []).map(img => {
                        const imagePath = img.image_path;

                        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                            return imagePath;
                        }

                        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

                        if (imagePath.startsWith('/')) {
                            return `${baseUrl}${imagePath}`;
                        }

                        return `${baseUrl}/${imagePath}`;
                    }),
                    rejection_history: (doc.rejection_history || []).map(rejection => ({
                        reason: rejection.rejection_reason,
                        rejected_at: rejection.rejected_at,
                        status: rejection.status
                    }))
                })),
                timeline: result.historial.map(h => {
                    const historialDate = new Date(h.change_date);
                    const relatedImages = [];

                    // Buscar imágenes subidas cerca de esta fecha (±10 minutos)
                    result.documentos.forEach(doc => {
                        if (doc.images && doc.images.length > 0) {
                            doc.images.forEach(img => {
                                const imgDate = new Date(img.created_at);
                                const diffMinutes = Math.abs(imgDate - historialDate) / (1000 * 60);

                                if (diffMinutes <= 10) {
                                    const imagePath = img.image_path;
                                    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

                                    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                                        relatedImages.push(imagePath);
                                    } else if (imagePath.startsWith('/')) {
                                        relatedImages.push(`${baseUrl}${imagePath}`);
                                    } else {
                                        relatedImages.push(`${baseUrl}/${imagePath}`);
                                    }
                                }
                            });
                        }
                    });

                    return {
                        date: h.change_date,
                        status: h.new_status,
                        document_type: h.document_type,
                        description: h.comment || 'Cambio de estado',
                        images: relatedImages
                    };
                })
            };

            console.log('✅ Datos formateados correctamente');
            console.log('📸 Total de documentos con imágenes:',
                formattedResult.documents.filter(doc => doc.images.length > 0).length
            );
            console.log('📝 Total de documentos con historial de rechazos:',
                formattedResult.documents.filter(doc => doc.rejection_history.length > 0).length
            );

            // Log detallado de las imágenes y rechazos
            formattedResult.documents.forEach((doc, idx) => {
                if (doc.images.length > 0) {
                    console.log(`📷 Documento ${idx + 1} (${doc.name}): ${doc.images.length} imágenes`);
                    doc.images.forEach((img, imgIdx) => {
                        console.log(`   Imagen ${imgIdx + 1}: ${img}`);
                    });
                }
                if (doc.rejection_history.length > 0) {
                    console.log(`📝 Documento ${idx + 1} (${doc.name}): ${doc.rejection_history.length} rechazos`);
                    doc.rejection_history.forEach((rej, rejIdx) => {
                        console.log(`   Rechazo ${rejIdx + 1}: ${rej.reason} (${rej.rejected_at})`);
                    });
                }
            });

            return formattedResult;

        } catch (error) {
            console.error('❌ Error en query:', error);
            throw error;
        }
    }
    // En applicationRepository.js

    async updateDocumentStatus(documentId, status, rejectionReason = null, images = []) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const normalizedStatus = mapApiStatusToDb(status);

            if (!["pendiente", "aprobado", "observado"].includes(normalizedStatus)) {
                throw new Error(`Estado inválido para DB: ${normalizedStatus}`);
            }
            // Obtener información del documento y la solicitud
            const [docInfo] = await connection.execute(
                `SELECT id_solicitud, tipo_documento, estado as estado_anterior 
             FROM t_documentos 
             WHERE id_documento = ?`,
                [documentId]
            );

            if (docInfo.length === 0) {
                throw new Error('Documento no encontrado');
            }

            const { id_solicitud, tipo_documento, estado_anterior } = docInfo[0];

            // Actualizar el documento
            const query = `
            UPDATE t_documentos 
            SET 
                estado = ?,
                razon_rechazo = ?,
                updated_at = NOW()
            WHERE id_documento = ?
        `;
            await connection.execute(query, [normalizedStatus, rejectionReason, documentId]);

            // 🆕 REGISTRAR EN HISTORIAL DE SOLICITUDES CON id_documento
            const idHistorial = uuidv4();
            const comentario = rejectionReason
                ? `${tipo_documento} - ${normalizedStatus}: ${rejectionReason}`
                : `${tipo_documento} - ${normalizedStatus}`;

            await connection.execute(
                `INSERT INTO t_historial_solicitudes 
            (id_historial, id_solicitud, id_documento, estado_anterior, estado_nuevo, comentario, fecha_cambio)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [idHistorial, id_solicitud, documentId, estado_anterior, normalizedStatus, comentario]
            );

            // Registrar en historial de rechazos si aplica
            if (normalizedStatus === 'observado' && rejectionReason) {
                const historialQuery = `
                INSERT INTO t_historial_rechazos (id_documento, estado, razon_rechazo)
                VALUES (?, ?, ?)
            `;
                await connection.execute(historialQuery, [documentId, normalizedStatus, rejectionReason]);
            }

            // Guardar imágenes si hay
            let imageIds = [];
            if (images && images.length > 0) {
                imageIds = await this.saveDocumentImages(documentId, images, connection);
            }

            await connection.commit();
            return { success: true };
        } catch (error) {
            await connection.rollback();
            console.error('Error en updateDocumentStatus:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    // Método adicional para obtener el historial de rechazos de un documento
    async getDocumentRejectionHistory(documentId) {
        const query = `
        SELECT 
            id_historial,
            estado,
            razon_rechazo,
            fecha_registro
        FROM t_historial_rechazos
        WHERE id_documento = ?
        ORDER BY fecha_registro DESC
    `;

        const [rows] = await pool.execute(query, [documentId]);
        return rows;
    }
    async saveDocumentImages(documentId, images, connection) {
        // Crear tabla si no existe - USAR CONNECTION
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

        await connection.execute(createTableQuery); // ✅ Usar connection, no pool

        // Insertar imágenes
        const insertQuery = `
        INSERT INTO t_documentos_imagenes (id_documento, ruta_imagen, nombre_archivo)
        VALUES (?, ?, ?)
    `;

        const imageIds = [];
        for (const image of images) {
            const [result] = await connection.execute(insertQuery, [ // ✅ Usar connection, no pool
                documentId,
                image.path,
                image.filename
            ]);
            imageIds.push(result.insertId);
        }

        return imageIds;
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

        const [rows] = await pool.execute(query, [documentId]); // ✅ Aquí sí usar pool porque no está en transacción
        return rows;
    }

    async updateApplicationStatus(applicationId, newStatus, comment = null, adminId = null) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const normalizedStatus = mapApiStatusToDb(newStatus);

            // leer estado anterior
            const [prev] = await connection.execute(
                "SELECT estado FROM t_solicitudes WHERE id_solicitud = ? LIMIT 1",
                [applicationId]
            );
            if (prev.length === 0) throw new Error("Solicitud no encontrada");

            const previousStatus = prev[0].estado;

            // actualizar solicitud
            await connection.execute(
                `UPDATE t_solicitudes
       SET estado = ?, observaciones = ?, updated_at = NOW()
       WHERE id_solicitud = ?`,
                [normalizedStatus, comment, applicationId]
            );

            // insertar historial (id_documento NULL)
            const idHistory = uuidv4();
            await connection.execute(
                `INSERT INTO t_historial_solicitudes
       (id_historial, id_solicitud, id_documento, estado_anterior, estado_nuevo, comentario, id_admin, fecha_cambio)
       VALUES (?, ?, NULL, ?, ?, ?, ?, NOW())`,
                [idHistory, applicationId, previousStatus, normalizedStatus, comment, adminId]
            );

            await connection.commit();
            return { success: true };
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    }

    async getHistoryWithDocumentPaths(applicationId) {
    const [rows] = await pool.execute(`
        SELECT 
            h.*,
            h.file_path_historico,
            d.document_type,
            d.file_name as current_file_name
        FROM t_historial_solicitudes h
        LEFT JOIN t_documentos d ON h.id_documento = d.document_id
        WHERE h.id_solicitud = ?
        ORDER BY h.fecha_cambio DESC
    `, [applicationId]);
    
    return rows;
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

    async savePublicationLink(applicationId, publicationLink) {
        const connection = await pool.getConnection();
        try {
            new URL(publicationLink); // Validar que sea una URL válida
            await connection.beginTransaction();

            await connection.query(
                `UPDATE t_solicitudes 
                 SET link_tesis_publicada = ?, 
                     estado = 'publicado',
                     updated_at = NOW()
                 WHERE id_solicitud = ?`,
                [publicationLink, applicationId]
            );

            const idHistorial = uuidv4();
            await connection.query(
                `INSERT INTO t_historial_solicitudes 
                 (id_historial, id_solicitud, estado_anterior, estado_nuevo, comentario, fecha_cambio)
                 SELECT ?, ?, estado, 'publicado', ?, NOW()
                 FROM t_solicitudes 
                 WHERE id_solicitud = ?`,
                [idHistorial, applicationId, `Documento publicado: ${publicationLink}`, applicationId]
            );

            await connection.commit();
            return { success: true, publicationLink };
        } catch (error) {
            await connection.rollback();
            console.error('Error en savePublicationLink (repository):', error);
            throw error;
        } finally {
            connection.release();
        }
    }

}



export default new ApplicationRepository();
