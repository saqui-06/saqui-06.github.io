/**
 * STORAGE.JS - Control Novedades
 * Persistencia en LocalStorage, inicialización de datos por defecto (Usuario Master y Departamentos) y helpers CRUD.
 */

const STORAGE_KEYS = {
    USUARIOS: 'cn_usuarios_v4',
    DEPARTAMENTOS: 'cn_departamentos_v4',
    NOVEDADES: 'cn_novedades_v4',
    EQUIPOS: 'cn_equipos_v4',
    SESION_ACTIVA: 'cn_sesion_activa_v4',
    PESTANA_ACTIVA: 'cn_pestana_activa_v4'
};

const StorageService = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    getSesion() {
        const s = localStorage.getItem(STORAGE_KEYS.SESION_ACTIVA);
        return s ? JSON.parse(s) : null;
    },

    saveSesion(usuario) {
        localStorage.setItem(STORAGE_KEYS.SESION_ACTIVA, JSON.stringify(usuario));
    },

    clearSesion() {
        localStorage.removeItem(STORAGE_KEYS.SESION_ACTIVA);
    },

    getPestanaActiva() {
        return localStorage.getItem(STORAGE_KEYS.PESTANA_ACTIVA) || 'seccion-novedades';
    },

    savePestanaActiva(seccionId) {
        localStorage.setItem(STORAGE_KEYS.PESTANA_ACTIVA, seccionId);
    },

    inicializarDatos() {
        // 1. Departamentos iniciales obligatorios
        if (!localStorage.getItem(STORAGE_KEYS.DEPARTAMENTOS)) {
            const deptosIniciales = [
                { id: 'dep-1', nombre: 'Coordinación FASSS' },
                { id: 'dep-2', nombre: 'Coordinación FACES' },
                { id: 'dep-3', nombre: 'Coordinación de Laboratorio' },
                { id: 'dep-4', nombre: 'Caja' },
                { id: 'dep-5', nombre: 'Bienestar Estudiantil' },
                { id: 'dep-6', nombre: 'Asuntos Estudiantiles' }
            ];
            this.save(STORAGE_KEYS.DEPARTAMENTOS, deptosIniciales);
        }

        // 2. Usuarios por defecto (con Usuario Master)
        if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
            const usuariosIniciales = [
                {
                    id: 'usr-master',
                    cedula: '0912345678',
                    nombre: 'Fabrizzio Saquicela',
                    username: 'yfsaquicela2',
                    email: 'yfsaquicela2@institucion.edu',
                    password: 'Fabrizzio17*',
                    rol: 'Administrador',
                    estado: 'Activo'
                },
                {
                    id: 'usr-soporte-1',
                    cedula: '0923456789',
                    nombre: 'Laura Paredes',
                    username: 'lparedes',
                    email: 'lparedes@institucion.edu',
                    password: 'Soporte123*',
                    rol: 'Soporte',
                    estado: 'Activo'
                },
                {
                    id: 'usr-soporte-2',
                    cedula: '0934567890',
                    nombre: 'Fernando Ruiz',
                    username: 'fruiz',
                    email: 'fruiz@institucion.edu',
                    password: 'Soporte123*',
                    rol: 'Soporte',
                    estado: 'Activo'
                }
            ];
            this.save(STORAGE_KEYS.USUARIOS, usuariosIniciales);
        }

        // 3. Novedades / Incidencias iniciales
        if (!localStorage.getItem(STORAGE_KEYS.NOVEDADES)) {
            const novedadesIniciales = [
                {
                    id: 'nov-1',
                    codigo: 'NOV-1001',
                    titulo: 'Impresora térmica de caja con atasco',
                    descripcion: 'El equipo arroja error continuo en el rodillo de salida de tickets.',
                    departamento: 'Caja',
                    reportante: 'Gabriela Silva',
                    tecnico: 'Laura Paredes',
                    fechaApertura: '2026-10-20T08:30',
                    fechaResolucion: '2026-10-20T11:45',
                    estado: 'Finalizado'
                },
                {
                    id: 'nov-2',
                    codigo: 'NOV-1002',
                    titulo: 'Interrupción de conexión de red LAN',
                    descripcion: 'Laboratorio 3 sin asignación IP dinámica por servidor DHCP.',
                    departamento: 'Coordinación de Laboratorio',
                    reportante: 'Prof. Mario Duarte',
                    tecnico: 'Fernando Ruiz',
                    fechaApertura: '2026-10-21T07:15',
                    fechaResolucion: '',
                    estado: 'En revisión'
                },
                {
                    id: 'nov-3',
                    codigo: 'NOV-1003',
                    titulo: 'Fallo al consultar fichas de matrícula',
                    descripcion: 'Ventanilla de atención no puede cargar turnos prioritarios.',
                    departamento: 'Asuntos Estudiantiles',
                    reportante: 'Ing. Sandra Vera',
                    tecnico: 'Fabrizzio Saquicela',
                    fechaApertura: '2026-10-21T09:00',
                    fechaResolucion: '',
                    estado: 'Pendiente'
                }
            ];
            this.save(STORAGE_KEYS.NOVEDADES, novedadesIniciales);
        }

        // 4. Equipos iniciales
        if (!localStorage.getItem(STORAGE_KEYS.EQUIPOS)) {
            const equiposIniciales = [
                {
                    id: 'eq-1',
                    serie: 'SN-HP-9921',
                    tipo: 'Impresora',
                    marcaModelo: 'HP LaserJet Pro M404n',
                    departamento: 'Caja',
                    falla: 'Rodillo de tracción desgastado',
                    estado: 'Operativo'
                },
                {
                    id: 'eq-2',
                    serie: 'SN-LEN-4412',
                    tipo: 'Laptop',
                    marcaModelo: 'Lenovo ThinkPad T14',
                    departamento: 'Bienestar Estudiantil',
                    falla: 'Batería inflada y recalentamiento',
                    estado: 'En taller'
                },
                {
                    id: 'eq-3',
                    serie: 'SN-CSCO-2960',
                    tipo: 'Switch/Router',
                    marcaModelo: 'Cisco Catalyst 2960',
                    departamento: 'Coordinación de Laboratorio',
                    falla: 'Puertos 1 al 8 intermitentes',
                    estado: 'En taller'
                }
            ];
            this.save(STORAGE_KEYS.EQUIPOS, equiposIniciales);
        }
    }
};

// Utilidades globales
function mostrarToast(mensaje, tipo = 'success') {
    const toastEl = document.getElementById('toastNotificacion');
    const toastMensaje = document.getElementById('toastMensaje');
    const toastIcono = document.getElementById('toastIcono');

    if (!toastEl || !toastMensaje) return;

    toastMensaje.textContent = mensaje;

    if (tipo === 'success') {
        toastEl.className = 'toast align-items-center text-white bg-success border-0 shadow-lg';
        toastIcono.className = 'bi bi-check-circle-fill fs-4';
    } else if (tipo === 'warning') {
        toastEl.className = 'toast align-items-center text-dark bg-warning border-0 shadow-lg';
        toastIcono.className = 'bi bi-exclamation-triangle-fill fs-4';
    } else {
        toastEl.className = 'toast align-items-center text-white bg-danger border-0 shadow-lg';
        toastIcono.className = 'bi bi-x-circle-fill fs-4';
    }

    const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });
    bsToast.show();
}

function formatearFechaHora(isoString) {
    if (!isoString) return '<span class="text-muted small">No registrada</span>';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function obtenerFechaHoraActualLocal() {
    const ahora = new Date();
    const tzOffset = ahora.getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
}

