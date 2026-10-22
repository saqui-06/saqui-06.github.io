/**
 * AUTH.JS - Control Novedades
 * Autenticación, sesión activa, Usuario Master, saludo en header y control de visibilidad por roles.
 */

const AuthController = {
    modalRecuperarInstance: null,
    modalCambiarPwdInstance: null,

    init() {
        this.modalRecuperarInstance = new bootstrap.Modal(document.getElementById('modalRecuperarLogin'));
        this.modalCambiarPwdInstance = new bootstrap.Modal(document.getElementById('modalCambiarPasswordPropia'));

        document.getElementById('form-login').addEventListener('submit', (e) => this.login(e));
        document.getElementById('form-recuperar-login').addEventListener('submit', (e) => this.recuperarClaveLogin(e));
        document.getElementById('form-cambiar-password-propia').addEventListener('submit', (e) => this.cambiarPasswordPropia(e));

        this.verificarSesion();
    },

    login(e) {
        e.preventDefault();
        const userInput = document.getElementById('login-usuario').value.trim();
        const passwordInput = document.getElementById('login-password').value;

        const usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);

        const user = usuarios.find(u =>
            (u.username.toLowerCase() === userInput.toLowerCase() || u.email.toLowerCase() === userInput.toLowerCase()) &&
            u.password === passwordInput
        );

        if (!user) {
            mostrarToast('Credenciales incorrectas. Verifica tu usuario y contraseña.', 'danger');
            return;
        }

        if (user.estado !== 'Activo') {
            mostrarToast('Tu cuenta se encuentra inactiva. Contacta al administrador.', 'warning');
            return;
        }

        StorageService.saveSesion({
            id: user.id,
            nombre: user.nombre,
            username: user.username,
            email: user.email,
            rol: user.rol
        });

        document.getElementById('form-login').reset();
        this.aplicarSesion();
        mostrarToast(`¡Bienvenido/a al sistema, ${user.nombre}!`);
    },

    verificarSesion() {
        const sesion = StorageService.getSesion();
        if (sesion) {
            this.aplicarSesion();
        } else {
            this.mostrarLogin();
        }
    },

    mostrarLogin() {
        document.getElementById('vista-login').classList.remove('d-none');
        document.getElementById('vista-app').classList.add('d-none');
    },

    actualizarHeaderUsuario() {
        const sesion = StorageService.getSesion();
        if (!sesion) return;

        const userHeaderDisplay = document.getElementById('sesion-usuario-display');
        if (userHeaderDisplay) {
            userHeaderDisplay.innerHTML = `Bienvenido, <strong>${sesion.nombre}</strong> <span class="badge ${sesion.rol === 'Administrador' ? 'bg-danger' : 'bg-primary'} ms-1">${sesion.rol}</span>`;
        }

        const userEmailDisplay = document.getElementById('sesion-usuario-email');
        if (userEmailDisplay) {
            userEmailDisplay.textContent = sesion.email;
        }
    },

    aplicarSesion() {
        const sesion = StorageService.getSesion();
        if (!sesion) return;

        // Sincronizar datos más frescos desde la base de usuarios en LocalStorage
        const usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
        const usuarioFresco = usuarios.find(u => u.id === sesion.id);
        if (usuarioFresco) {
            sesion.nombre = usuarioFresco.nombre;
            sesion.email = usuarioFresco.email;
            sesion.username = usuarioFresco.username;
            sesion.rol = usuarioFresco.rol;
            StorageService.saveSesion(sesion);
        }

        // Mostrar app y ocultar login
        document.getElementById('vista-login').classList.add('d-none');
        document.getElementById('vista-app').classList.remove('d-none');

        // Identificación clara del usuario en esquina superior derecha
        this.actualizarHeaderUsuario();

        // Control de roles para visibilidad de botones
        const esAdmin = sesion.rol === 'Administrador';
        const elementosAdmin = document.querySelectorAll('.admin-only');

        elementosAdmin.forEach(el => {
            if (esAdmin) {
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        });

        // Activar la sección persistida en LocalStorage (o por defecto Novedades)
        let seccionGuardada = StorageService.getPestanaActiva();
        
        // Si no es Administrador y la sección guardada era Departamentos o Usuarios, forzar Novedades
        if (!esAdmin && (seccionGuardada === 'seccion-departamentos' || seccionGuardada === 'seccion-usuarios')) {
            seccionGuardada = 'seccion-novedades';
        }

        this.activarSeccion(seccionGuardada);

        // Renderizar tablas
        if (typeof DepartamentoController !== 'undefined') {
            DepartamentoController.renderizar();
            DepartamentoController.actualizarSelectsGlobales();
        }
        if (typeof UsuarioController !== 'undefined') {
            UsuarioController.renderizar();
            UsuarioController.actualizarSelectTecnicos();
        }
        if (typeof NovedadController !== 'undefined') {
            NovedadController.renderizar();
        }
        if (typeof EquipoController !== 'undefined') {
            EquipoController.renderizar();
        }
    },

    activarSeccion(seccionId) {
        // Persistir en LocalStorage la pestaña seleccionada actualmente
        StorageService.savePestanaActiva(seccionId);

        const navButtons = document.querySelectorAll('.nav-section-btn');
        const secciones = document.querySelectorAll('.modulo-seccion');

        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === seccionId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        secciones.forEach(sec => {
            if (sec.id === seccionId) {
                sec.classList.remove('d-none');
            } else {
                sec.classList.add('d-none');
            }
        });
    },

    cerrarSesion(e) {
        if (e) e.preventDefault();
        if (!confirm('¿Deseas cerrar tu sesión actual?')) return;
        StorageService.clearSesion();
        this.mostrarLogin();
        mostrarToast('Sesión finalizada correctamente.');
    },

    abrirModalRecuperarLogin(e) {
        if (e) e.preventDefault();
        document.getElementById('form-recuperar-login').reset();
        document.getElementById('alerta-recuperar-error').classList.add('d-none');
        document.getElementById('alerta-recuperar-exito').classList.add('d-none');
        this.modalRecuperarInstance.show();
    },

    recuperarClaveLogin(e) {
        e.preventDefault();
        const email = document.getElementById('recuperar-email').value.trim();
        const alertaError = document.getElementById('alerta-recuperar-error');
        const alertaExito = document.getElementById('alerta-recuperar-exito');
        const textoError = document.getElementById('alerta-recuperar-texto');
        const textoExito = document.getElementById('alerta-recuperar-exito-texto');

        alertaError.classList.add('d-none');
        alertaExito.classList.add('d-none');

        const usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
        const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Validación estricta de existencia en LocalStorage
        if (!user) {
            textoError.textContent = 'El correo electrónico no está registrado.';
            alertaError.classList.remove('d-none');
            return;
        }

        // Si existe: generar token de recuperación y mostrar confirmación clara
        const token = Math.floor(100000 + Math.random() * 900000);
        textoExito.innerHTML = `Instrucciones y código temporal <strong>#${token}</strong> generados y enviados exitosamente al correo <strong>${email}</strong> para el usuario <em>${user.nombre}</em>.`;
        alertaExito.classList.remove('d-none');

        mostrarToast(`Código temporal #${token} enviado exitosamente al correo ${email}.`, 'success');

        // Cerrar modal automáticamente después de 3.5 segundos tras éxito
        setTimeout(() => {
            this.modalRecuperarInstance.hide();
        }, 3500);
    },

    abrirModalCambiarPasswordPropia(e) {
        if (e) e.preventDefault();
        document.getElementById('form-cambiar-password-propia').reset();
        this.modalCambiarPwdInstance.show();
    },

    cambiarPasswordPropia(e) {
        e.preventDefault();
        const sesion = StorageService.getSesion();
        if (!sesion) return;

        const pwdActual = document.getElementById('pwd-actual').value;
        const pwdNueva = document.getElementById('pwd-nueva').value;
        const pwdConfirmar = document.getElementById('pwd-confirmar').value;

        if (pwdNueva !== pwdConfirmar) {
            alert('La nueva contraseña y su confirmación no coinciden.');
            return;
        }

        if (pwdNueva.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        let usuarios = StorageService.get(STORAGE_KEYS.USUARIOS);
        const userIndex = usuarios.findIndex(u => u.id === sesion.id);

        if (userIndex === -1) {
            alert('Error: Usuario no encontrado en los registros.');
            return;
        }

        if (usuarios[userIndex].password !== pwdActual) {
            alert('La contraseña actual ingresada es incorrecta.');
            return;
        }

        usuarios[userIndex].password = pwdNueva;
        StorageService.save(STORAGE_KEYS.USUARIOS, usuarios);

        this.modalCambiarPwdInstance.hide();
        mostrarToast('¡Tu contraseña ha sido actualizada con éxito!');
    }
};

// Navegación por pestañas
function inicializarNavegacion() {
    const navButtons = document.querySelectorAll('.nav-section-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const sesion = StorageService.getSesion();

            // Blindaje si el rol no es administrador
            if (sesion && sesion.rol !== 'Administrador') {
                if (targetId === 'seccion-departamentos' || targetId === 'seccion-usuarios') {
                    mostrarToast('Acceso denegado: Sección reservada para el Administrador.', 'danger');
                    return;
                }
            }

            AuthController.activarSeccion(targetId);

            const navbarMain = document.getElementById('navbarMain');
            if (navbarMain && navbarMain.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarMain);
                if (bsCollapse) bsCollapse.hide();
            }
        });
    });
}

