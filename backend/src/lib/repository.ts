import { v4 as uuidv4 } from 'uuid';
import { store, DatabaseSchema } from './store';

type CollectionKey = keyof DatabaseSchema;

export class CollectionRepository<T extends { id?: string; [key: string]: any }> {
  constructor(private collectionKey: CollectionKey) {}

  private getItems(): T[] {
    return (store.getData()[this.collectionKey] as unknown as T[]) || [];
  }

  private matchCondition(item: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      const condition = where[key];
      const val = item[key];

      if (key === 'OR' && Array.isArray(condition)) {
        const anyMatch = condition.some((c) => this.matchCondition(item, c));
        if (!anyMatch) return false;
        continue;
      }

      if (key === 'AND' && Array.isArray(condition)) {
        const allMatch = condition.every((c) => this.matchCondition(item, c));
        if (!allMatch) return false;
        continue;
      }

      if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
        if ('equals' in condition) {
          if (val !== condition.equals) return false;
        } else if ('contains' in condition) {
          const str = String(val || '').toLowerCase();
          const target = String(condition.contains).toLowerCase();
          if (!str.includes(target)) return false;
        } else if ('in' in condition && Array.isArray(condition.in)) {
          if (!condition.in.includes(val)) return false;
        } else if ('gte' in condition) {
          if (val < condition.gte) return false;
        } else if ('lte' in condition) {
          if (val > condition.lte) return false;
        } else if ('gt' in condition) {
          if (val <= condition.gt) return false;
        } else if ('lt' in condition) {
          if (val >= condition.lt) return false;
        } else if ('not' in condition) {
          if (val === condition.not) return false;
        }
      } else {
        if (val !== condition) return false;
      }
    }
    return true;
  }

  async findMany(args?: {
    where?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
    include?: any;
  }): Promise<T[]> {
    let items = [...this.getItems()];
    if (args?.where) {
      items = items.filter((item) => this.matchCondition(item, args.where));
    }

    if (args?.orderBy) {
      const orderKeys = Object.keys(args.orderBy);
      if (orderKeys.length > 0) {
        const key = orderKeys[0];
        const dir = args.orderBy[key] === 'desc' ? -1 : 1;
        items.sort((a: any, b: any) => {
          if (a[key] > b[key]) return dir;
          if (a[key] < b[key]) return -dir;
          return 0;
        });
      }
    }

    if (typeof args?.skip === 'number') {
      items = items.slice(args.skip);
    }
    if (typeof args?.take === 'number') {
      items = items.slice(0, args.take);
    }

    return items;
  }

  async findUnique(args: { where: any; include?: any }): Promise<T | null> {
    const items = this.getItems();
    const item = items.find((i) => this.matchCondition(i, args.where)) || null;
    return item;
  }

  async findFirst(args?: { where?: any; orderBy?: any; include?: any }): Promise<T | null> {
    const list = await this.findMany({ ...args, take: 1 });
    return list[0] || null;
  }

  async create(args: { data: any }): Promise<T> {
    const items = this.getItems();
    const newItem: any = {
      id: args.data.id || uuidv4(),
      created_at: args.data.created_at || new Date().toISOString(),
      ...args.data,
    };
    items.push(newItem);
    store.saveData();
    return newItem;
  }

  async update(args: { where: any; data: any }): Promise<T> {
    const items = this.getItems();
    const index = items.findIndex((i) => this.matchCondition(i, args.where));
    if (index === -1) {
      throw new Error(`Record not found in ${String(this.collectionKey)}`);
    }
    items[index] = {
      ...items[index],
      ...args.data,
      updated_at: new Date().toISOString(),
    };
    store.saveData();
    return items[index];
  }

  async delete(args: { where: any }): Promise<T> {
    const items = this.getItems();
    const index = items.findIndex((i) => this.matchCondition(i, args.where));
    if (index === -1) {
      throw new Error(`Record not found in ${String(this.collectionKey)}`);
    }
    const [deleted] = items.splice(index, 1);
    store.saveData();
    return deleted;
  }

  async deleteMany(args?: { where?: any }): Promise<{ count: number }> {
    let items = this.getItems();
    if (!args?.where) {
      const count = items.length;
      (store.getData()[this.collectionKey] as any) = [];
      store.saveData();
      return { count };
    }
    const initialLen = items.length;
    const remaining = items.filter((item) => !this.matchCondition(item, args.where));
    (store.getData()[this.collectionKey] as any) = remaining;
    store.saveData();
    return { count: initialLen - remaining.length };
  }

  async upsert(args: { where: any; create: any; update: any }): Promise<T> {
    const existing = await this.findFirst({ where: args.where });
    if (existing) {
      return this.update({ where: args.where, data: args.update });
    }
    return this.create({ data: args.create });
  }

  async count(args?: { where?: any }): Promise<number> {
    const list = await this.findMany({ where: args?.where });
    return list.length;
  }
}
