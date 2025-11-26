import { v4 as uuidv4 } from 'uuid';
import authorRepository from '../repositories/authorRepository.js';

class AuthorService {

    /**
     * Crea un autor, coautor o colaborador
     * 
     * @param {string} idApplication 
     * @param {string} authorOrder principal | segundo | tercero | coautor
     * @param {string} name 
     * @param {string} surname 
     * @param {string} dni 
     * @param {string} urlOrcid 
     * @param {string} professionalSchool 
     * @param {string} tipoColaborador autor | colaborador_interno | colaborador_externo
     * @param {string} tipoUbicacion interno | externo
     * @param {string} tipoRol estudiante | docente
     */
    async createAuthor(
        idApplication,
        authorOrder,
        name,
        surname,
        dni,
        urlOrcid,
        professionalSchool,
        tipoColaborador = 'autor',
        tipoUbicacion = null,
        tipoRol = null
    ) {
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

            tipoColaborador ?? 'autor',
            tipoUbicacion ?? null,
            tipoRol ?? null,

            createdAt,
            updatedAt
        );

        return { author };
    }
}

export default new AuthorService();
