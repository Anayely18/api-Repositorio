// src/services/applicationService.js
import { v4 as uuidv4 } from "uuid";
import applicationRepository from "../repositories/applicationRepository.js";

class ApplicationService {
  /** Crear solicitud (estudiante o docente) */
  async createApplication(data) {
    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Asegurar que siempre haya un email (por la UNIQUE de la BD)
    let email = data.email;
    if (!email || email.trim() === "") {
      email = `no-email-${data.dni || id}@noemail.local`;
    }

    await applicationRepository.create(
      id,
      data.applicationType,        // 'estudiante' | 'docente'
      data.name,
      data.surname,
      email,
      data.dni,
      data.contactNumber,
      data.professionalSchool,
      data.acceptTerms,
      data.ajustedFormat,
      data.errorsRead,
      data.informedProcedure,
      data.declaresTruth,
      data.financingType,
      data.projectName,
      data.observations,
      data.linkToPublishedTesis,
      data.status,
      data.applicationDate,
      now,
      now
    );

    return { application: { id } };
  }

  async getStudents() {
    return await applicationRepository.getStudents();
  }

  async getTeachers() {
    return await applicationRepository.getTeachers();
  }

  
}

export default new ApplicationService();
