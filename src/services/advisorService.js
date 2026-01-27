import { v4 as uuidv4 } from 'uuid'
import advisorRepository from '../repositories/advisorRepository.js';

class AdvisorService {
    async createAdvisor(idApplication, advisoryOrder, fullName, dni, orcid) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const advisor = await advisorRepository.create(id, idApplication, advisoryOrder, fullName, dni, orcid, createdAt, updatedAt);

        return {
            advisor
        }
    }
}

export default new AdvisorService();
