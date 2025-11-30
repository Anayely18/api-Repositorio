import applicationService from '../services/applicationService.js';
import authorService from '../services/authorService.js';
import advisorService from '../services/advisorService.js';
import juryService from '../services/juryService.js';
import documentService from '../services/documentService.js';
import { formatApplicationData } from '../utils/formatApplication.js';
class ApplicationController {

    /* ==============================================================
       ===============   CREATE APPLICATION STUDENT   ===============
       ============================================================== */
    async createApplication(req, res) {

        console.log("⚠️ ENTRÓ A createApplication (ESTUDIANTE), BODY:", req.body);

        try {
            const { checkboxes, students, advisors, jury, projectTitle } = req.body;
            const files = req.files;

            const firstStudent = students?.[0] || {};

            // Crear la solicitud base
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
                    'autor',             // tipo_colaborador
                    'interno',           // tipo_ubicacion
                    'docente'            // tipo_rol
                );
            }


            /* =============================================
               REGISTRO DE COAUTORES (DOCENTE)
               ============================================= */
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
                        tipoColaborador,          // tipo_colaborador
                        c.tipoUbicacion || null,  // tipo_ubicacion
                        c.tipoRol || null         // tipo_rol
                    );
                }
            }


            /* =============================================
               REGISTRO DE DOCUMENTOS DOCENTES
               ============================================= */
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



    /* ==============================================================
       ===============   GET TEACHER APPLICATION DETAILS   ===========
       ============================================================== */
    async getTeacherApplicationDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });

            const data = await applicationService.getApplicationWithRelatedData(id);
            if (!data) return res.status(404).json({ success: false, message: 'No encontrado' });

            return res.status(200).json({ success: true, data: formatApplicationData(data, 'docente') });
        } catch (err) {
            console.error('Error en detalles docente:', err);
            return res.status(500).json({ success: false, message: 'Error interno' });
        }
    }

    async getStudentApplicationDetails(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });

            const data = await applicationService.getApplicationWithRelatedData(id);
            if (!data) return res.status(404).json({ success: false, message: 'No encontrado' });

            return res.status(200).json({ success: true, data: formatApplicationData(data, 'estudiante') });
        } catch (err) {
            console.error('Error en detalles estudiante:', err);
            return res.status(500).json({ success: false, message: 'Error interno' });
        }
    }

    /* ==============================================================
       ===============   GET ALL DOCUMENTS + APPLICATION   ===========
       ============================================================== */
    async getDocumentsWithApplicationDetails(req, res) {
        try {
            const documents = await applicationService.getDocumentsWithApplicationDetails();

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

    async getStudents(req, res) {
        try {
            const rows = await applicationService.getStudents();
            return res.status(200).json({ success: true, data: rows });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error cargando estudiantes" });
        }
    }

    async getTeachers(req, res) {
        try {
            const rows = await applicationService.getTeachers();
            return res.status(200).json({ success: true, data: rows });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error cargando docentes" });
        }
    }

}

export default new ApplicationController();
