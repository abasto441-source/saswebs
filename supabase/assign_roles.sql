-- ================================================================
-- SASWEBS — Registro de perfiles y roles de usuario en Supabase
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ================================================================

insert into user_profiles (id, tenant_id, role, name) values
('b6057d63-feb5-43e9-bca7-13afd60c73c3', 't-main',    'super_admin', 'Super Administrador'),
('d3daa7b7-3cc1-48be-a5a7-ecda7152b19f', 't-celeste', 'owner',       'Dueño Empresa Celeste'),
('b8f0ac69-c51d-47c5-a4bd-77155d383e33', 't-celeste', 'manager',     'Gerente Celeste'),
('a7b86adf-8199-4cde-92aa-acddedb7eca3', 't-celeste', 'pos',         'Cajero Celeste'),
('a004a216-835a-4479-b7dc-e16a9e6cf074', 't-celeste', 'student',     'Alumno Celeste')
on conflict (id) do update set 
  tenant_id = excluded.tenant_id,
  role = excluded.role,
  name = excluded.name;
