-- ─── SIMSAS · Migración inicial ───────────────────────────────────────────────

-- Roles válidos
CREATE TYPE rol_usuario AS ENUM ('coordinador', 'junta', 'contratista', 'equipo');

-- Estados de registro
CREATE TYPE estado_registro AS ENUM ('pendiente', 'validado', 'rechazado');

-- Tipos de registro
CREATE TYPE tipo_registro AS ENUM ('conectado', 'adecuacion');

-- ─── LOCALIDADES ──────────────────────────────────────────────────────────────
CREATE TABLE localidades (
  id            VARCHAR(50)  PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  previstas     INTEGER      NOT NULL DEFAULT 0,
  conectados    INTEGER      NOT NULL DEFAULT 0,  -- línea base (antes del sistema)
  adecuaciones  INTEGER      NOT NULL DEFAULT 0,  -- línea base
  ci            INTEGER      NOT NULL DEFAULT 0,  -- conexiones internas construidas
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── USUARIOS ─────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id             VARCHAR(50)  PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL,
  rol            rol_usuario  NOT NULL,
  rol_nombre     VARCHAR(150),
  password_hash  VARCHAR(255) NOT NULL,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Localidades asignadas a cada usuario (null = todas)
CREATE TABLE usuario_localidades (
  usuario_id   VARCHAR(50) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  localidad_id VARCHAR(50) NOT NULL REFERENCES localidades(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, localidad_id)
);

-- ─── MODALIDADES ──────────────────────────────────────────────────────────────
CREATE TABLE modalidades (
  id      VARCHAR(50)  PRIMARY KEY,
  nombre  VARCHAR(200) NOT NULL,
  cat     VARCHAR(30)  NOT NULL,  -- JUNTA | CONTRATISTA | ICARO
  activo  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Roles permitidos por modalidad
CREATE TABLE modalidad_roles (
  modalidad_id  VARCHAR(50) NOT NULL REFERENCES modalidades(id) ON DELETE CASCADE,
  rol           rol_usuario NOT NULL,
  PRIMARY KEY (modalidad_id, rol)
);

-- ─── REGISTROS ────────────────────────────────────────────────────────────────
CREATE SEQUENCE registros_seq START 1;

CREATE TABLE registros (
  id             VARCHAR(20)      PRIMARY KEY,
  localidad_id   VARCHAR(50)      NOT NULL REFERENCES localidades(id),
  tipo           tipo_registro    NOT NULL,
  modalidad_id   VARCHAR(50)      NOT NULL REFERENCES modalidades(id),
  titular        VARCHAR(200)     NOT NULL,
  ci             VARCHAR(30)      NOT NULL,
  celular        VARCHAR(30),
  manzana        VARCHAR(20)      NOT NULL,
  lote           VARCHAR(20)      NOT NULL,
  fecha_ejec     DATE             NOT NULL,
  fecha_carga    TIMESTAMP        NOT NULL DEFAULT NOW(),
  estado         estado_registro  NOT NULL DEFAULT 'pendiente',
  cargado_por    VARCHAR(50)      NOT NULL REFERENCES usuarios(id),
  evidencia_url  VARCHAR(500),
  observaciones  TEXT,
  updated_at     TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda frecuente
CREATE INDEX idx_registros_localidad  ON registros(localidad_id);
CREATE INDEX idx_registros_estado     ON registros(estado);
CREATE INDEX idx_registros_cargado    ON registros(cargado_por);
CREATE INDEX idx_registros_ci         ON registros(ci);

-- ─── HISTORIAL DE ESTADOS ─────────────────────────────────────────────────────
CREATE TABLE historial_registros (
  id           SERIAL           PRIMARY KEY,
  registro_id  VARCHAR(20)      NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  estado       estado_registro  NOT NULL,
  fecha        TIMESTAMP        NOT NULL DEFAULT NOW(),
  por          VARCHAR(50)      NOT NULL REFERENCES usuarios(id),
  comentario   TEXT
);

CREATE INDEX idx_historial_registro ON historial_registros(registro_id);

-- ─── PROYECCIONES ICARO ───────────────────────────────────────────────────────
CREATE TABLE icaro_proyecciones (
  id            SERIAL       PRIMARY KEY,
  localidad_id  VARCHAR(50)  NOT NULL REFERENCES localidades(id) ON DELETE CASCADE,
  modalidad     VARCHAR(100) NOT NULL,
  cantidad      INTEGER      NOT NULL DEFAULT 0
);
