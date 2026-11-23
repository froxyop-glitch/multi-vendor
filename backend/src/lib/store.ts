import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seedData';

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export type DatabaseSchema = ReturnType<typeof getInitialSeedData>;

class MemoryStore {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
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
      console.error('Failed to write db.json:', err);
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
