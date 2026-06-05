-- ================================================================
-- SASWEBS — Registro de perfiles y roles de usuario en Supabase
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ================================================================

insert into user_profiles (id, tenant_id, role, name) values
('d7c95051-c094-4a0a-9828-9518b5fc20d8', 't-main',    'super_admin', 'Super Administrador'),
('c57ab5f5-f97e-41c1-ade6-b0cf9ff4c6cc', 't-celeste', 'owner',       'Dueño Empresa'),
('bb88fb80-29cc-4079-9cca-d5ca8b210a40', 't-celeste', 'manager',     'Gerente General'),
('c08e9e83-4ac9-42b2-9bb3-4b957e440727', 't-celeste', 'pos',         'Cajero #1'),
('7bebabc7-919a-447f-9244-fdcd2949d8a5', 't-celeste', 'student',     'Alumno Demo')
on conflict (id) do update set 
  tenant_id = excluded.tenant_id,
  role = excluded.role,
  name = excluded.name;
