import { db } from '../src/lib/db';

async function main() {
  const id = process.argv[2];
  if (!id) { console.log('MISSING_ID'); process.exit(0); }
  const s = await db.intakeSubmission.findUnique({
    where: { id },
    select: { ai_confidence: true },
  });
  console.log(s?.ai_confidence === null ? 'None' : String(s?.ai_confidence));
  await db.$disconnect();
}
main().catch(() => { console.log('ERROR'); process.exit(0); });
