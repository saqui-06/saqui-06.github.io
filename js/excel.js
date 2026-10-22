/**
 * EXCEL.JS - Control Novedades
 * Exportación multi-hoja a Excel mediante SheetJS con cálculo de tiempo de resolución en horas (Solo Administrador)
 */

function calcularTiempoResolucionHoras(fechaApertura, fechaResolucion, estado) {
    if (!fechaApertura) return 'Sin fecha de apertura';

    const inicio = new Date(fechaApertura);

    if (estado === 'Finalizado' && fechaResolucion) {
        const fin = new Date(fechaResolucion);
        const diffMs = fin - inicio;
        if (diffMs < 0) return '0.00 hrs (Error en fechas)';
        const horas = (diffMs / (1000 * 60 * 60)).toFixed(2);
        return `${horas} hrs (Resuelto)`;
    } else if (estado === 'Finalizado' && !fechaResolucion) {
        return 'Finalizado (Sin hora fin)';
    } else {
        const ahora = new Date();
        const diffMs = ahora - inicio;
        const horas = Math.max(0, (diffMs / (1000 * 60 * 60))).toFixed(2);
        return `${horas} hrs en curso (${estado})`;
    }
}

function exportarReporteExcel() {
    const sesion = StorageService.getSesion();
    if (!sesion || sesion.rol !== 'Administrador') {
        mostrarToast('Acceso restringido: Solo el Administrador puede exportar reportes.', 'danger');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('Error: La librería SheetJS no se encuentra disponible.');
        return;
    }

    const novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
    const usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
    const departamentos = StorageService.get(STORAGE_KEYS.DEPARTAMENTOS);
    const equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);

    // 1. Hoja "Novedades" con cálculo de tiempo de atención
    const datosNovedades = novedades.map(nov => ({
        'Código': nov.codigo || '',
        'Título de la Novedad': nov.titulo || '',
        'Departamento Afectado': nov.departamento || 'Sin asignar',
        'Usuario Reportante': nov.reportante || '',
        'Técnico Asignado': nov.tecnico || '',
        'Fecha y Hora de Apertura': nov.fechaApertura ? nov.fechaApertura.replace('T', ' ') : '',
        'Fecha y Hora de Resolución': nov.fechaResolucion ? nov.fechaResolucion.replace('T', ' ') : 'Pendiente',
        'Estado': nov.estado || '',
        'Tiempo de Resolución (Horas)': calcularTiempoResolucionHoras(nov.fechaApertura, nov.fechaResolucion, nov.estado)
    }));

    // 2. Hoja "Usuarios"
    const datosUsuarios = usuarios.map(u => ({
        'Cédula': u.cedula || '',
        'Nombre Completo': u.nombre || '',
        'Usuario': u.username || '',
        'Correo Institucional': u.email || '',
        'Rol': u.rol || '',
        'Estado': u.estado || ''
    }));

    // 3. Hoja "Departamentos" con total de novedades asociadas
    const datosDepartamentos = departamentos.map(d => {
        const totalNov = novedades.filter(n => n.departamento === d.nombre).length;
        const novResueltas = novedades.filter(n => n.departamento === d.nombre && n.estado === 'Finalizado').length;
        return {
            'Nombre del Departamento': d.nombre,
            'Total Novedades': totalNov,
            'Novedades Pendientes / En Revisión': totalNov - novResueltas,
            'Novedades Resueltas': novResueltas
        };
    });

    // 4. Hoja "Equipos"
    const datosEquipos = equipos.map(eq => ({
        'Serie / Código': eq.serie || '',
        'Tipo de Equipo': eq.tipo || '',
        'Marca / Modelo': eq.marcaModelo || '',
        'Departamento Asignado': eq.departamento || 'Sin asignar',
        'Descripción de Falla': eq.falla || '',
        'Estado del Equipo': eq.estado || ''
    }));

    // Construcción del libro y hojas
    const wb = XLSX.utils.book_new();

    const wsNovedades = XLSX.utils.json_to_sheet(datosNovedades.length ? datosNovedades : [{ 'Mensaje': 'No hay datos' }]);
    const wsUsuarios = XLSX.utils.json_to_sheet(datosUsuarios.length ? datosUsuarios : [{ 'Mensaje': 'No hay datos' }]);
    const wsDepartamentos = XLSX.utils.json_to_sheet(datosDepartamentos.length ? datosDepartamentos : [{ 'Mensaje': 'No hay datos' }]);
    const wsEquipos = XLSX.utils.json_to_sheet(datosEquipos.length ? datosEquipos : [{ 'Mensaje': 'No hay datos' }]);

    // Ajuste de ancho de columnas
    wsNovedades['!cols'] = [
        { wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 28 }
    ];
    wsUsuarios['!cols'] = [
        { wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 32 }, { wch: 16 }, { wch: 12 }
    ];
    wsDepartamentos['!cols'] = [
        { wch: 32 }, { wch: 18 }, { wch: 34 }, { wch: 22 }
    ];
    wsEquipos['!cols'] = [
        { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 28 }, { wch: 35 }, { wch: 16 }
    ];

    // Adjuntar las 4 hojas con nombres exactos
    XLSX.utils.book_append_sheet(wb, wsNovedades, 'Novedades');
    XLSX.utils.book_append_sheet(wb, wsUsuarios, 'Usuarios');
    XLSX.utils.book_append_sheet(wb, wsDepartamentos, 'Departamentos');
    XLSX.utils.book_append_sheet(wb, wsEquipos, 'Equipos');

    // Descargar archivo Excel solicitado
    XLSX.writeFile(wb, 'Reporte_Control_Novedades.xlsx');
    mostrarToast('Reporte en Excel generado y descargado exitosamente.');
}

