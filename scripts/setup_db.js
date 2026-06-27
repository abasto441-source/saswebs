/**
 * NRAM360 — Setup Script
 * Ejecuta todos los archivos SQL en orden usando la Supabase Management API
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://nopmtqnxpslhvecsplxe.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcG10cW54cHNsaHZlY3NwbHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY4ODI4OSwiZXhwIjoyMDk2MjY0Mjg5fQ.HhWQq08Xk4G60UeGAsUEbsWZ4R8UTzj80dj5mk-e_ss";
const PROJECT_REF = "nopmtqnxpslhvecsplxe";

const SQL_FILES = [
  { file: "supabase/schema.sql",                                    name: "Schema base (20 tablas)" },
  { file: "supabase/seed.sql",                                      name: "Seed data (tenants, productos, cursos)" },
  { file: "supabase/migrations/20260627000000_rbac_enterprise.sql", name: "RBAC Enterprise (roles, permissions)" },
  { file: "supabase/migrations/20260627000001_rbac_seed.sql",       name: "RBAC Seed (permisos y roles iniciales)" },
  { file: "supabase/assign_roles.sql",                              name: "Asignar roles a usuarios reales" },
];

async function executeSQL(sql, fileName) {
  try {
    // Try Supabase Management API first
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return { success: true, method: "management-api", data };
    }

    // Fallback: try PostgREST SQL endpoint (Supabase >= v12)
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res2.ok) {
      return { success: true, method: "postgrest-sql" };
    }

    const errText = await res2.text();
    return { success: false, error: errText, status: res2.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Split SQL into individual statements (skip comments and empty lines)
function splitSQL(sql) {
  // Remove block comments /* ... */
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove line comments
  sql = sql.replace(/--.*$/gm, "");
  // Split by semicolon and clean up
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

async function runAllFiles() {
  console.log("\n🚀 NRAM360 — Configuración de Base de Datos Supabase");
  console.log("=".repeat(55));
  console.log(`📡 Proyecto: ${PROJECT_REF}`);
  console.log(`🌐 URL: ${SUPABASE_URL}\n`);

  let totalStatements = 0;
  let totalErrors = 0;

  for (const { file, name } of SQL_FILES) {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, "utf8");
    const statements = splitSQL(sql);

    console.log(`\n📄 ${name}`);
    console.log(`   Archivo: ${file}`);
    console.log(`   Statements: ${statements.length}`);

    let fileErrors = 0;
    let fileOk = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\s+/g, " ");
      
      process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}... `);
      
      const result = await executeSQL(stmt, file);
      
      if (result.success) {
        process.stdout.write(`✅\n`);
        fileOk++;
      } else {
        // Some errors are expected (IF NOT EXISTS, ON CONFLICT, etc.)
        const errStr = String(result.error || "").toLowerCase();
        if (
          errStr.includes("already exists") ||
          errStr.includes("duplicate") ||
          errStr.includes("does not exist") && errStr.includes("constraint")
        ) {
          process.stdout.write(`⚠️  (ya existe, ok)\n`);
          fileOk++;
        } else {
          process.stdout.write(`❌\n`);
          console.log(`      Error: ${result.error}`);
          fileErrors++;
        }
      }
      
      totalStatements++;
    }

    console.log(`   ✅ Exitosos: ${fileOk} | ❌ Errores: ${fileErrors}`);
    totalErrors += fileErrors;
  }

  console.log("\n" + "=".repeat(55));
  console.log(`📊 RESUMEN FINAL`);
  console.log(`   Total statements: ${totalStatements}`);
  console.log(`   Errores críticos: ${totalErrors}`);
  console.log(totalErrors === 0 ? "\n🎉 ¡Base de datos configurada correctamente!" : "\n⚠️  Hay errores que revisar");
  console.log("=".repeat(55) + "\n");
}

runAllFiles().catch(console.error);
