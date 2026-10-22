/**
 * DEPARTAMENTOS.JS - Control Novedades
 * CRUD de Departamentos Institucionales (Solo Administrador)
 */

const DepartamentoController = {
    modalInstance: null,

    init() {
        this.modalInstance = new bootstrap.Modal(document.getElementById('modalDepartamento'));
        document.getElementById('form-departamento').addEventListener('submit', (e) => this.guardar(e));
        document.getElementById('filtro-deptos-texto').addEventListener('input', () => this.renderizar());
        this.renderizar();
        this.actualizarSelectsGlobales();
    },

    abrirModal(id = null) {
        const form = document.getElementById('form-departamento');
        form.reset();
        document.getElementById('depto-edit-id').value = '';
        document.getElementById('modalDepartamentoLabel').innerHTML = '<i class="bi bi-building-add me-1"></i> Nuevo Departamento';

        if (id) {
            const deptos = StorageService.get(STORAGE_KEYS.DEPARTAMENTOS);
            const dep = deptos.find(d => d.id === id);
            if (dep) {
                document.getElementById('depto-edit-id').value = dep.id;
                document.getElementById('depto-nombre').value = dep.nombre;
                document.getElementById('modalDepartamentoLabel').innerHTML = '<i class="bi bi-pencil-square me-1"></i> Editar Departamento';
            }
        }
        this.modalInstance.show();
    },

    guardar(e) {
        e.preventDefault();
        const idEdit = document.getElementById('depto-edit-id').value;
        const nombre = document.getElementById('depto-nombre').value.trim();

        if (!nombre) return;

        let deptos = StorageService.get(STORAGE_KEYS.DEPARTAMENTOS);
        const existe = deptos.some(d => d.nombre.toLowerCase() === nombre.toLowerCase() && d.id !== idEdit);
        if (existe) {
            alert('Ya existe un departamento registrado con ese nombre.');
            return;
        }

        if (idEdit) {
            const depAnterior = deptos.find(d => d.id === idEdit);
            const nombreAnterior = depAnterior ? depAnterior.nombre : '';

            deptos = deptos.map(d => (d.id === idEdit ? { ...d, nombre } : d));

            if (nombreAnterior && nombreAnterior !== nombre) {
                this.actualizarCascada(nombreAnterior, nombre);
            }
        } else {
            const nuevo = { id: 'dep-' + Date.now(), nombre };
            deptos.push(nuevo);
        }

        StorageService.save(STORAGE_KEYS.DEPARTAMENTOS, deptos);
        this.modalInstance.hide();
        this.renderizar();
        this.actualizarSelectsGlobales();
        if (typeof NovedadController !== 'undefined') NovedadController.renderizar();
        if (typeof EquipoController !== 'undefined') EquipoController.renderizar();
        mostrarToast('Departamento guardado exitosamente.');
    },

    actualizarCascada(nombreViejo, nombreNuevo) {
        let novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        novedades = novedades.map(nov => {
            if (nov.departamento === nombreViejo) nov.departamento = nombreNuevo;
            return nov;
        });
        StorageService.save(STORAGE_KEYS.NOVEDADES, novedades);

        let equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);
        equipos = equipos.map(eq => {
            if (eq.departamento === nombreViejo) eq.departamento = nombreNuevo;
            return eq;
        });
        StorageService.save(STORAGE_KEYS.EQUIPOS, equipos);
    },

    eliminar(id) {
        let deptos = StorageService.get(STORAGE_KEYS.DEPARTAMENTOS);
        const dep = deptos.find(d => d.id === id);
        if (!dep) return;

        const novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        const tieneNov = novedades.some(n => n.departamento === dep.nombre);

        const equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);
        const tieneEq = equipos.some(e => e.departamento === dep.nombre);

        if (tieneNov || tieneEq) {
            if (!confirm(`El departamento "${dep.nombre}" tiene novedades o equipos asociados. ¿Deseas eliminarlo de todas formas?`)) {
                return;
            }
        } else {
            if (!confirm(`¿Deseas eliminar el departamento "${dep.nombre}"?`)) return;
        }

        deptos = deptos.filter(d => d.id !== id);
        StorageService.save(STORAGE_KEYS.DEPARTAMENTOS, deptos);
        this.renderizar();
        this.actualizarSelectsGlobales();
        mostrarToast('Departamento eliminado correctamente.');
    },

    actualizarSelectsGlobales() {
        const deptos = StorageService.get(STORAGE_KEYS.DEPARTAMENTOS);

        // Desplegable en modal de Novedades
        const selNovDepto = document.getElementById('novedad-departamento');
        if (selNovDepto) {
            const actual = selNovDepto.value;
            selNovDepto.innerHTML = '<option value="">Seleccione departamento...</option>';
            deptos.forEach(d => {
                selNovDepto.innerHTML += `<option value="${d.nombre}">${d.nombre}</option>`;
            });
            selNovDepto.value = actual;
        }

        // Filtro en tabla de Novedades
        const filNovDepto = document.getElementById('filtro-novedades-depto');
        if (filNovDepto) {
            const actual = filNovDepto.value;
            filNovDepto.innerHTML = '<option value="">Todos los Departamentos</option>';
            deptos.forEach(d => {
                filNovDepto.innerHTML += `<option value="${d.nombre}">${d.nombre}</option>`;
            });
            filNovDepto.value = actual;
        }

        // Desplegable en modal de Equipos
        const selEqDepto = document.getElementById('equipo-departamento');
        if (selEqDepto) {
            const actual = selEqDepto.value;
            selEqDepto.innerHTML = '<option value="">Seleccione departamento...</option>';
            deptos.forEach(d => {
                selEqDepto.innerHTML += `<option value="${d.nombre}">${d.nombre}</option>`;
            });
            selEqDepto.value = actual;
        }

        // Filtro en tabla de Equipos
        const filEqDepto = document.getElementById('filtro-equipos-depto');
        if (filEqDepto) {
            const actual = filEqDepto.value;
            filEqDepto.innerHTML = '<option value="">Todos los Departamentos</option>';
            deptos.forEach(d => {
                filEqDepto.innerHTML += `<option value="${d.nombre}">${d.nombre}</option>`;
            });
            filEqDepto.value = actual;
        }
    },

    renderizar() {
        const tbody = document.getElementById('tabla-departamentos-body');
        if (!tbody) return;

        const filtroTexto = document.getElementById('filtro-deptos-texto').value.toLowerCase().trim();
        let deptos = StorageService.get(STORAGE_KEYS.DEPARTAMENTOS);
        const novedades = StorageService.get(STORAGE_KEYS.NOVEDADES);
        const equipos = StorageService.get(STORAGE_KEYS.EQUIPOS);

        if (filtroTexto) {
            deptos = deptos.filter(d => d.nombre.toLowerCase().includes(filtroTexto));
        }

        if (deptos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-buildings me-1"></i> No se encontraron departamentos registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = deptos.map((d, index) => {
            const totalNov = novedades.filter(n => n.departamento === d.nombre).length;
            const novActivas = novedades.filter(n => n.departamento === d.nombre && n.estado !== 'Finalizado').length;
            const totalEq = equipos.filter(e => e.departamento === d.nombre).length;

            return `
                <tr>
                    <td class="text-muted fw-semibold">${index + 1}</td>
                    <td class="fw-bold text-dark"><i class="bi bi-building text-primary me-2"></i>${d.nombre}</td>
                    <td>
                        <span class="badge ${novActivas > 0 ? 'bg-warning text-dark' : 'bg-light text-muted border'}">
                            ${novActivas} activa(s)
                        </span>
                    </td>
                    <td><span class="badge bg-secondary">${totalNov} total</span></td>
                    <td><span class="badge bg-info text-white">${totalEq} equipo(s)</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" title="Editar" onclick="DepartamentoController.abrirModal('${d.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Eliminar" onclick="DepartamentoController.eliminar('${d.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
};

