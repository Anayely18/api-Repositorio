class Advisor {
    constructor(data) {
        this.id = data.id_asesor;
        this.idApplication = data.id_solicitud;
        this.advisoryOrder = data.orden_asesor;
        this.fullName = data.apellidos_nombres;
        this.dni = data.dni;
        this.orcid = data.orcid;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toDatabase() {
        return {
            id_asesor: this.id,
            id_solicitud: this.idApplication,
            orden_asesor: this.advisoryOrder,
            apellidos_nombres: this.fullName,
            dni: this.dni,
            orcid: this.orcid,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            id: this.id,
            idApplication: this.idApplication,
            advisoryOrder: this.advisoryOrder,
            fullName: this.fullName,
            dni: this.dni,
            orcid: this.orcid,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export default Advisor;
