import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seedData';

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = path.resolve(__dirname, '../../data/db.json');
const DATA_DIR = isVercel ? '/tmp' : path.resolve(__dirname, '../../data');
const DB_FILE = isVercel ? path.join('/tmp', 'db.json') : BUNDLED_DB_FILE;

export type DatabaseSchema = ReturnType<typeof getInitialSeedData>;

class MemoryStore {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[MemoryStore] Could not create DATA_DIR:', err);
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
      // If on Vercel and /tmp/db.json not found, try reading bundled file
      if (isVercel && fs.existsSync(BUNDLED_DB_FILE)) {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.saveData(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load existing db.json, generating fresh seed data...');
    }
    const initial = getInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DatabaseSchema) {
    if (data) this.data = data;
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[MemoryStore] Notice: write to db.json skipped or failed (safe in serverless mode):', (err as any)?.message || err);
    }
  }

  public resetToSeed() {
    this.data = getInitialSeedData();
    this.saveData();
    return this.data;
  }

  public getData(): DatabaseSchema {
    return this.data;
  }
}

export const store = new MemoryStore();
