import applicationService from '../services/applicationService.js';
import authorService from '../services/authorService.js';
import advisorService from '../services/advisorService.js';
import juryService from '../services/juryService.js';
import documentService from '../services/documentService.js';
import { formatApplicationData } from '../utils/formatApplication.js';


class ApplicationController {

    async createApplication(req, res) {

        console.log("⚠️ ENTRÓ A createApplication (ESTUDIANTE), BODY:", req.body);

        try {
            const { checkboxes, students, advisors, jury, projectTitle } = req.body;
            const files = req.files;

            const firstStudent = students?.[0] || {};

            const application = await applicationService.createApplication({
                applicationType: 'estudiante',
                name: firstStudent.nombres ?? null,
                surname: firstStudent.apellidos ?? null,
                email: firstStudent.correo ?? firstStudent.email ?? null,
                dni: firstStudent.dni ?? null,
                contactNumber: firstStudent.telefono ?? null,
                professionalSchool: firstStudent.escuela ?? null,
                acceptTerms: checkboxes?.agreement ?? false,
                ajustedFormat: checkboxes?.format ?? false,
                errorsRead: checkboxes?.errors ?? false,
                informedProcedure: checkboxes?.informed ?? false,
                declaresTruth: false,
                financingType: null,
                projectName: projectTitle ?? null,
                observations: null,
                linkToPublishedTesis: null,
                status: 'pendiente',
                applicationDate: new Date()
            });

            const idApplication = application.application.id;

            const authorOrders = ['principal', 'segundo', 'tercero', 'coautor'];

            if (students?.length > 0) {
                for (let i = 0; i < students.length; i++) {
                    const s = students[i];

                    if (s && s.dni) {
                        await authorService.createAuthor(
                            idApplication,
                            authorOrders[i] ?? 'principal',
                            s.nombres ?? null,
                            s.apellidos ?? null,
                            s.dni ?? null,
                            s.orcid ?? null,
                            s.escuela ?? null
                        );
                    }
                }
            }

            const advisorOrders = ['primero', 'segundo'];

            if (advisors?.length > 0) {
                for (let i = 0; i < advisors.length; i++) {
                    const a = advisors[i];

                    if (a && a.dni) {
                        await advisorService.createAdvisor(
                            idApplication,
                            advisorOrders[i] ?? 'primero',
                            a.nombre ?? null,
                            a.dni ?? null,
                            a.orcid ?? null
                        );
                    }
                }
            }

            const juryRoles = ['presidente', 'primer_miembro', 'segundo_miembro'];

            if (jury?.length > 0) {

                for (let i = 0; i < jury.length; i++) {

                    const member = jury[i];

                    if (typeof member === 'object') {

                        const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
                        if (fullName.length > 0) {

                            await juryService.createJury(
                                idApplication,
                                juryRoles[i] ?? 'primer_miembro',
                                fullName
                            );
                        }
                        continue;
                    }

                    if (typeof member === 'string' && member.trim().length > 0) {
                        await juryService.createJury(
                            idApplication,
                            juryRoles[i] ?? 'primer_miembro',
                            member.trim()
                        );
                    }
                }
            }

            const documentTypes = {
                authorization: 'hoja_autorizacion',
                certificate: 'constancia_empastado',
                thesis: 'tesis_pdf',
                originality: 'constancia_originalidad'
            };

            if (files) {
                for (const [key, file] of Object.entries(files)) {
                    if (file && documentTypes[key]) {
                        await documentService.createDocument(
                            idApplication,
                            file,
                            documentTypes[key],
                            new Date()
                        );
                    }
                }
            }


            return res.status(201).json({
                success: true,
                message: 'Solicitud creada exitosamente',
                data: { applicationId: idApplication }
            });

        } catch (error) {
            console.error('Error al crear solicitud:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async createTeacherApplication(req, res) {

        console.log("📌 ENTRÓ A createTeacherApplication (DOCENTE)");

        try {
            const { checkboxes, teachers, coauthors, projectTitle } = req.body;
            const files = req.files;

            if (!projectTitle || projectTitle.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'El título del proyecto es requerido (mínimo 5 caracteres)'
                });
            }

            if (!teachers || teachers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe agregar al menos un autor'
                });
            }

            if (!checkboxes.agreement || !checkboxes.format || !checkboxes.errors || !checkboxes.informed) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe aceptar todos los términos requeridos'
                });
            }

            if (!checkboxes.truthful) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe declarar que la información es verídica'
                });
            }

            if (!checkboxes.funding) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar el tipo de financiamiento'
                });
            }


            const firstTeacher = teachers[0];

            if (!firstTeacher.nombres || !firstTeacher.apellidos || !firstTeacher.dni) {
                return res.status(400).json({
                    success: false,
                    message: 'El primer autor debe tener nombres, apellidos y DNI completos'
                });
            }

            const application = await applicationService.createApplication({
                applicationType: 'docente',
                name: firstTeacher.nombres,
                surname: firstTeacher.apellidos,
                email: firstTeacher.correo ?? firstTeacher.email ?? null,
                dni: firstTeacher.dni,
                contactNumber: firstTeacher.telefono || null,
                professionalSchool: firstTeacher.escuela || firstTeacher.escuela_profesional || null,
                acceptTerms: checkboxes.agreement,
                ajustedFormat: checkboxes.format,
                errorsRead: checkboxes.errors,
                informedProcedure: checkboxes.informed,
                declaresTruth: checkboxes.truthful,
                financingType:
                    checkboxes.funding === 'public'
                        ? 'publico'
                        : checkboxes.funding === 'self'
                            ? 'autofinanciado'
                            : null,
                projectName: projectTitle,
                observations: null,
                linkToPublishedTesis: null,
                status: 'pendiente',
                applicationDate: new Date()
            });

            const idApplication = application.application.id;

            const authorOrders = ['principal', 'segundo', 'tercero', 'coautor'];

            for (let i = 0; i < teachers.length; i++) {
                const t = teachers[i];

                if (!t || !t.dni) continue;

                await authorService.createAuthor(
                    idApplication,
                    authorOrders[i] ?? 'coautor',
                    t.nombres,
                    t.apellidos,
                    t.dni,
                    t.orcid || null,
                    t.escuela || null,
                    'autor',
                    'interno',
                    'docente'
                );
            }

            if (coauthors?.length > 0) {
                for (const c of coauthors) {

                    if (!c || !c.dni || !c.nombre) continue;

                    let tipoColaborador = 'coautor';

                    if (c.tipoUbicacion === 'interno')
                        tipoColaborador = 'colaborador_interno';
                    else if (c.tipoUbicacion === 'externo')
                        tipoColaborador = 'colaborador_externo';

                    await authorService.createAuthor(
                        idApplication,
                        'coautor',
                        c.nombre,
                        c.apellido || null,
                        c.dni,
                        c.orcid || null,
                        c.tipoUbicacion === 'interno' ? c.escuela || null : null,
                        tipoColaborador,
                        c.tipoUbicacion || null,
                        c.tipoRol || null
                    );
                }
            }
            const documentTypes = {
                authorization: 'hoja_autorizacion',
                document: 'constancia_empastado',
                similarity: 'constancia_originalidad',
                report: 'tesis_pdf'
            };

            if (files) {
                for (const [key, file] of Object.entries(files)) {
                    console.log("DOCUMENT DEBUG:", {
                        fieldname: key,
                        originalName: file.originalname,
                        storedAs: file.filename,
                        typeMapped: documentTypes[key]
                    });

                    if (file && documentTypes[key]) {
                        await documentService.createDocument(
                            idApplication,
                            file,
                            documentTypes[key],
                            new Date()
                        );
                    }
                }
            }


            return res.status(201).json({
                success: true,
                message: 'Solicitud de docente creada exitosamente',
                data: {
                    applicationId: idApplication,
                    tipo_solicitud: 'docente',
                    estado: 'pendiente'
                }
            });

        } catch (error) {

            console.error('Error al crear solicitud de docente:', error);

            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async getTeacherApplicationDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });

            const data = await applicationService.getDocumentsWithApplicationDetails(id);
            if (!data) return res.status(404).json({ success: false, message: 'No encontrado' });

            return res.status(200).json({ success: true, data: data });
        } catch (err) {
            console.error('Error en detalles docente:', err);
            return res.status(500).json({ success: false, message: 'Error interno' });
        }
    }

    async getStudentApplicationDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });

            const data = await applicationService.getDocumentsWithApplicationDetails(id);
            if (!data) return res.status(404).json({ success: false, message: 'No encontrado' });

            return res.status(200).json({ success: true, data: formatApplicationData(data, 'estudiante') });
        } catch (err) {
            console.error('Error en detalles estudiante:', err);
            return res.status(500).json({ success: false, message: 'Error interno' });
        }
    }

    async getDocumentsWithApplicationDetails(req, res) {
        try {
            const { id } = req.params;
            const documents = await applicationService.getDocumentsWithApplicationDetails(id);

            return res.status(200).json({
                success: true,
                data: documents
            });

        } catch (error) {
            console.error('Error al obtener documentos con detalles de solicitud:', error);

            return res.status(500).json({
                success: false,
                message: 'Error al obtener documentos'
            });
        }
    }

    async getApplications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || null;
            const search = req.query.search || null;
            const professionalSchool = req.query.professionalSchool || null;
            const condition = req.query.condition ?? 'estudiante';

            if (page < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de página debe ser mayor a 0'
                });
            }

            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'El límite debe estar entre 1 y 100'
                });
            }

            const result = await applicationService.getApplications({
                page,
                limit,
                status,
                search,
                professionalSchool,
                condition
            });

            return res.status(200).json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('Error en getStudents:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estudiantes',
                error: error.message
            });
        }
    }

    async getApplicationByDni(req, res) {
        try {
            const { dni, type } = req.query;

            if (!dni) {
                return res.status(400).json({
                    success: false,
                    message: 'El DNI es requerido'
                });
            }

            if (!type || !['estudiante', 'docente'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'El tipo de solicitud debe ser "estudiante" o "docente"'
                });
            }

            if (type === 'estudiante' && dni.length !== 8) {
                return res.status(400).json({
                    success: false,
                    message: 'El DNI de estudiante debe tener 8 dígitos'
                });
            }

            if (type === 'docente' && dni.length !== 6) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de docente debe tener 6 dígitos'
                });
            }
            const application = await applicationService.getApplicationByDni(dni, type);
            console.log(dni, type);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún trámite con ese DNI/códigos'
                });
            }

            return res.status(200).json({
                success: true,
                data: application
            });

        } catch (error) {
            console.error('Error en getApplicationByDni controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al buscar el trámite',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // En applicationController.js

    async updateDocumentReview(req, res) {
        try {
            const { documentId } = req.params;
            console.log('updateDocumentReview body:', req.body);
            console.log('updateDocumentReview raw files:', req.files);

            const { status, observation } = req.body;

            // Normalizar archivos: multer puede devolver array (upload.array) o objeto (upload.fields)
            let imagesArray = [];
            if (Array.isArray(req.files)) {
                imagesArray = req.files;
            } else if (req.files && typeof req.files === 'object') {
                imagesArray = Object.values(req.files).flat();
            }

            // Validar status
            if (!['pendiente', 'aprobado', 'observado','publicado'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Estado inválido' });
            }

            // Validación adicional opcional
            // if (imagesArray.length > 0) { ...comprobar propiedades... }

            const result = await applicationService.updateDocumentReview(
                documentId,
                status,
                observation,
                imagesArray
            );

            return res.status(200).json({
                success: true,
                message: 'Documento actualizado correctamente',
                data: result
            });
        } catch (error) {
            console.error('Error al actualizar documento (stack):', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el documento',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async updateApplicationReview(req, res) {
        try {
            const { id } = req.params;
            const { status, observations } = req.body;
            const adminId = req.user?.id || null;

            console.log('📝 Actualizando estado general de solicitud:', {
                id,
                status,
                observations,
                adminId
            });

            if (!['pendiente', 'en_revision', 'aprobado', 'observado', 'requiere_correccion', 'publicado'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }

            const result = await applicationService.updateApplicationReview(
                id,
                status,
                observations,
                adminId
            );

            return res.status(200).json({
                success: true,
                message: 'Estado general de la solicitud actualizado correctamente',
                data: result
            });

        } catch (error) {
            console.error('❌ Error al actualizar solicitud:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el estado general de la solicitud',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }


    async bulkUpdateDocuments(req, res) {
        try {
            const { applicationId } = req.params;
            const { documents } = req.body;
            console.log("estamos aqui")
            if (!Array.isArray(documents) || documents.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar al menos un documento para actualizar'
                });
            }

            const result = await applicationService.bulkUpdateDocuments(
                applicationId,
                documents
            );

            return res.status(200).json({
                success: true,
                message: 'Documentos actualizados correctamente',
                data: result
            });

        } catch (error) {
            console.error('Error al actualizar documentos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar los documentos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async savePublicationLink(req, res) {
        try {
            const { id } = req.params;
            const { publicationLink } = req.body;

            if (!publicationLink) {
                return res.status(400).json({
                    success: false,
                    message: 'El enlace de publicación es requerido'
                });
            }

            const result = await applicationService.savePublicationLink(id, publicationLink);

            return res.status(200).json({
                success: true,
                message: 'Enlace de publicación guardado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error al guardar enlace de publicación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno al guardar enlace de publicación'
            });
        }
    }

}

export default new ApplicationController();
