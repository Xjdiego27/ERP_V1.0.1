"""permiso_service.py — Servicio POO de permisos de módulos.

Responsabilidad ÚNICA: qué submódulos puede ver cada rol/usuario.

SEPARADO del acceso a empresas:
  - Acceso a empresas → AsignacionEmp (se valida en main.py al login)
  - Permisos de módulos → permiso_accs + asignacion_accs (se gestiona aquí)

NOTA TÉCNICA:
  - asignacion_accs NO tiene PRIMARY KEY en la BD,
    por lo que SQLAlchemy automap no puede mapearla.
    Usamos text() (SQL crudo) para esa tabla.
  - permiso_accs SÍ tiene PK → se usa normalmente vía automap.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from database import PermisoAccs, RolAccs, Personal, Acceso, Contrato, Cargo, EstadoAccs, Area


class PermisoService:
    """Centraliza TODA la lógica de permisos por módulo."""

    def __init__(self, db: Session):
        self._db = db

    # ══════════════════════════════════════════════
    #  CONSULTAS
    # ══════════════════════════════════════════════

    def obtener_modulos_rol(self, id_rol: int) -> list[str]:
        """Submódulos asignados a un rol (lista de DESCRIP).
        SIEMPRE retorna list — vacía si no hay asignaciones. NUNCA None."""
        if not PermisoAccs:
            return []

        perm_ids = self._obtener_perm_ids_rol(id_rol)
        if not perm_ids:
            return []

        perms = (
            self._db.query(PermisoAccs)
            .filter(PermisoAccs.ID_PERM.in_(perm_ids))
            .all()
        )
        return [p.DESCRIP for p in perms]

    def obtener_submodulos(self) -> list[dict]:
        """Catálogo completo de submódulos (permiso_accs)."""
        if not PermisoAccs:
            return []
        return [
            {"id": p.ID_PERM, "nombre": p.DESCRIP}
            for p in self._db.query(PermisoAccs).order_by(PermisoAccs.ID_PERM).all()
        ]

    def obtener_roles_con_permisos(self) -> dict:
        """Todos los roles con sus submódulos asignados + catálogo."""
        roles = self._db.query(RolAccs).order_by(RolAccs.ID_ROL).all()
        submodulos = self.obtener_submodulos()
        asig_map = self._construir_mapa_asignaciones()

        roles_data = []
        for r in roles:
            roles_data.append({
                "id_rol": r.ID_ROL,
                "nombre": r.DESCRIP,
                "estado": getattr(r, "ESTADO_ROL", 1),
                "permisos": asig_map.get(r.ID_ROL, []),
            })

        return {"roles": roles_data, "submodulos": submodulos}

    # ══════════════════════════════════════════════
    #  MUTACIONES
    # ══════════════════════════════════════════════

    def actualizar_permisos_rol(self, id_rol: int, perm_ids: list[int]) -> dict:
        """Reemplaza TODOS los permisos de un rol."""
        rol = self._db.query(RolAccs).filter(RolAccs.ID_ROL == id_rol).first()
        if not rol:
            raise ValueError("Rol no encontrado")

        validos = self._validar_perm_ids(perm_ids)

        # Eliminar anteriores (SQL crudo — tabla sin PK)
        self._db.execute(
            text("DELETE FROM asignacion_accs WHERE ID_ROL = :rol"),
            {"rol": id_rol}
        )

        # Insertar nuevos
        for pid in validos:
            self._db.execute(
                text("INSERT INTO asignacion_accs (ID_ROL, ID_PERM) VALUES (:rol, :perm)"),
                {"rol": id_rol, "perm": pid}
            )

        self._db.commit()
        return {
            "mensaje": f"Permisos del rol {rol.DESCRIP} actualizados",
            "permisos": validos,
        }

    # ══════════════════════════════════════════════
    #  LISTADO DE PERSONAL CON PERMISOS DERIVADOS
    # ══════════════════════════════════════════════

    def listar_personal_empresa(self, id_empresa: int) -> list[dict]:
        """Personal de una empresa con permisos derivados de su rol."""
        roles_map = {r.ID_ROL: r.DESCRIP for r in self._db.query(RolAccs).all()}
        estados_map = {e.ID_ESTADO: e.DESCRIP for e in self._db.query(EstadoAccs).all()}
        areas_map = {a.ID_AREA: a.DESCRIP for a in self._db.query(Area).all()}

        asig_map = self._construir_mapa_asignaciones()
        perm_map = self._construir_mapa_permisos()

        registros = (
            self._db.query(Personal, Acceso, Contrato)
            .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
            .outerjoin(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
            .outerjoin(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(Cargo.ID_EMP == id_empresa, Contrato.ID_ESTADO_CONTRATO == 1)
            .all()
        )

        resultado = []
        for p, acceso, contrato in registros:
            ids_perm = asig_map.get(acceso.ID_ROL, [])
            modulos = [perm_map[pid] for pid in ids_perm if pid in perm_map]
            resultado.append({
                "id_personal": p.ID_PERSONAL,
                "id_accs": acceso.ID_ACCS,
                "id_rol": acceso.ID_ROL,
                "usuario": acceso.USUARIO,
                "nombre_completo": f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}",
                "foto": p.FOTO,
                "rol": roles_map.get(acceso.ID_ROL, "—"),
                "estado": estados_map.get(acceso.ID_ESTADO, "—"),
                "area": areas_map.get(contrato.ID_AREA, "—") if contrato else "—",
                "modulos": modulos,
            })

        return resultado

    # ══════════════════════════════════════════════
    #  CAMBIO DE ROL POR USUARIO
    # ══════════════════════════════════════════════

    def cambiar_rol_usuario(self, id_accs: int, nuevo_id_rol: int) -> dict:
        """Cambia el rol de un usuario individual.
        Esto modifica los módulos que puede ver (derivados del nuevo rol)."""
        acceso = self._db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
        if not acceso:
            raise ValueError("Usuario no encontrado")

        rol = self._db.query(RolAccs).filter(RolAccs.ID_ROL == nuevo_id_rol).first()
        if not rol:
            raise ValueError("Rol no encontrado")

        rol_anterior = acceso.ID_ROL
        acceso.ID_ROL = nuevo_id_rol
        self._db.commit()

        nuevos_modulos = self.obtener_modulos_rol(nuevo_id_rol)
        return {
            "mensaje": f"Rol de {acceso.USUARIO} cambiado a {rol.DESCRIP}",
            "id_accs": id_accs,
            "rol_anterior": rol_anterior,
            "nuevo_rol": nuevo_id_rol,
            "nombre_rol": rol.DESCRIP,
            "modulos": nuevos_modulos,
        }

    # ══════════════════════════════════════════════
    #  MÉTODOS PRIVADOS
    # ══════════════════════════════════════════════

    def _obtener_perm_ids_rol(self, id_rol: int) -> list[int]:
        """IDs de permiso asignados a un rol (SQL crudo)."""
        rows = self._db.execute(
            text("SELECT ID_PERM FROM asignacion_accs WHERE ID_ROL = :rol"),
            {"rol": id_rol}
        ).fetchall()
        return [row[0] for row in rows]

    def _construir_mapa_asignaciones(self) -> dict:
        """Retorna {id_rol: [id_perm, ...]} (SQL crudo)."""
        mapa = {}
        rows = self._db.execute(
            text("SELECT ID_ROL, ID_PERM FROM asignacion_accs")
        ).fetchall()
        for row in rows:
            mapa.setdefault(row[0], []).append(row[1])
        return mapa

    def _construir_mapa_permisos(self) -> dict:
        """Retorna {id_perm: DESCRIP}."""
        if not PermisoAccs:
            return {}
        return {p.ID_PERM: p.DESCRIP for p in self._db.query(PermisoAccs).all()}

    def _validar_perm_ids(self, perm_ids: list[int]) -> list[int]:
        """Filtra solo IDs que existen en permiso_accs."""
        if not PermisoAccs:
            return []
        existentes = {p.ID_PERM for p in self._db.query(PermisoAccs).all()}
        return [pid for pid in perm_ids if pid in existentes]
