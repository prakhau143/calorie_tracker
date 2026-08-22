import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from '../src/config/db.js';
import { Activity } from '../src/models/activity.js';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../data/MET-values.xlsx');

const BATCH_SIZE = 1000;

function trimOrUndefined(value) {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}

function toNumberOrUndefined(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function buildSourceKey(activityName, specificMotion, metValue) {
  return `${activityName}|${specificMotion}|${Number(metValue)}`;
}

async function run() {
  await connectDB();

  const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});

  let batch = [];
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  let total = 0;

  async function flush() {
    if (batch.length === 0) return;
    const result = await Activity.bulkWrite(batch, { ordered: false });
    inserted += result.upsertedCount ?? 0;
    updated += result.modifiedCount ?? 0;
    unchanged += (result.matchedCount ?? 0) - (result.modifiedCount ?? 0);
    batch = [];
  }

  for await (const worksheet of reader) {
    for await (const row of worksheet) {
      if (row.number === 1) continue; // header

      const values = row.values; // 1-indexed, values[0] unused
      const activityName = trimOrUndefined(values[1]);
      const specificMotion = trimOrUndefined(values[2]);
      const metValue = toNumberOrUndefined(values[3]);

      total += 1;

      if (!activityName || !specificMotion || metValue === undefined) {
        skipped += 1;
        console.warn(`Skipping row ${row.number}: missing required field(s)`);
        continue;
      }

      const sourceKey = buildSourceKey(activityName, specificMotion, metValue);

      batch.push({
        updateOne: {
          filter: { sourceKey },
          update: {
            $set: {
              sourceKey,
              activityName,
              specificMotion,
              metValue,
            },
          },
          upsert: true,
        },
      });

      if (batch.length >= BATCH_SIZE) {
        await flush();
      }
    }
  }

  await flush();

  console.log('--- Activity import complete ---');
  console.log(`Rows read:     ${total}`);
  console.log(`Inserted:      ${inserted}`);
  console.log(`Updated:       ${updated}`);
  console.log(`Unchanged:     ${unchanged}`);
  console.log(`Skipped:       ${skipped}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Activity import failed:', err);
  process.exit(1);
});
