import { v4 as uuidv4 } from 'uuid'
import applicationRepository from '../repositories/applicationRepository.js';

class ApplicationService {
    async createApplication(applicationType, name, surname, dni, contactNumber, professionalSchool, acceptTerms, ajustedFormat, errorsRead, informedProcedure, projectName, observations, linkToPublishedTesis, status, applicationDate) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const application = await applicationRepository.create(id, applicationType, name, surname, dni, contactNumber, professionalSchool, acceptTerms, ajustedFormat, errorsRead, informedProcedure, projectName, observations, linkToPublishedTesis, status, applicationDate, createdAt, updatedAt);

        return {
            application: {id}
        }
    }

    async getDocumentsWithApplicationDetails() {
        return await applicationRepository.getDocumentsWithApplicationDetails();
    }
}

export default new ApplicationService();
