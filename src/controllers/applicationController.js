import applicationService from '../services/applicationService.js';
import authorService from '../services/authorService.js';
import advisorService from '../services/advisorService.js';
import juryService from '../services/juryService.js';
import documentService from '../services/documentService.js';

class ApplicationController {
    async createApplication(req, res) {
        try {
            const { email, checkboxes, students, advisors, jury, projectTitle } = req.body;
            const files = req.files;

            const firstStudent = students?.[0] || {};

            const application = await applicationService.createApplication(
                'correo', 
                firstStudent.nombres ?? null,
                firstStudent.apellidos ?? null,
                firstStudent.dni ?? null,
                firstStudent.telefono ?? null,
                firstStudent.escuela ?? null,
                checkboxes?.agreement ?? false,
                checkboxes?.format ?? false,
                checkboxes?.errors ?? false,
                checkboxes?.informed ?? false,
                projectTitle ?? null,
                null,
                null,
                'pendiente', 
                new Date()
            );

            const idApplication = application.application.id;
            const authorOrders = ['principal', 'coautor'];
            if (students?.length > 0) {
                for (let i = 0; i < students.length; i++) {
                    const s = students[i];
                    if (s && s.dni) {
                        await authorService.createAuthor(
                            idApplication,
                            authorOrders[i] ?? 'coautor',
                            s.nombres ?? null,
                            s.apellidos ?? null,
                            s.dni ?? null,
                            s.url_orcid ?? s.orcid ?? null,  
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
                    const name = jury[i];
                    if (name && name.trim()) {
                        await juryService.createJury(
                            idApplication,
                            juryRoles[i] ?? 'primer_miembro',
                            name.trim()
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
                data: { applicationId: idApplication, email }
            });

        } catch (error) {
            console.error('Error al crear solicitud:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: error.message
            });
        }
    }

    async createTeacherApplication(req, res) {
        try {
            const { checkboxes, teachers, coauthors, projectTitle } = req.body;
            const files = req.files;

            const firstTeacher = teachers?.[0] || {};

            const application = await applicationService.createApplication(
                firstTeacher.nombres ?? null,
                firstTeacher.apellidos ?? null,
                firstTeacher.dni ?? null,
                firstTeacher.orcid ?? null,
                firstTeacher.escuela ?? null,
                checkboxes?.agreement ?? false,
                checkboxes?.format ?? false,
                checkboxes?.errors ?? false,
                checkboxes?.informed ?? false,
                checkboxes?.truthful ?? false,
                checkboxes?.funding ?? null,
                projectTitle ?? null,
                'pendiente',
                new Date()
            );

            const idApplication = application.application.id;

            const authorOrders = ['principal', 'segundo', 'tercero'];
            if (teachers?.length > 0) {
                for (let i = 0; i < teachers.length; i++) {
                    const t = teachers[i];
                    if (t && t.dni) {
                        await authorService.createAuthor(
                            idApplication,
                            authorOrders[i] ?? 'coautor',
                            t.nombres ?? null,
                            t.apellidos ?? null,
                            t.dni ?? null,
                            t.orcid ?? null,
                            t.escuela ?? null
                        );
                    }
                }
            }

            if (coauthors?.length > 0) {
                for (let i = 0; i < coauthors.length; i++) {
                    const c = coauthors[i];
                    if (c && c.dni) {
                        let orderType = 'colaborador_externo';
                        
                        if (c.tipoUbicacion === 'interno' || c.tipoUbicacion === 'UNAMBA') {
                            orderType = 'colaborador_interno';
                        }
                        
                        await authorService.createAuthor(
                            idApplication,
                            orderType,
                            c.nombre ?? null,
                            null,
                            c.dni ?? null,
                            c.orcid ?? null,
                            c.tipoUbicacion === 'interno' ? (c.escuela ?? null) : null
                        );
                    }
                }
            }

            const documentTypes = {
                authorization: 'hoja_autorizacion',
                document: 'documento_investigacion',
                similarity: 'reporte_similitud',
                report: 'informe_investigacion'
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
                message: 'Solicitud de docente creada exitosamente',
                data: { applicationId: idApplication }
            });

        } catch (error) {
            console.error('Error al crear solicitud de docente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: error.message
            });
        }
    }

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
                message: 'Error al obtener documentos',
                error: error.message
            });
        }
    }
}

export default new ApplicationController();
