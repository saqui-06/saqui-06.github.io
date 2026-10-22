/**
 * NOVEDADES.JS - Control Novedades
 * CRUD de Registro de Novedades e Incidencias (Administrador y Soporte)
 */

const NovedadController = {
    modalInstance: null,

    init() {
        this.modalInstance = new bootstrap.Modal(document.getElementById('modalNovedad'));
        document.getElementById('form-novedad').addEventListener('submit', (e) => this.guardar(e));
        document.getElementById('filtro-novedades-texto').addEventListener('input', () => this.renderizar());
        document.getElementById('filtro-novedades-depto').addEventListener('change', () => this.renderizar());
        document.getElementById('filtro-novedades-estado').addEventListener('change', () => this.renderizar());

        // Autocompletar fecha/hora al pasar a finalizado
        document.getElementById('novedad-estado').addEventListener('change', (e) => {
            const inputResolucion = document.getElementById('novedad-fecha-resolucion');
            if (e.target.value === 'Finalizado' && !inputResolucion.value) {
                inputResolucion.value = obtenerFechaHoraActualLocal();
            }
        });

        this.renderizar();
    },

    generarCodigo() {
        const novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        const num = novedades.length + 1001;
        return `NOV-${num}`;
    },

    abrirModal(id = null) {
        const form = document.getElementById('form-novedad');
        form.reset();
        DepartamentoController.actualizarSelectsGlobales();
        UsuarioController.actualizarSelectTecnicos();

        document.getElementById('novedad-edit-id').value = '';
        document.getElementById('modalNovedadLabel').innerHTML = '<i class="bi bi-ticket-perforated me-1"></i> Nueva Novedad';

        if (id) {
            const novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
            const nov = novedades.find(n => n.id === id);
            if (nov) {
                document.getElementById('novedad-edit-id').value = nov.id;
                document.getElementById('novedad-codigo').value = nov.codigo;
                document.getElementById('novedad-titulo').value = nov.titulo;
                document.getElementById('novedad-descripcion').value = nov.descripcion;
                document.getElementById('novedad-departamento').value = nov.departamento;
                document.getElementById('novedad-reportante').value = nov.reportante;
                document.getElementById('novedad-tecnico').value = nov.tecnico;
                document.getElementById('novedad-fecha-apertura').value = nov.fechaApertura || '';
                document.getElementById('novedad-fecha-resolucion').value = nov.fechaResolucion || '';
                document.getElementById('novedad-estado').value = nov.estado;
                document.getElementById('modalNovedadLabel').innerHTML = '<i class="bi bi-pencil-square me-1"></i> Editar Novedad';
            }
        } else {
            document.getElementById('novedad-codigo').value = this.generarCodigo();
            document.getElementById('novedad-fecha-apertura').value = obtenerFechaHoraActualLocal();
            document.getElementById('novedad-fecha-resolucion').value = '';
            document.getElementById('novedad-estado').value = 'Pendiente';
        }

        this.modalInstance.show();
    },

    guardar(e) {
        e.preventDefault();
        const idEdit = document.getElementById('novedad-edit-id').value;
        const codigo = document.getElementById('novedad-codigo').value;
        const titulo = document.getElementById('novedad-titulo').value.trim();
        const descripcion = document.getElementById('novedad-descripcion').value.trim();
        const departamento = document.getElementById('novedad-departamento').value;
        const reportante = document.getElementById('novedad-reportante').value.trim();
        const tecnico = document.getElementById('novedad-tecnico').value;
        const fechaApertura = document.getElementById('novedad-fecha-apertura').value;
        let fechaResolucion = document.getElementById('novedad-fecha-resolucion').value;
        const estado = document.getElementById('novedad-estado').value;

        if (estado === 'Finalizado' && !fechaResolucion) {
            fechaResolucion = obtenerFechaHoraActualLocal();
        }

        if (fechaResolucion && fechaApertura && new Date(fechaResolucion) < new Date(fechaApertura)) {
            alert('La fecha y hora de resolución no puede ser anterior a la apertura.');
            return;
        }

        let novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);

        if (idEdit) {
            novedades = novedades.map(n => {
                if (n.id === idEdit) {
                    return { ...n, titulo, descripcion, departamento, reportante, tecnico, fechaApertura, fechaResolucion, estado };
                }
                return n;
            });
        } else {
            const nueva = {
                id: 'nov-' + Date.now(),
                codigo,
                titulo,
                descripcion,
                departamento,
                reportante,
                tecnico,
                fechaApertura,
                fechaResolucion,
                estado
            };
            novedades.unshift(nueva);
        }

        StorageService.save(STORAGE_KEYS.NOVEDADES, novedades);
        this.modalInstance.hide();
        this.renderizar();
        DepartamentoController.renderizar();
        mostrarToast('Novedad guardada exitosamente.');
    },

    cambiarEstado(id, nuevoEstado) {
        let novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        const ahora = obtenerFechaHoraActualLocal();

        novedades = novedades.map(n => {
            if (n.id === id) {
                let fechaRes = n.fechaResolucion;
                if (nuevoEstado === 'Finalizado' && !fechaRes) {
                    fechaRes = ahora;
                } else if (nuevoEstado !== 'Finalizado') {
                    fechaRes = '';
                }
                return { ...n, estado: nuevoEstado, fechaResolucion: fechaRes };
            }
            return n;
        });

        StorageService.save(STORAGE_KEYS.NOVEDADES, novedades);
        this.renderizar();
        DepartamentoController.renderizar();
        mostrarToast(`Estado de novedad actualizado a "${nuevoEstado}".`);
    },

    eliminar(id) {
        const sesion = StorageService.getSesion();
        if (sesion && sesion.rol !== 'Administrador') {
            alert('Acceso denegado: Los usuarios de soporte no tienen permisos para eliminar registros.');
            return;
        }

        if (!confirm('¿Deseas eliminar definitivamente este registro de novedad?')) return;
        let novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        novedades = novedades.filter(n => n.id !== id);
        StorageService.save(STORAGE_KEYS.NOVEDADES, novedades);
        this.renderizar();
        DepartamentoController.renderizar();
        mostrarToast('Novedad eliminada.');
    },

    eliminarTodasLasNovedades() {
        const sesion = StorageService.getSesion();
        if (sesion && sesion.rol !== 'Administrador') {
            alert('Acceso denegado: Solo el Administrador puede eliminar registros.');
            return;
        }

        let novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        if (!novedades || novedades.length === 0) {
            mostrarToast('No hay registros de novedades para eliminar.', 'warning');
            return;
        }

        const confirmacion = confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los registros de Novedades?\n\nEsta acción no se puede deshacer y vaciará permanentemente la tabla.');
        if (!confirmacion) return;

        // 1. Eliminar clave en LocalStorage
        localStorage.removeItem(STORAGE_KEYS.NOVEDADES);

        // 2. Persistir arreglo vacío
        StorageService.save(STORAGE_KEYS.NOVEDADES, []);

        // 3. Renderizar vista de inmediato
        this.renderizar();
        if (typeof DepartamentoController !== 'undefined') {
            DepartamentoController.renderizar();
        }

        // 4. Notificación de confirmación
        mostrarToast('Todos los registros de novedades han sido eliminados exitosamente.', 'success');
    },

    obtenerClaseEstado(estado) {
        switch (estado) {
            case 'Pendiente': return 'estado-pendiente';
            case 'En revisión': return 'estado-revision';
            case 'Finalizado': return 'estado-finalizado';
            default: return '';
        }
    },

    renderizar() {
        const tbody = document.getElementById('tabla-novedades-body');
        if (!tbody) return;

        const filtroTexto = document.getElementById('filtro-novedades-texto').value.toLowerCase().trim();
        const filtroDepto = document.getElementById('filtro-novedades-depto').value;
        const filtroEstado = document.getElementById('filtro-novedades-estado').value;

        let novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);

        if (filtroTexto) {
            novedades = novedades.filter(n =>
                n.codigo.toLowerCase().includes(filtroTexto) ||
                n.titulo.toLowerCase().includes(filtroTexto) ||
                n.descripcion.toLowerCase().includes(filtroTexto) ||
                n.reportante.toLowerCase().includes(filtroTexto) ||
                n.tecnico.toLowerCase().includes(filtroTexto)
            );
        }

        if (filtroDepto) {
            novedades = novedades.filter(n => n.departamento === filtroDepto);
        }

        if (filtroEstado) {
            novedades = novedades.filter(n => n.estado === filtroEstado);
        }

        if (novedades.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4"><i class="bi bi-ticket-detailed me-1"></i> No se encontraron novedades registradas.</td></tr>`;
            return;
        }

        const esAdmin = (StorageService.getSesion()?.rol === 'Administrador');

        tbody.innerHTML = novedades.map(n => `
            <tr>
                <td class="fw-bold font-monospace text-primary">${n.codigo}</td>
                <td>
                    <div class="fw-semibold text-dark">${n.titulo}</div>
                    <div class="small text-muted text-truncate" style="max-width: 250px;" title="${n.descripcion}">
                        ${n.descripcion}
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">
                        <i class="bi bi-building me-1 text-primary"></i>${n.departamento || 'Sin asignar'}
                    </span>
                </td>
                <td><i class="bi bi-person me-1 text-secondary"></i>${n.reportante}</td>
                <td><i class="bi bi-headset me-1 text-info"></i><span class="fw-semibold">${n.tecnico}</span></td>
                <td class="small text-muted">${formatearFechaHora(n.fechaApertura)}</td>
                <td class="small text-muted">${formatearFechaHora(n.fechaResolucion)}</td>
                <td>
                    <select class="form-select select-estado-tabla ${this.obtenerClaseEstado(n.estado)}" 
                            onchange="NovedadController.cambiarEstado('${n.id}', this.value)">
                        <option value="Pendiente" ${n.estado === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="En revisión" ${n.estado === 'En revisión' ? 'selected' : ''}>🔍 En revisión</option>
                        <option value="Finalizado" ${n.estado === 'Finalizado' ? 'selected' : ''}>✅ Finalizado</option>
                    </select>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar" onclick="NovedadController.abrirModal('${n.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${esAdmin ? `
                    <button class="btn btn-sm btn-outline-danger" title="Eliminar" onclick="NovedadController.eliminar('${n.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }
};

