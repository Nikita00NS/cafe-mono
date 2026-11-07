import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DEFAULT_SETTINGS, type Order, type Settings } from './types';

type DBShape = {
  orders: Order[];
  settings: Settings;
  seq: number;
};

const DATA_DIR = process.env.MONO_DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

type Store = {
  data: DBShape;
  ready: Promise<void>;
  chain: Promise<unknown>;
};

const globalStore = globalThis as typeof globalThis & { __monoStore?: Store };

function emptyDb(): DBShape {
  return { orders: [], settings: { ...DEFAULT_SETTINGS }, seq: 1000 };
}

async function readFromDisk(): Promise<DBShape> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DBShape>;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      seq: typeof parsed.seq === 'number' ? parsed.seq : 1000,
    };
  } catch {
    return emptyDb();
  }
}

async function writeToDisk(data: DBShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, DB_PATH);
}

function store(): Store {
  if (!globalStore.__monoStore) {
    const next: Store = {
      data: emptyDb(),
      ready: Promise.resolve(),
      chain: Promise.resolve(),
    };
    next.ready = readFromDisk().then((data) => {
      next.data = data;
    });
    globalStore.__monoStore = next;
  }
  return globalStore.__monoStore;
}

/** Чтение без записи на диск. */
export async function readDb<T>(fn: (data: DBShape) => T): Promise<T> {
  const s = store();
  await s.ready;
  return fn(s.data);
}

/** Чтение + изменение + сохранение. Операции сериализуются в рамках процесса. */
export async function withDb<T>(fn: (data: DBShape) => T | Promise<T>): Promise<T> {
  const s = store();
  await s.ready;
  let result!: T;
  const run = s.chain.then(async () => {
    result = await fn(s.data);
    await writeToDisk(s.data);
  });
  s.chain = run.catch(() => undefined);
  await run;
  return result;
}

export async function listOrders(): Promise<Order[]> {
  return readDb((db) =>
    [...db.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 300),
  );
}

export async function findOrder(id: string): Promise<Order | undefined> {
  return readDb((db) => db.orders.find((order) => order.id === id));
}

export async function findOrderByNumber(number: string): Promise<Order | undefined> {
  return readDb((db) =>
    db.orders.find((order) => order.number.toLowerCase() === number.toLowerCase()),
  );
}

export async function getSettings(): Promise<Settings> {
  return readDb((db) => ({ ...db.settings }));
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  return withDb((db) => {
    db.settings = { ...db.settings, ...patch };
    return { ...db.settings };
  });
}
