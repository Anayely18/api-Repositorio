import { v4 as uuidv4 } from "uuid";
import applicationRepository from "../repositories/applicationRepository.js";

class ApplicationService {
    async createApplication({
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
        applicationDate
    }) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");

        // Asegurar que email no sea nulo, y sea único aunque sea “falso”
        let finalEmail = email;
        if (!finalEmail || finalEmail.trim() === "") {
            // Genera uno sintético basado en el DNI para evitar violar UNIQUE
            finalEmail = `no-email-${dni || id}@noemail.local`;
        }

        const createdAt = now;
        const updatedAt = now;

        const insertId = await applicationRepository.create(
            id,
            applicationType,
            name,
            surname,
            finalEmail,
            dni,
            contactNumber,
            professionalSchool,
            !!acceptTerms,
            !!ajustedFormat,
            !!errorsRead,
            !!informedProcedure,
            !!declaresTruth,
            financingType || null,
            projectName,
            observations,
            linkToPublishedTesis,
            status,
            applicationDate,
            createdAt,
            updatedAt
        );

        return {
            application: {
                id,
                insertId
            }
        };
    }

    async getDocumentsWithApplicationDetails() {
        return await applicationRepository.getDocumentsWithApplicationDetails();
    }
}

export default new ApplicationService();
