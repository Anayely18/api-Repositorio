export function formatApplicationData(applicationData, tipo = 'estudiante') {
  const isTeacher = tipo === 'docente';

  return {
    solicitud: {
      id: applicationData.id_solicitud,
      tipo: applicationData.tipo_solicitud,
      titulo: applicationData.nombre_proyecto,
      estado: applicationData.estado,
      fecha_solicitud: applicationData.fecha_solicitud,
    },
    autor_principal: {
      nombres: applicationData.nombres,
      apellidos: applicationData.apellidos,
      dni: applicationData.dni,
      escuela: applicationData.escuela_profesional,
    },
    autores: applicationData.autores?.filter(a => a !== null) || [],
    coautores: applicationData.autores?.filter(a => {
      if (!a) return false;
      return isTeacher ? a.orden_autor !== 'principal' : a.orden_autor !== 'autor';
    }) || [],
    asesores: applicationData.asesores || [],
    jurado: applicationData.jurado || [],
    documentos: applicationData.documentos?.filter(d => d !== null) || [],
    checkboxes: {
      acepta_terminos: applicationData.acepta_terminos,
      formato_ajustado: applicationData.formato_ajustado,
      errores_leidos: applicationData.errores_leidos,
      tramite_informado: applicationData.tramite_informado
    }
  };
}
