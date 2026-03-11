import os
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pydantic_settings import BaseSettings 

load_dotenv()


class Settings(BaseSettings):
    db_user: str = os.getenv('DB_USER')
    db_password: str = os.getenv('DB_PASSWORD')
    db_host: str = os.getenv('DB_HOST')
    db_port: str = os.getenv('DB_PORT')
    db_name: str = os.getenv('DB_NAME')

    secret_key: str = os.getenv('SECRET_KEY')
    algorithm: str = os.getenv('ALGORITHM')
    access_token_expire_minutes: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))

settings = Settings()


# ──────────────────────────────────────────
# BD PRINCIPAL: ERP (personal, contratos, etc.)
# ──────────────────────────────────────────
DATABASE_URL = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = automap_base()
Base.prepare(autoload_with=engine)

# ── Modelos ERP principales ──
Acceso = Base.classes.acceso
Empresa = Base.classes.empresa
Personal = Base.classes.personal
Contrato = Base.classes.contrato
Contacto = Base.classes.contacto
Area = Base.classes.area
Cargo = Base.classes.cargo
Documento = Base.classes.documento
EstadoAccs = Base.classes.estado_accs
EstadoContrato = Base.classes.estado_contrato if hasattr(Base.classes, 'estado_contrato') else None
Departamento = Base.classes.departamento
TipoContrato = Base.classes.tipo_contrato
EstadoCivil = Base.classes.estado_civil
GradoAcademico = Base.classes.grado_academico
Distrito = Base.classes.distrito
AFP = Base.classes.afp
Banco = Base.classes.banco
Moneda = Base.classes.moneda
RolAccs = Base.classes.rol_accs
TipoFamiliar = Base.classes.tipo_familiar
SegurosAportaciones = Base.classes.seguros_aportaciones
CuentaBanca = Base.classes.cuenta_banca
TipoCuenta = Base.classes.tipo_cuenta
Modalidad = Base.classes.modalidad if hasattr(Base.classes, 'modalidad') else None

# Modelos de documentos laborales (tabla "anexos" en BD)
Anexos = Base.classes.anexos if hasattr(Base.classes, 'anexos') else None
TipoDocumentoLab = Base.classes.tipo_documento if hasattr(Base.classes, 'tipo_documento') else None
MotivoDoc = Base.classes.motivo if hasattr(Base.classes, 'motivo') else None

# Modelos de asistencia (tabla "catg_asistencia" en BD)
Horario = Base.classes.horario if hasattr(Base.classes, 'horario') else None
HorarioDetalle = Base.classes.horario_detalle if hasattr(Base.classes, 'horario_detalle') else None
CatgAsistencia = Base.classes.catg_asistencia if hasattr(Base.classes, 'catg_asistencia') else None

# Tabla de asignación usuario → empresa (login multi-empresa)
AsignacionEmp = Base.classes.asignacion_emp if hasattr(Base.classes, 'asignacion_emp') else None

# ── Permisos y roles ──
PermisoAccs = Base.classes.permiso_accs if hasattr(Base.classes, 'permiso_accs') else None
# NOTA: asignacion_accs NO tiene PRIMARY KEY, automap no puede mapearla.
# Se accede via SQL crudo (text()) en PermisoService.

# ── Tickets de soporte ──
Ticket = Base.classes.ticket if hasattr(Base.classes, 'ticket') else None
CategoriaTicket = Base.classes.categoria_ticket if hasattr(Base.classes, 'categoria_ticket') else None
SubcategoriaTicket = Base.classes.subcategoria_ticket if hasattr(Base.classes, 'subcategoria_ticket') else None

# ── Modelos de equipos IT ──
Equipo = Base.classes.equipo if hasattr(Base.classes, 'equipo') else None
TipoEquipo = Base.classes.tipo_equipo if hasattr(Base.classes, 'tipo_equipo') else None
EstadoEquipo = Base.classes.estado_equipo if hasattr(Base.classes, 'estado_equipo') else None
Gama = Base.classes.gama if hasattr(Base.classes, 'gama') else None
Marca = Base.classes.marca if hasattr(Base.classes, 'marca') else None
Modelo = Base.classes.modelo if hasattr(Base.classes, 'modelo') else None
Procesador = Base.classes.procesador if hasattr(Base.classes, 'procesador') else None
TipoRam = Base.classes.tipo_ram if hasattr(Base.classes, 'tipo_ram') else None
Ram = Base.classes.ram if hasattr(Base.classes, 'ram') else None
TipoDisco = Base.classes.tipo_disco if hasattr(Base.classes, 'tipo_disco') else None
CapacidadDisco = Base.classes.capacidad_disco if hasattr(Base.classes, 'capacidad_disco') else None
Disco = Base.classes.disco if hasattr(Base.classes, 'disco') else None
EspecificacionesTec = Base.classes.especificaciones_tec if hasattr(Base.classes, 'especificaciones_tec') else None
Almacenamiento = Base.classes.almacenamiento if hasattr(Base.classes, 'almacenamiento') else None
AsignacionEquipo = Base.classes.asignacion_equipo if hasattr(Base.classes, 'asignacion_equipo') else None
Licencia = Base.classes.licencia if hasattr(Base.classes, 'licencia') else None
AsignacionLicencia = Base.classes.asignacion_licencia if hasattr(Base.classes, 'asignacion_licencia') else None
Mantenimiento = Base.classes.mantenimiento if hasattr(Base.classes, 'mantenimiento') else None
Red = Base.classes.red if hasattr(Base.classes, 'red') else None

# ── Chips / telefonía ──
Chips = Base.classes.chips if hasattr(Base.classes, 'chips') else None
PlanChips = Base.classes.plan_chips if hasattr(Base.classes, 'plan_chips') else None
OperadorChips = Base.classes.operador_chips if hasattr(Base.classes, 'operador_chips') else None
DescuentoChips = Base.classes.descuento_chips if hasattr(Base.classes, 'descuento_chips') else None
AsignacionChip = Base.classes.asignacion_chip if hasattr(Base.classes, 'asignacion_chip') else None

# ── SAP ──
FamiliaSap = Base.classes.familia_sap if hasattr(Base.classes, 'familia_sap') else None
SubfamiliaSap = Base.classes.subfamilia_sap if hasattr(Base.classes, 'subfamilia_sap') else None
MarcaSap = Base.classes.marca_sap if hasattr(Base.classes, 'marca_sap') else None
ModeloSap = Base.classes.modelo_sap if hasattr(Base.classes, 'modelo_sap') else None
GrupoArticulos = Base.classes.grupo_articulos if hasattr(Base.classes, 'grupo_articulos') else None
TipoUnidad = Base.classes.tipo_unidad if hasattr(Base.classes, 'tipo_unidad') else None
TipoSocioNegocio = Base.classes.tipo_socio_negocio if hasattr(Base.classes, 'tipo_socio_negocio') else None
SapArticulo = Base.classes.sap_articulo if hasattr(Base.classes, 'sap_articulo') else None
SapServicio = Base.classes.sap_servicio if hasattr(Base.classes, 'sap_servicio') else None
SapSocioNegocio = Base.classes.sap_socio_negocio if hasattr(Base.classes, 'sap_socio_negocio') else None


# ──────────────────────────────────────────
# Generador de sesión
# ──────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()