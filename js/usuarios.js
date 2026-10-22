/**
 * USUARIOS.JS - Control Novedades
 * CRUD de Usuarios, asignación de roles (Administrador / Soporte) y forzado de reseteo de claves (Solo Administrador)
 */

const UsuarioController = {
    modalInstance: null,

    init() {
        this.modalInstance = new bootstrap.Modal(document.getElementById('modalUsuario'));
        document.getElementById('form-usuario').addEventListener('submit', (e) => this.guardar(e));
        document.getElementById('filtro-usuarios-texto').addEventListener('input', () => this.renderizar());
        document.getElementById('filtro-usuarios-rol').addEventListener('change', () => this.renderizar());
        this.renderizar();
        this.actualizarSelectTecnicos();
    },

    abrirModal(id = null) {
        const form = document.getElementById('form-usuario');
        form.reset();
        document.getElementById('usuario-edit-id').value = '';
        document.getElementById('modalUsuarioLabel').innerHTML = '<i class="bi bi-person-circle me-1"></i> Registrar Usuario';

        const pwdReq = document.getElementById('usuario-pwd-req');
        const pwdHelp = document.getElementById('usuario-pwd-help');

        if (id) {
            const usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
            const u = usuarios.find(usr => usr.id === id);
            if (u) {
                document.getElementById('usuario-edit-id').value = u.id;
                document.getElementById('usuario-cedula').value = u.cedula;
                document.getElementById('usuario-nombre').value = u.nombre;
                document.getElementById('usuario-username').value = u.username;
                document.getElementById('usuario-email').value = u.email;
                document.getElementById('usuario-rol').value = u.rol;
                document.getElementById('usuario-estado').value = u.estado;

                document.getElementById('usuario-password').value = '';
                document.getElementById('usuario-password').required = false;
                if (pwdReq) pwdReq.classList.add('d-none');
                if (pwdHelp) pwdHelp.textContent = 'Dejar vacío para conservar la contraseña actual.';
                document.getElementById('modalUsuarioLabel').innerHTML = '<i class="bi bi-pencil-square me-1"></i> Editar Usuario';
            }
        } else {
            document.getElementById('usuario-password').required = true;
            if (pwdReq) pwdReq.classList.remove('d-none');
            if (pwdHelp) pwdHelp.textContent = 'Contraseña inicial para el usuario.';
        }

        this.modalInstance.show();
    },

    guardar(e) {
        e.preventDefault();
        const idEdit = document.getElementById('usuario-edit-id').value;
        const cedula = document.getElementById('usuario-cedula').value.trim();
        const username = document.getElementById('usuario-username').value.trim().toLowerCase();
        const nombre = document.getElementById('usuario-nombre').value.trim();
        const email = document.getElementById('usuario-email').value.trim().toLowerCase();
        const passwordInput = document.getElementById('usuario-password').value;
        const rol = document.getElementById('usuario-rol').value;
        const estado = document.getElementById('usuario-estado').value;

        let usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);

        const usernameExiste = usuarios.some(u => u.username.toLowerCase() === username && u.id !== idEdit);
        if (usernameExiste) {
            alert('El nombre de usuario ya está registrado. Ingresa uno diferente.');
            return;
        }

        const cedulaExiste = usuarios.some(u => u.cedula === cedula && u.id !== idEdit);
        if (cedulaExiste) {
            alert('Ya existe un usuario con este ID/Cédula.');
            return;
        }

        if (idEdit) {
            usuarios = usuarios.map(u => {
                if (u.id === idEdit) {
                    return {
                        ...u,
                        cedula,
                        username,
                        nombre,
                        email,
                        rol,
                        estado,
                        password: passwordInput ? passwordInput : u.password
                    };
                }
                return u;
            });
        } else {
            const nuevo = {
                id: 'usr-' + Date.now(),
                cedula,
                username,
                nombre,
                email,
                password: passwordInput,
                rol,
                estado
            };
            usuarios.push(nuevo);
        }

        StorageService.save(STORAGE_KEYS.USUARIOS, usuarios);

        // Si el usuario modificado es el mismo que tiene la sesión activa, actualizar la sesión en tiempo real
        const sesionActual = StorageService.getSesion();
        if (sesionActual && sesionActual.id === idEdit) {
            StorageService.saveSesion({
                ...sesionActual,
                cedula,
                username,
                nombre,
                email,
                rol
            });
            if (typeof AuthController !== 'undefined') {
                AuthController.actualizarHeaderUsuario();
            }
        }

        this.modalInstance.hide();
        this.renderizar();
        this.actualizarSelectTecnicos();
        mostrarToast('Usuario guardado exitosamente.');
    },

    eliminar(id) {
        let usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
        const usuarioAEliminar = usuarios.find(u => u.id === id);

        if (!usuarioAEliminar) {
            mostrarToast('Usuario no encontrado.', 'warning');
            return;
        }

        // Restricción explícita: No se debe permitir eliminar al usuario administrador principal yfsaquicela2
        if (usuarioAEliminar.username.toLowerCase() === 'yfsaquicela2' || id === 'usr-master') {
            alert('Acción denegada: No se puede eliminar al usuario administrador principal (yfsaquicela2).');
            return;
        }

        const sesion = StorageService.getSesion();
        if (sesion && sesion.id === id) {
            alert('No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.');
            return;
        }

        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${usuarioAEliminar.nombre}" (${usuarioAEliminar.username})?`)) {
            return;
        }

        usuarios = usuarios.filter(u => u.id !== id);
        StorageService.save(STORAGE_KEYS.USUARIOS, usuarios);
        this.renderizar();
        this.actualizarSelectTecnicos();
        mostrarToast(`Usuario "${usuarioAEliminar.nombre}" eliminado correctamente.`);
    },

    eliminarUsuario(id) {
        this.eliminar(id);
    },

    forzarRestablecimientoClave(id) {
        let usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
        const u = usuarios.find(usr => usr.id === id);
        if (!u) return;

        const claveTemporal = 'Clave*' + Math.floor(1000 + Math.random() * 9000);
        u.password = claveTemporal;
        StorageService.save(STORAGE_KEYS.USUARIOS, usuarios);

        mostrarToast(`Clave restablecida para ${u.nombre}. Nueva clave temporal: ${claveTemporal} (Simulado envío a ${u.email}).`, 'warning');
    },

    actualizarSelectTecnicos() {
        const usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
        const selTecnico = document.getElementById('novedad-tecnico');
        if (!selTecnico) return;

        const valActual = selTecnico.value;
        selTecnico.innerHTML = '<option value="">Seleccione personal...</option>';

        // Técnicos o administradores que se encuentren activos
        const personal = usuarios.filter(u => u.estado === 'Activo');
        personal.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.nombre;
            opt.textContent = `${u.nombre} (${u.rol})`;
            selTecnico.appendChild(opt);
        });

        selTecnico.value = valActual;
    },

    renderizar() {
        const tbody = document.getElementById('tabla-usuarios-body');
        if (!tbody) return;

        const filtroTexto = document.getElementById('filtro-usuarios-texto').value.toLowerCase().trim();
        const filtroRol = document.getElementById('filtro-usuarios-rol').value;

        let usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);

        if (filtroTexto) {
            usuarios = usuarios.filter(u =>
                u.cedula.toLowerCase().includes(filtroTexto) ||
                u.username.toLowerCase().includes(filtroTexto) ||
                u.nombre.toLowerCase().includes(filtroTexto) ||
                u.email.toLowerCase().includes(filtroTexto)
            );
        }

        if (filtroRol) {
            usuarios = usuarios.filter(u => u.rol === filtroRol);
        }

        if (usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-people me-1"></i> No se encontraron usuarios.</td></tr>`;
            return;
        }

        tbody.innerHTML = usuarios.map(u => {
            const esMaster = (u.username.toLowerCase() === 'yfsaquicela2' || u.id === 'usr-master');
            return `
            <tr>
                <td class="font-monospace text-secondary fw-semibold">${u.cedula}</td>
                <td class="fw-bold">${u.nombre}</td>
                <td><code class="text-primary">${u.username}</code></td>
                <td><a href="mailto:${u.email}" class="text-decoration-none text-muted">${u.email}</a></td>
                <td>
                    <span class="badge ${u.rol === 'Administrador' ? 'bg-danger text-white' : 'bg-primary text-white'}">
                        <i class="bi ${u.rol === 'Administrador' ? 'bi-shield-lock' : 'bi-headset'} me-1"></i>${u.rol}
                    </span>
                </td>
                <td>
                    <span class="badge ${u.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">
                        ${u.estado}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-warning text-dark me-1" title="🔑 Restablecer Clave" onclick="UsuarioController.forzarRestablecimientoClave('${u.id}')">
                        <i class="bi bi-key-fill text-warning"></i> Restablecer Clave
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar" onclick="UsuarioController.abrirModal('${u.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${esMaster ? `
                    <button class="btn btn-sm btn-outline-secondary" disabled title="El usuario principal no puede eliminarse">
                        <i class="bi bi-shield-slash"></i>
                    </button>
                    ` : `
                    <button class="btn btn-sm btn-outline-danger" title="🗑️ Eliminar Usuario" onclick="UsuarioController.eliminar('${u.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    `}
                </td>
            </tr>
            `;
        }).join('');
    }
};

