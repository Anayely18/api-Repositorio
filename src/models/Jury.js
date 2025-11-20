class Jury {
    constructor(data) {
        this.id = data.id_jurado;
        this.idApplication = data.id_solicitud;
        this.juryRole = data.rol_jurado;
        this.fullName = data.apellidos_nombres;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toDatabase() {
        return {
            id_jurado: this.id,
            id_solicitud: this.idApplication,
            rol_jurado: this.juryRole,
            apellidos_nombres: this.fullName,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            idApplication: this.idApplication,
            juryRole: this.juryRole,
            fullName: this.fullName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export default Jury;
