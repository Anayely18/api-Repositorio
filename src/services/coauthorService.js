import { v4 as uuidv4 } from 'uuid';
import coauthorRepository from '../repositories/coauthorRepository.js';

class CoauthorService {
    async createCoauthor(
        idSolicitud,
        tipoUbicacion,
        tipoRol,
        nombres,
        apellidos,
        orcidUrl
    ) {
        const id = uuidv4();
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");

        console.log('💾 Guardando coautor:', {
            id,
            idSolicitud,
            tipoUbicacion,
            tipoRol,
            nombres,
            apellidos,
            orcidUrl
        });

        const saved = await coauthorRepository.create(
            id,
            idSolicitud,
            tipoUbicacion,
            tipoRol,
            nombres,
            apellidos,
            orcidUrl,
            now,
            now
        );

        return { coauthorId: saved.id };
    }
}

export default new CoauthorService();