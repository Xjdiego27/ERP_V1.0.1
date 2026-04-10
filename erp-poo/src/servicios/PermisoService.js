/**
 * PermisoService — Gestión de permisos de módulos (POO).
 *
 * Lógica SEPARADA del acceso a empresas:
 *   - Acceso a empresas: se valida en el backend con AsignacionEmp
 *     (tabla asignacion_emp) al momento del login/cambio de empresa.
 *   - Permisos de módulos: se controlan AQUÍ, usando la lista "modulos"
 *     que el backend devuelve en el objeto usuario al hacer login.
 *     Esa lista viene de permiso_accs + asignacion_accs (por rol).
 *
 * Uso:
 *   var sessionData = JSON.parse(localStorage.getItem('session'));
 *   var permisos = new PermisoService(sessionData);
 *   permisos.tieneAcceso('PERSONAL')  // true / false
 *   permisos.esAdmin                  // true / false
 *   permisos.filtrarMenu(items)       // filtra por modulo
 */
class PermisoService {
    /**
     * @param {Object|null} sessionData — Lo que viene de localStorage('session').
     *        Espera que sessionData.usuario.modulos sea un array de strings.
     *        Si es null/undefined, se interpreta como SIN permisos (NO como "todo").
     */
    constructor(sessionData) {
        var usuario = (sessionData && sessionData.usuario) || {};

        // ▶ CLAVE: siempre array. null/undefined → [] (sin acceso).
        //   Nunca interpretamos null como "mostrar todo".
        this._modulos = Array.isArray(usuario.modulos) ? usuario.modulos : [];
        this._rol = (usuario.rol || '').toUpperCase();
        this._idRol = usuario.id_rol || null;
    }

    // ── Verificación de acceso ──────────────────

    /**
     * ¿El usuario tiene acceso a un submódulo específico?
     * @param {string} clave — Clave DESCRIP del submódulo. Ej: 'INICIO', 'PERSONAL'.
     * @returns {boolean}
     */
    tieneAcceso(clave) {
        return this._modulos.indexOf(clave) >= 0;
    }

    /**
     * Filtra un array de items de menú dejando solo los permitidos.
     * Cada item debe tener propiedad "modulo" (string).
     * @param {Array} items
     * @returns {Array}
     */
    filtrarMenu(items) {
        var self = this;
        return items.filter(function (item) {
            return self.tieneAcceso(item.modulo);
        });
    }

    // ── Propiedades de rol ──────────────────────

    /** ¿Es ADMINISTRADOR? */
    get esAdmin() {
        return this._rol === 'ADMINISTRADOR' || this._rol === 'ADMIN';
    }

    /** ¿Es rol de TI (admin o soporte)? Para mostrar panel de tickets, etc. */
    get esRolTI() {
        return ['ADMINISTRADOR', 'ADMIN', 'SOPORTE'].indexOf(this._rol) >= 0;
    }

    /** ¿Es modo lectura? SUPERVISOR ve todo pero no puede hacer CRUD. */
    get esLectura() {
        return this._rol === 'SUPERVISOR';
    }

    /** Nombre del rol en mayúsculas. */
    get rol() {
        return this._rol;
    }

    /** ID numérico del rol. */
    get idRol() {
        return this._idRol;
    }

    /** Lista de módulos permitidos (array de strings DESCRIP). */
    get modulos() {
        return this._modulos;
    }
}

export default PermisoService;
