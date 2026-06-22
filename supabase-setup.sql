-- ── TABLA DE ABONADOS ─────────────────────────────────────────────────────────
-- Importa aquí los datos del Excel del Villarreal CF
-- Columnas requeridas: numero_abonado (texto), tipo_problema (entero, null = no afectado)

create table abonados (
  id bigint generated always as identity primary key,
  numero_abonado text not null unique,
  tipo_problema int  -- null = no afectado, 1-4 = tipo de problema con el asiento
);

create index on abonados (numero_abonado);

alter table abonados enable row level security;
-- Sin políticas RLS: solo el service key puede acceder (el frontend usa service key en el servidor)

-- ── TABLA DE CONSENTIMIENTOS (RGPD) ──────────────────────────────────────────
-- Registro legal de cada consentimiento dado o denegado

create table consentimientos (
  id bigint generated always as identity primary key,
  numero_abonado text not null,
  aceptado boolean not null,
  texto_consentimiento text not null,
  ip text,
  created_at timestamptz not null default now()
);

create index on consentimientos (numero_abonado);
create index on consentimientos (created_at);

alter table consentimientos enable row level security;

-- ── DATOS DE PRUEBA ───────────────────────────────────────────────────────────
insert into abonados (numero_abonado, tipo_problema) values
  ('12345', 1),  -- zona remodelada, asiento alternativo
  ('23456', 2),  -- asiento desaparece, prioridad de elección
  ('34567', 3),  -- cambio de acceso
  ('45678', 4),  -- sector cerrado temporalmente
  ('56789', null); -- no afectado
