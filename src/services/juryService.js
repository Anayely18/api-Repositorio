import { v4 as uuidv4 } from 'uuid'
import juryRepository from '../repositories/juryRepository.js';

class JuryService {
    async createJury(idApplication, juryRole, fullName) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const jury = await juryRepository.create(id, idApplication, juryRole, fullName, createdAt, updatedAt);
        return {
            jury
        }
    }
}

export default new JuryService();   
