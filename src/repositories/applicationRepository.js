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
                    'coauthor_id', c.id_coautor,
                    'location_type', c.tipo_ubicacion,
                    'role_type', c.tipo_rol,
                    'first_name', c.nombres,
                    'last_name', c.apellidos,
                    'orcid_url', c.orcid_url,
                    'created_at', c.created_at
                )
            )
            FROM t_coautores c
            WHERE c.id_solicitud = s.id_solicitud
            ORDER BY c.created_at ASC),
            '[]'
        ) AS coautores,
        
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
                                'created_at', di.created_at,
                                'history_id', di.history_id
                            )
                        )
                        FROM t_documentos_imagenes di
                        WHERE di.id_documento = d.id_documento
                        ORDER BY di.created_at ASC),
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
            WHERE d.id_solicitud = s.id_solicitud
            ORDER BY d.fecha_subida ASC),
            '[]'
        ) AS documentos,
        
        IFNULL(
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'history_id', hx.id_historial,
                    'previous_status', hx.estado_anterior,
                    'new_status', hx.estado_nuevo,
                    'comment', hx.comentario,
                    'change_date', hx.fecha_cambio,
                    'admin_name', hx.admin_name,
                    'document_id', hx.id_documento,
                    'document_type', hx.document_type,
                    'file_path_historic', hx.file_path_historico,
                    'file_name_historic', hx.file_name_historico,
                    'images', hx.images
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
                    h.file_path_historico,
                    h.file_name_historico,
                    adm.nombre_usuario AS admin_name,
                    d.tipo_documento AS document_type,
                    IFNULL(
                        (SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'image_id', img.id_imagen,
                                'image_path', img.ruta_imagen,
                                'file_name', img.nombre_archivo,
                                'created_at', img.created_at
                            )
                        )
                        FROM t_documentos_imagenes img
                        WHERE img.history_id = h.id_historial),
                        JSON_ARRAY()
                    ) AS images
                FROM t_historial_solicitudes h
                LEFT JOIN t_administradores adm ON h.id_admin = adm.id_admin
                LEFT JOIN t_documentos d ON h.id_documento = d.id_documento
                WHERE h.id_solicitud = s.id_solicitud
                ORDER BY h.fecha_cambio DESC
            ) hx),
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
            if (typeof value === "object") return value;
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
        result.coautores = safeJSONParse(result.coautores);

        result.documentos = safeJSONParse(result.documentos).map((document) => ({
            ...document,
            images: safeJSONParse(document.images),
            status: mapDbStatusToApi(document.status),
            rejection_history: safeJSONParse(document.rejection_history).map((rejection) => ({
                ...rejection,
                status: mapDbStatusToApi(rejection.status)
            }))
        }));

        result.historial = safeJSONParse(result.historial).map((entry) => ({
            ...entry,
            previous_status: mapDbStatusToApi(entry.previous_status),
            new_status: mapDbStatusToApi(entry.new_status),
            images: safeJSONParse(entry.images) // ✅ Parsear las imágenes del historial
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
            coauthors: result.coautores,
            documents: result.documentos,
            history: result.historial,
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
                        'author_id', a.id_autor,
                        'author_order', a.orden_autor,
                        'first_name', a.nombres,
                        'last_name', a.apellidos,
                        'dni', a.dni,
                        'professional_school', a.escuela_profesional
                    )
                )
                FROM t_autores a
                WHERE a.id_solicitud = s.id_solicitud
                ORDER BY a.orden_autor),
                '[]'
            ) AS autores,
            
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'document_id', d.id_documento,
                        'document_type', d.tipo_documento,
                        'file_name', d.nombre_archivo,
                        'file_path', d.ruta_archivo,
                        'size_kb', d.tamano_kb,
                        'status', d.estado,
                        'rejection_reason', d.razon_rechazo,
                        'upload_date', d.fecha_subida,
                        'images', IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'image_id', di.id_imagen,
                                    'image_path', di.ruta_imagen,
                                    'file_name', di.nombre_archivo,
                                    'created_at', di.created_at,
                                    'history_id', di.history_id
                                )
                            )
                            FROM t_documentos_imagenes di
                            WHERE di.id_documento = d.id_documento
                            ORDER BY di.created_at DESC),
                            JSON_ARRAY()
                        ),
                        'rejection_history', IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'history_id', hr.id_historial,
                                    'status', hr.estado,
                                    'rejection_reason', hr.razon_rechazo,
                                    'rejected_at', hr.fecha_registro,
                                    'images', IFNULL(
                                        (SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                'image_id', hri.id_imagen,
                                                'image_path', hri.ruta_imagen,
                                                'file_name', hri.nombre_archivo,
                                                'created_at', hri.created_at
                                            )
                                        )
                                        FROM t_documentos_imagenes hri
                                        WHERE hri.id_documento = d.id_documento 
                                        AND hri.created_at >= hr.fecha_registro
                                        AND hri.created_at <= DATE_ADD(hr.fecha_registro, INTERVAL 10 MINUTE)),
                                        JSON_ARRAY()
                                    )
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
                WHERE d.id_solicitud = s.id_solicitud
                ORDER BY d.fecha_subida ASC),
                '[]'
            ) AS documentos,
            
            IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'history_id', hx.id_historial,
                        'previous_status', hx.estado_anterior,
                        'new_status', hx.estado_nuevo,
                        'comment', hx.comentario,
                        'change_date', hx.fecha_cambio,
                        'admin_name', hx.admin_name,
                        'document_id', hx.id_documento,
                        'document_type', hx.document_type,
                        'file_path_historic', hx.file_path_historico,
                        'file_name_historic', hx.file_name_historico,
                        'images', hx.images
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
                        h.file_path_historico,
                        h.file_name_historico,
                        adm.nombre_usuario AS admin_name,
                        d.tipo_documento AS document_type,
                        IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'image_id', img.id_imagen,
                                    'image_path', img.ruta_imagen,
                                    'file_name', img.nombre_archivo,
                                    'created_at', img.created_at
                                )
                            )
                            FROM t_documentos_imagenes img
                            WHERE img.history_id = h.id_historial),
                            JSON_ARRAY()
                        ) AS images
                    FROM t_historial_solicitudes h
                    LEFT JOIN t_administradores adm ON h.id_admin = adm.id_admin
                    LEFT JOIN t_documentos d ON h.id_documento = d.id_documento
                    WHERE h.id_solicitud = s.id_solicitud
                    ORDER BY h.fecha_cambio DESC
                ) hx),
                JSON_ARRAY()
            ) AS historial
            
        FROM t_solicitudes s
        WHERE s.tipo_solicitud = ?
        AND (
            s.dni = ?
            OR EXISTS (
                SELECT 1 
                FROM t_autores a 
                WHERE a.id_solicitud = s.id_solicitud 
                AND a.dni = ?
            )
        )
        ORDER BY s.fecha_solicitud DESC
        LIMIT 1
    `;

        console.log('📝 Ejecutando query con params:', [applicationType, dni, dni]);

        try {
            const [rows] = await pool.execute(query, [applicationType, dni, dni]);

            console.log('📊 Número de resultados:', rows.length);

            if (rows.length === 0) {
                console.log('❌ No se encontraron resultados');
                return null;
            }

            console.log('✅ Registro encontrado:', {
                id: rows[0].id_solicitud,
                dni: rows[0].solicitante_dni,
                tipo: rows[0].tipo_solicitud,
                nombre: rows[0].solicitante_nombres
            });

            const result = rows[0];

            // ✅ Función helper para parsear JSON de forma segura
            const safeJSONParse = (value) => {
                if (value == null) return [];
                if (Array.isArray(value)) return value;
                if (typeof value === "object") return value;
                if (value === "" || value === "null") return [];

                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            };

            // ✅ Parsear datos
            result.autores = safeJSONParse(result.autores);

            result.documentos = safeJSONParse(result.documentos).map((document) => ({
                ...document,
                images: safeJSONParse(document.images),
                status: mapDbStatusToApi(document.status),
                rejection_history: safeJSONParse(document.rejection_history).map((rejection) => ({
                    ...rejection,
                    status: mapDbStatusToApi(rejection.status),
                    images: safeJSONParse(rejection.images)
                }))
            }));

            result.historial = safeJSONParse(result.historial).map((entry) => ({
                ...entry,
                previous_status: mapDbStatusToApi(entry.previous_status),
                new_status: mapDbStatusToApi(entry.new_status),
                images: safeJSONParse(entry.images)
            }));

            // ✅ Formatear respuesta IGUAL que getDocumentsWithApplicationDetails
            const formattedResult = {
                applicationId: result.id_solicitud,
                applicationType: result.tipo_solicitud,
                applicant: {
                    name: result.solicitante_nombres,
                    surname: result.solicitante_apellidos,
                    email: result.solicitante_email,
                    dni: result.solicitante_dni,
                    phone: result.numero_contacto,
                    professional_school: result.escuela_profesional,
                    authors: result.autores
                },
                projectName: result.nombre_proyecto,
                observations: result.observaciones,
                status: mapDbStatusToApi(result.estado),
                created_at: result.fecha_solicitud,
                publication_link: result.link_tesis_publicada,
                // ✅ Documentos con toda la info (igual que por ID)
                documents: result.documentos.map(doc => ({
                    document_id: doc.document_id,
                    document_type: doc.document_type,
                    file_name: doc.file_name,
                    file_path: doc.file_path,
                    size_kb: doc.size_kb,
                    upload_date: doc.upload_date,
                    status: doc.status,
                    rejection_reason: doc.rejection_reason,
                    images: doc.images, // ✅ Array de objetos con image_id, image_path, etc.
                    rejection_history: doc.rejection_history // ✅ Con imágenes incluidas
                })),
                // ✅ Timeline completo (igual que por ID)
                timeline: result.historial.map(h => ({
                    history_id: h.history_id,
                    date: h.change_date,
                    status: h.new_status,
                    previous_status: h.previous_status,
                    document_id: h.document_id,
                    document_type: h.document_type,
                    file_path_historic: h.file_path_historic,
                    file_name_historic: h.file_name_historic,
                    comment: h.comment,
                    admin_name: h.admin_name,
                    images: h.images // ✅ Imágenes del historial
                }))
            };

            console.log('✅ Datos formateados correctamente');
            console.log('📸 Total de documentos:', formattedResult.documents.length);
            console.log('📸 Documentos con imágenes:',
                formattedResult.documents.filter(doc => doc.images && doc.images.length > 0).length
            );
            console.log('📝 Eventos en timeline:', formattedResult.timeline.length);
            console.log('🖼️ Eventos con imágenes:',
                formattedResult.timeline.filter(t => t.images && t.images.length > 0).length
            );

            return formattedResult;

        } catch (error) {
            console.error('❌ Error en query:', error);
            throw error;
        }
    }

    async updateDocumentStatus(documentId, status, rejectionReason = null, images = [], newFilePath = null, newFileName = null, newFileSize = null) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const normalizedStatus = mapApiStatusToDb(status);

            if (!["pendiente", "aprobado", "observado"].includes(normalizedStatus)) {
                throw new Error(`Estado inválido para DB: ${normalizedStatus}`);
            }

            // ✅ Obtener información del documento actual
            const [docInfo] = await connection.execute(
                `SELECT id_solicitud, tipo_documento, estado as estado_anterior, 
                    ruta_archivo, nombre_archivo, tamano_kb 
             FROM t_documentos 
             WHERE id_documento = ?`,
                [documentId]
            );

            if (docInfo.length === 0) {
                throw new Error('Documento no encontrado');
            }

            const {
                id_solicitud,
                tipo_documento,
                estado_anterior,
                ruta_archivo,
                nombre_archivo,
                tamano_kb
            } = docInfo[0];

            // ✅ Determinar qué archivo guardar en el historial
            // Si hay nuevo archivo, guardamos el ANTERIOR en el historial
            // Si no hay nuevo archivo, guardamos el ACTUAL
            const filePathParaHistorial = ruta_archivo;
            const fileNameParaHistorial = nombre_archivo;

            console.log('📁 Info de archivos:', {
                archivoActual: nombre_archivo,
                nuevoArchivo: newFileName || 'ninguno',
                seGuardaraEnHistorial: fileNameParaHistorial
            });

            // ✅ Actualizar el documento
            let updateQuery;
            let updateParams;

            if (newFilePath && newFileName) {
                // Hay nuevo archivo - actualizar todo
                console.log('🔄 Actualizando con NUEVO archivo');
                updateQuery = `
                UPDATE t_documentos 
                SET 
                    estado = ?,
                    razon_rechazo = ?,
                    ruta_archivo = ?,
                    nombre_archivo = ?,
                    tamano_kb = ?,
                    fecha_subida = NOW(),
                    updated_at = NOW()
                WHERE id_documento = ?
            `;
                updateParams = [
                    normalizedStatus,
                    rejectionReason,
                    newFilePath,
                    newFileName,
                    newFileSize,
                    documentId
                ];
            } else {
                // No hay nuevo archivo - solo actualizar estado
                console.log('📝 Actualizando solo ESTADO');
                updateQuery = `
                UPDATE t_documentos 
                SET 
                    estado = ?,
                    razon_rechazo = ?,
                    updated_at = NOW()
                WHERE id_documento = ?
            `;
                updateParams = [normalizedStatus, rejectionReason, documentId];
            }

            await connection.execute(updateQuery, updateParams);

            // ✅ Crear registro en historial
            const idHistorial = uuidv4();
            const comentario = rejectionReason
                ? `${tipo_documento} - ${normalizedStatus}: ${rejectionReason}`
                : `${tipo_documento} - ${normalizedStatus}`;

            console.log('💾 Guardando en historial:', {
                id: idHistorial,
                comentario,
                estado_anterior,
                estado_nuevo: normalizedStatus,
                archivo_historico: fileNameParaHistorial
            });

            await connection.execute(
                `INSERT INTO t_historial_solicitudes 
            (id_historial, id_solicitud, id_documento, estado_anterior, estado_nuevo, 
             comentario, fecha_cambio, file_path_historico, file_name_historico)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
                [
                    idHistorial,
                    id_solicitud,
                    documentId,
                    estado_anterior,
                    normalizedStatus,
                    comentario,
                    filePathParaHistorial,
                    fileNameParaHistorial
                ]
            );

            // ✅ Registrar en historial de rechazos si aplica
            if (normalizedStatus === 'observado' && rejectionReason) {
                console.log('📋 Guardando en historial de rechazos');
                await connection.execute(
                    `INSERT INTO t_historial_rechazos (id_documento, estado, razon_rechazo)
                 VALUES (?, ?, ?)`,
                    [documentId, normalizedStatus, rejectionReason]
                );
            }

            // ✅ Guardar imágenes asociadas al historial
            let imageIds = [];
            if (images && images.length > 0) {
                console.log('📸 Guardando', images.length, 'imágenes asociadas al historial:', idHistorial);
                imageIds = await this.saveDocumentImages(documentId, images, connection, idHistorial);
            }

            await connection.commit();
            console.log('✅ Documento actualizado correctamente con historial preservado');

            return {
                success: true,
                historyId: idHistorial,
                previousFile: fileNameParaHistorial,
                newFile: newFileName || 'sin cambios'
            };

        } catch (error) {
            await connection.rollback();
            console.error('❌ Error en updateDocumentStatus:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async saveDocumentImages(documentId, images, connection, historyId = null) {
        const insertQuery = `
        INSERT INTO t_documentos_imagenes 
        (id_documento, ruta_imagen, nombre_archivo, history_id)
        VALUES (?, ?, ?, ?)
    `;

        const imageIds = [];
        for (const image of images) {
            console.log('📷 Guardando imagen:', {
                documento: documentId,
                archivo: image.filename,
                historial: historyId
            });

            const [result] = await connection.execute(insertQuery, [
                documentId,
                image.path,
                image.filename,
                historyId  // ✅ Asociar imagen con el registro de historial
            ]);
            imageIds.push(result.insertId);
        }

        return imageIds;
    }

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

            console.log('🔍 updateApplicationStatus - Inicio:', {
                applicationId,
                newStatus,
                normalizedStatus,
                comment,
                adminId,
                commentType: typeof comment,
                commentLength: comment?.length
            });

            // Leer estado anterior
            const [prev] = await connection.execute(
                "SELECT estado FROM t_solicitudes WHERE id_solicitud = ? LIMIT 1",
                [applicationId]
            );

            if (prev.length === 0) {
                throw new Error("Solicitud no encontrada");
            }

            const previousStatus = prev[0].estado;
            console.log('📊 Estado anterior:', previousStatus);

            // Actualizar solicitud
            const updateQuery = `
            UPDATE t_solicitudes
            SET estado = ?, observaciones = ?, updated_at = NOW()
            WHERE id_solicitud = ?
        `;

            await connection.execute(updateQuery, [normalizedStatus, comment, applicationId]);
            console.log('✅ Solicitud actualizada');

            // Insertar en historial
            const idHistory = uuidv4();

            // ✅ IMPORTANTE: id_documento debe ser NULL para cambios de estado general
            const historyParams = [
                idHistory,           // id_historial
                applicationId,       // id_solicitud  
                null,                // id_documento (NULL porque es cambio general)
                previousStatus,      // estado_anterior
                normalizedStatus,    // estado_nuevo
                comment || null      // comentario (convertir string vacío a null)
            ];

            console.log('📝 Parámetros del historial:', historyParams);

            if (adminId) {
                // Con id_admin
                const historyQueryWithAdmin = `
                INSERT INTO t_historial_solicitudes
                (id_historial, id_solicitud, id_documento, estado_anterior, estado_nuevo, comentario, id_admin, fecha_cambio)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;

                await connection.execute(historyQueryWithAdmin, [...historyParams, adminId]);
                console.log('✅ Historial insertado CON admin_id:', adminId);
            } else {
                // Sin id_admin
                const historyQueryWithoutAdmin = `
                INSERT INTO t_historial_solicitudes
                (id_historial, id_solicitud, id_documento, estado_anterior, estado_nuevo, comentario, fecha_cambio)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

                await connection.execute(historyQueryWithoutAdmin, historyParams);
                console.log('✅ Historial insertado SIN admin_id');
            }

            await connection.commit();
            console.log('✅ Transacción completada');

            return { success: true };

        } catch (e) {
            await connection.rollback();
            console.error('❌ Error en updateApplicationStatus:', {
                error: e.message,
                code: e.code,
                errno: e.errno,
                sql: e.sql
            });
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
