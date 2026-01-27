class Author {
    constructor (data) {
        this.id = data.id_autor;
        this.idApplication = data.id_solicitud;
        this.authorOrder = data.orden_autor;
        this.name = data.nombres;
        this.surname = data.apellidos;
        this.dni = data.dni;
        this.urlOrcid = data.url_orcid;
        this.professionalSchool = data.escuela_profesional;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toDatabase() {
        return {
            id_autor: this.id,
            id_solicitud: this.idApplication,
            orden_autor: this.authorOrder,
            nombres: this.name,
            apellidos: this.surname,
            dni: this.dni,
            url_orcid: this.urlOrcid,
            escuela_profesional: this.professionalSchool,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            id: this.id,
            idApplication: this.idApplication,
            authorOrder: this.authorOrder,
            name: this.name,
            surname: this.surname,
            dni: this.dni,
            urlOrcid: this.urlOrcid,
            professionalSchool: this.professionalSchool,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

}

export default Author;
