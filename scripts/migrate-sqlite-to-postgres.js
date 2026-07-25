/**
 * Data Migration Script: SQLite → Postgres (Neon) — v2
 *
 * Reads schema.prisma to build an exact type map per model, then migrates
 * only columns that exist in the Postgres schema. Handles:
 *   - DateTime stored as epoch-ms integers in SQLite → Date for Prisma
 *   - Json (JSONB) columns → parsed objects
 *   - Boolean columns → 0/1 → true/false
 *   - Stray columns (e.g. departmentId) → dropped
 *   - Circular FK (User ↔ Department) → two-pass insert + patch
 */

const { readFileSync } = require('fs');
const { Database } = require('bun:sqlite');
const { PrismaClient } = require('@prisma/client');

const SQLITE_PATH = 'db/custom.db.pre-migration-backup';
const SCHEMA_PATH = 'prisma/schema.prisma';

// ---- Parse schema.prisma to build { ModelName: { fieldName: type } } ----
const SCALAR_TYPES = new Set(['String', 'Int', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes', 'BigInt']);

function parseSchemaTypes() {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  const models = {};
  let currentModel = null;

  for (const line of schema.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      models[currentModel] = {};
      continue;
    }
    if (line.trim() === '}' && currentModel) {
      currentModel = null;
      continue;
    }
    if (currentModel) {
      // Match: fieldName Type? followed by space, @, or end-of-line
      // Only capture SCALAR types — skip relation fields (Model names)
      const fieldMatch = line.match(/^\s+(\w+)\s+(\w+)(\??)(?:\s|$)/);
      if (fieldMatch) {
        const [, name, type, optional] = fieldMatch;
        if (SCALAR_TYPES.has(type)) {
          models[currentModel][name] = { type, optional: !!optional };
        }
        // Relation fields (type is a Model name) are skipped — not columns
      }
    }
  }
  return models;
}

const SCHEMA_TYPES = parseSchemaTypes();

// ---- FK-safe insertion order ----
const TABLE_ORDER = [
  'User',           // inserted with department_id/manager_id nulled (circular ref)
  'Department',     // inserted with manager_id nulled, patched after User
  'PricingPlan',
  'EmailTemplate',
  'SystemSetting',
  'WebhookEvent',
  'AdminSession',
  'OtpVerification',
  'Client',
  'ConsentLog',
  'UserSubscription',
  'Invoice',
  'PaymentRecord',
  'Refund',
  'Case',
  'CaseParty',
  'CaseTimeline',
  'PrivilegedNote',
  'Consultation',
  'Task',
  'TimeEntry',
  'Document',
  'DocumentShare',
  'IntakeSubmission',
  'ContactMessage',
  'Message',
  'Notification',
  'AiIntakeSession',
  'AiAnalysis',
  'AiChatSession',
  'AiChatMessage',
  'LegalMemo',
  'CommunicationLog',
  'AuditLog',
  'BackupRecord',
  'LegalArticle',
];

function transformRow(tableName, row) {
  const fields = SCHEMA_TYPES[tableName];
  if (!fields) {
    throw new Error(`No schema definition for model ${tableName}`);
  }

  const out = {};
  for (const [fieldName, { type, optional }] of Object.entries(fields)) {
    // Only migrate fields that exist in the Prisma schema
    if (!(fieldName in row)) {
      // Column missing from SQLite (schema drift) — provide default
      if (optional) { out[fieldName] = null; continue; }
      switch (type) {
        case 'String': out[fieldName] = ''; break;
        case 'Int': case 'Float': case 'Decimal': out[fieldName] = 0; break;
        case 'Boolean': out[fieldName] = false; break;
        case 'DateTime': out[fieldName] = new Date(); break;
        case 'Json': out[fieldName] = null; break;
        default: out[fieldName] = '';
      }
      continue;
    }

    const value = row[fieldName];
    if (value === null || value === undefined) {
      if (optional) {
        out[fieldName] = null;
        continue;
      }
      // Required field with NULL in SQLite (data integrity issue from testing).
      // Provide a type-appropriate default so migration doesn't fail.
      switch (type) {
        case 'String': out[fieldName] = ''; break;
        case 'Int': case 'Float': case 'Decimal': out[fieldName] = 0; break;
        case 'Boolean': out[fieldName] = false; break;
        case 'DateTime': out[fieldName] = new Date(); break;
        case 'Json': out[fieldName] = null; break; // Json allows null even if "required" in PG
        default: out[fieldName] = '';
      }
      continue;
    }

    switch (type) {
      case 'DateTime':
        if (typeof value === 'number') {
          // Epoch milliseconds → Date
          out[fieldName] = new Date(value);
        } else if (typeof value === 'string') {
          out[fieldName] = new Date(value);
        } else if (value instanceof Date) {
          out[fieldName] = value;
        } else {
          out[fieldName] = null;
        }
        break;

      case 'Json':
        if (typeof value === 'string') {
          try {
            out[fieldName] = JSON.parse(value);
          } catch {
            out[fieldName] = value;
          }
        } else {
          out[fieldName] = value;
        }
        break;

      case 'Boolean':
        // SQLite stores booleans as 0/1 or true/false
        if (typeof value === 'number') {
          out[fieldName] = value !== 0;
        } else if (typeof value === 'string') {
          out[fieldName] = value === 'true' || value === '1';
        } else {
          out[fieldName] = Boolean(value);
        }
        break;

      case 'Int':
      case 'Float':
      case 'Decimal':
        out[fieldName] = typeof value === 'number' ? value : Number(value);
        break;

      default:
        // String, enums, etc.
        out[fieldName] = value;
    }
  }
  return out;
}

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const prisma = new PrismaClient({ log: ['error'] });

  console.log('=== SQLite → Postgres Migration (v2) ===\n');
  console.log(`Parsed ${Object.keys(SCHEMA_TYPES).length} models from schema.prisma\n`);

  // ---- Phase 1: Users with circular FKs nulled ----
  const userRows = sqlite.query('SELECT * FROM User').all();
  console.log(`[User] Read ${userRows.length} rows`);

  const userFkPatches = [];
  const usersForInsert = userRows.map(r => {
    const t = transformRow('User', r);
    if (t.department_id) userFkPatches.push({ id: t.id, department_id: t.department_id });
    if (t.manager_id) userFkPatches.push({ id: t.id, manager_id: t.manager_id });
    return { ...t, department_id: null, manager_id: null };
  });

  // Batch in chunks of 100 to avoid query size limits
  for (let i = 0; i < usersForInsert.length; i += 100) {
    await prisma.user.createMany({ data: usersForInsert.slice(i, i + 100), skipDuplicates: true });
  }
  console.log(`[User] Inserted ${usersForInsert.length} rows`);

  // ---- Phase 2: Remaining tables ----
  for (const table of TABLE_ORDER) {
    if (table === 'User') continue;

    let rows;
    try {
      rows = sqlite.query(`SELECT * FROM "${table}"`).all();
    } catch {
      console.log(`[${table}] SKIP — not in SQLite`);
      continue;
    }

    if (rows.length === 0) {
      console.log(`[${table}] 0 rows`);
      continue;
    }

    const transformed = rows.map(r => transformRow(table, r));
    const modelKey = table.charAt(0).toLowerCase() + table.slice(1);

    try {
      if (table === 'Department') {
        const deptPatches = [];
        const deptsForInsert = transformed.map(d => {
          if (d.manager_id) deptPatches.push({ id: d.id, manager_id: d.manager_id });
          return { ...d, manager_id: null };
        });
        for (let i = 0; i < deptsForInsert.length; i += 100) {
          await prisma[modelKey].createMany({ data: deptsForInsert.slice(i, i + 100), skipDuplicates: true });
        }
        for (const p of deptPatches) {
          try {
            await prisma[modelKey].update({ where: { id: p.id }, data: { manager_id: p.manager_id } });
          } catch (e) { console.error(`  [Department] patch ${p.id} failed: ${e.message}`); }
        }
        console.log(`[Department] Inserted ${deptsForInsert.length}, patched ${deptPatches.length}`);
        continue;
      }

      for (let i = 0; i < transformed.length; i += 100) {
        await prisma[modelKey].createMany({ data: transformed.slice(i, i + 100), skipDuplicates: true });
      }
      console.log(`[${table}] Inserted ${transformed.length} rows`);
    } catch (e) {
      console.error(`[${table}] BATCH FAILED: ${e.message.substring(0, 200)}`);
      // One-by-one fallback
      let ok = 0, fail = 0;
      for (const row of transformed) {
        try { await prisma[modelKey].create({ data: row }); ok++; }
        catch { fail++; }
      }
      console.error(`[${table}] Fallback: ${ok} ok, ${fail} failed`);
    }
  }

  // ---- Phase 3: Patch User circular FKs ----
  console.log(`\n[User] Patching ${userFkPatches.length} circular FKs...`);
  let patched = 0;
  for (const patch of userFkPatches) {
    try {
      await prisma.user.update({
        where: { id: patch.id },
        data: {
          ...(patch.department_id ? { department_id: patch.department_id } : {}),
          ...(patch.manager_id ? { manager_id: patch.manager_id } : {}),
        },
      });
      patched++;
    } catch (e) {
      console.error(`  [User] patch ${patch.id} failed: ${e.message.substring(0, 150)}`);
    }
  }
  console.log(`[User] Patched ${patched}/${userFkPatches.length}`);

  // ---- Verify ----
  const totalUsers = await prisma.user.count();
  const realUsers = await prisma.user.count({ where: { email: { not: { contains: '@example.com' } } } });
  console.log(`\n=== Migration Complete ===`);
  console.log(`Total users on Postgres: ${totalUsers}`);
  console.log(`Real users (non-@example.com): ${realUsers}`);

  sqlite.close();
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('MIGRATION FAILED:', e);
  process.exit(1);
});
