class Administrator {
    constructor(data) {
        this.id = data.id_admin;
        this.username = data.nombre_usuario;
        this.name = data.nombre;
        this.surname = data.apellidos;
        this.dni = data.dni;
        this.email = data.email;
        this.password = data.contrasena;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
        this.active = data.active;
        this.lastAccess = data.ultimo_acceso;
    }

    toDatabase() {
        return {
            id_admin: this.id,
            nombre_usuario: this.username,
            nombre: this.name,
            apellidos: this.surname,
            dni: this.dni,
            correo: this.email,
            contrasena: this.password,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
            ultimo_acceso: this.lastAccess,
            activo: this.active,
        };
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            name: this.name,
            surname: this.surname,
            dni: this.dni,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastAccess: this.lastAccess,
            active: this.active
        };
    }
}

export default Administrator;