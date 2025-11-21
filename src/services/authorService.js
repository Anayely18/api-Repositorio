import { v4 as uuidv4 } from 'uuid'
import authorRepository from '../repositories/authorRepository.js';

class AuthorService {
    async createAuthor(idApplication, authorOrder, name, surname, dni, urlOrcid, professionalSchool) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const createdAt = now;
        const updatedAt = now;

        const author = await authorRepository.create(
            id, 
            idApplication ?? null, 
            authorOrder ?? null, 
            name ?? null, 
            surname ?? null, 
            dni ?? null, 
            urlOrcid ?? null,  
            professionalSchool ?? null, 
            createdAt, 
            updatedAt
        );

        return {
            author
        }
    }
}

export default new AuthorService();
