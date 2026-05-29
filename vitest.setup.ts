// Mock browser globals for tests (vitest runs in Node, not browser).
const store = new Map<string, string>();
const storageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (index: number) => {
    const keys = Array.from(store.keys());
    return keys[index] ?? null;
  },
};

globalThis.localStorage = storageMock;
globalThis.window = {
  localStorage: storageMock,
  location: { href: '', pathname: '/' },
  // biome-ignore lint/suspicious/noExplicitAny: minimal mock for tests
} as any;
