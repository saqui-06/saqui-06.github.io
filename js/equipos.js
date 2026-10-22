/**
 * EQUIPOS.JS - Control Novedades
 * CRUD de Equipos con problemas asociados a Departamentos (Administrador y Soporte)
 */

const EquipoController = {
    modalInstance: null,

    init() {
        this.modalInstance = new bootstrap.Modal(document.getElementById('modalEquipo'));
        document.getElementById('form-equipo').addEventListener('submit', (e) => this.guardar(e));
        document.getElementById('filtro-equipos-texto').addEventListener('input', () => this.renderizar());
        document.getElementById('filtro-equipos-depto').addEventListener('change', () => this.renderizar());
        document.getElementById('filtro-equipos-estado').addEventListener('change', () => this.renderizar());
        this.renderizar();
    },

    abrirModal(id = null) {
        const form = document.getElementById('form-equipo');
        form.reset();
        DepartamentoController.actualizarSelectsGlobales();

        document.getElementById('equipo-edit-id').value = '';
        document.getElementById('modalEquipoLabel').innerHTML = '<i class="bi bi-pc me-1"></i> Registrar Equipo con Problemas';

        if (id) {
            const equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);
            const eq = equipos.find(e => e.id === id);
            if (eq) {
                document.getElementById('equipo-edit-id').value = eq.id;
                document.getElementById('equipo-serie').value = eq.serie;
                document.getElementById('equipo-tipo').value = eq.tipo;
                document.getElementById('equipo-marca-modelo').value = eq.marcaModelo;
                document.getElementById('equipo-departamento').value = eq.departamento;
                document.getElementById('equipo-falla').value = eq.falla;
                document.getElementById('equipo-estado').value = eq.estado;
                document.getElementById('modalEquipoLabel').innerHTML = '<i class="bi bi-pencil-square me-1"></i> Editar Equipo';
            }
        }
        this.modalInstance.show();
    },

    guardar(e) {
        e.preventDefault();
        const idEdit = document.getElementById('equipo-edit-id').value;
        const serie = document.getElementById('equipo-serie').value.trim();
        const tipo = document.getElementById('equipo-tipo').value;
        const marcaModelo = document.getElementById('equipo-marca-modelo').value.trim();
        const departamento = document.getElementById('equipo-departamento').value;
        const falla = document.getElementById('equipo-falla').value.trim();
        const estado = document.getElementById('equipo-estado').value;

        let equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);

        if (idEdit) {
            equipos = equipos.map(eq => {
                if (eq.id === idEdit) {
                    return { ...eq, serie, tipo, marcaModelo, departamento, falla, estado };
                }
                return eq;
            });
        } else {
            const nuevo = {
                id: 'eq-' + Date.now(),
                serie,
                tipo,
                marcaModelo,
                departamento,
                falla,
                estado
            };
            equipos.push(nuevo);
        }

        StorageService.save(STORAGE_KEYS.EQUIPOS, equipos);
        this.modalInstance.hide();
        this.renderizar();
        DepartamentoController.renderizar();
        mostrarToast('Equipo guardado exitosamente.');
    },

    eliminar(id) {
        const sesion = StorageService.getSesion();
        if (sesion && sesion.rol !== 'Administrador') {
            alert('Acceso denegado: Los usuarios de soporte no tienen permisos para eliminar registros.');
            return;
        }

        if (!confirm('¿Deseas eliminar el registro de este equipo?')) return;
        let equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);
        equipos = equipos.filter(e => e.id !== id);
        StorageService.save(STORAGE_KEYS.EQUIPOS, equipos);
        this.renderizar();
        DepartamentoController.renderizar();
        mostrarToast('Registro de equipo eliminado.');
    },

    eliminarTodosLosEquipos() {
        const sesion = StorageService.getSesion();
        if (sesion && sesion.rol !== 'Administrador') {
            alert('Acceso denegado: Solo el Administrador puede eliminar registros.');
            return;
        }

        let equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);
        if (!equipos || equipos.length === 0) {
            mostrarToast('No hay registros de equipos para eliminar.', 'warning');
            return;
        }

        const confirmacion = confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los registros de Equipos?\n\nEsta acción no se puede deshacer y vaciará permanentemente la tabla.');
        if (!confirmacion) return;

        // 1. Eliminar clave en LocalStorage
        localStorage.removeItem(STORAGE_KEYS.EQUIPOS);

        // 2. Persistir arreglo vacío
        StorageService.save(STORAGE_KEYS.EQUIPOS, []);

        // 3. Renderizar vista de inmediato
        this.renderizar();
        if (typeof DepartamentoController !== 'undefined') {
            DepartamentoController.renderizar();
        }

        // 4. Notificación de confirmación
        mostrarToast('Todos los registros de equipos han sido eliminados exitosamente.', 'success');
    },

    cambiarEstado(id, nuevoEstado) {
        let equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);
        equipos = equipos.map(eq => {
            if (eq.id === id) {
                return { ...eq, estado: nuevoEstado };
            }
            return eq;
        });
        StorageService.save(STORAGE_KEYS.EQUIPOS, equipos);
        this.renderizar();
        if (typeof DepartamentoController !== 'undefined') DepartamentoController.renderizar();
        mostrarToast(`Estado de equipo actualizado a "${nuevoEstado}".`);
    },

    obtenerClaseEstadoSelect(estado) {
        switch (estado) {
            case 'En taller': return 'estado-pendiente';
            case 'Reemplazado': return 'estado-revision';
            case 'Operativo': return 'estado-finalizado';
            default: return '';
        }
    },

    obtenerBadgeEstado(estado) {
        switch (estado) {
            case 'En taller': return 'bg-warning text-dark';
            case 'Reemplazado': return 'bg-danger text-white';
            case 'Operativo': return 'bg-success text-white';
            default: return 'bg-secondary';
        }
    },

    renderizar() {
        const tbody = document.getElementById('tabla-equipos-body');
        if (!tbody) return;

        const filtroTexto = document.getElementById('filtro-equipos-texto').value.toLowerCase().trim();
        const filtroDepto = document.getElementById('filtro-equipos-depto').value;
        const filtroEstado = document.getElementById('filtro-equipos-estado').value;

        let equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);

        if (filtroTexto) {
            equipos = equipos.filter(e =>
                e.serie.toLowerCase().includes(filtroTexto) ||
                e.tipo.toLowerCase().includes(filtroTexto) ||
                e.marcaModelo.toLowerCase().includes(filtroTexto) ||
                e.falla.toLowerCase().includes(filtroTexto)
            );
        }

        if (filtroDepto) {
            equipos = equipos.filter(e => e.departamento === filtroDepto);
        }

        if (filtroEstado) {
            equipos = equipos.filter(e => e.estado === filtroEstado);
        }

        if (equipos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-pc me-1"></i> No se encontraron equipos registrados.</td></tr>`;
            return;
        }

        const esAdmin = (StorageService.getSesion()?.rol === 'Administrador');

        tbody.innerHTML = equipos.map(eq => `
            <tr>
                <td class="fw-bold font-monospace text-secondary">${eq.serie}</td>
                <td><span class="badge bg-light text-dark border">${eq.tipo}</span></td>
                <td class="fw-semibold">${eq.marcaModelo}</td>
                <td><i class="bi bi-building text-primary me-1"></i>${eq.departamento || 'Sin asignar'}</td>
                <td class="text-truncate" style="max-width: 250px;" title="${eq.falla}">${eq.falla}</td>
                <td style="min-width: 165px;">
                    <select class="form-select select-estado-tabla ${this.obtenerClaseEstadoSelect(eq.estado)}" 
                            onchange="EquipoController.cambiarEstado('${eq.id}', this.value)">
                        <option value="En taller" ${eq.estado === 'En taller' ? 'selected' : ''}>⚠️ En taller</option>
                        <option value="Reemplazado" ${eq.estado === 'Reemplazado' ? 'selected' : ''}>🔄 Reemplazado</option>
                        <option value="Operativo" ${eq.estado === 'Operativo' ? 'selected' : ''}>✅ Operativo</option>
                    </select>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar" onclick="EquipoController.abrirModal('${eq.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${esAdmin ? `
                    <button class="btn btn-sm btn-outline-danger" title="Eliminar" onclick="EquipoController.eliminar('${eq.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }
};

