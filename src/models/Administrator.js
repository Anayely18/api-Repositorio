class Administrator {
    constructor(data) {
        this.id = data.id;
        this.name = data.nombre;
        this.surname = data.apellidos;
        this.dni = data.dni;
        this.email = data.correo;
        this.password = data.contrasena;
        this.createdAt = data.creado_at;
    }

    toDatabase() {
        return {
            nombre: this.name,
            apellidos: this.surname,
            dni: this.dni,
            correo: this.email,
            contrasena: this.password
        };
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            surname: this.surname,
            dni: this.dni,
            email: this.email,
            createdAt: this.createdAt
        };
    }
}

export default Administrator;