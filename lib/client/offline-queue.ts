const DB_NAME = "scresh-offline-queue";
const STORE_NAME = "actions";
const DB_VERSION = 1;

export type SerializedEntry =
  | { type: "field"; value: string }
  | { type: "file"; name: string; contentType: string; data: ArrayBuffer };

export type SerializedFormData = Record<string, SerializedEntry>;

export type QueuedAction = {
  id: string;
  actionName: string;
  payload: SerializedFormData;
  status: "pending" | "failed";
  retryCount: number;
  createdAt: number;
};

type ActionExecutor = (
  _state: unknown,
  formData: FormData,
) => Promise<unknown>;

const registry: Record<string, ActionExecutor> = {};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function serializeFormData(
  formData: FormData,
): Promise<SerializedFormData> {
  const payload: SerializedFormData = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      payload[key] = {
        type: "file",
        name: value.name,
        contentType: value.type,
        data: await value.arrayBuffer(),
      };
    } else {
      payload[key] = { type: "field", value: String(value) };
    }
  }
  return payload;
}

export function reconstructFormData(payload: SerializedFormData): FormData {
  const formData = new FormData();
  for (const [key, entry] of Object.entries(payload)) {
    if (entry.type === "file") {
      const file = new File([entry.data], entry.name, {
        type: entry.contentType,
      });
      formData.append(key, file);
    } else {
      formData.append(key, entry.value);
    }
  }
  return formData;
}

export async function enqueue(
  actionName: string,
  payload: SerializedFormData,
): Promise<void> {
  const db = await openDB();
  const action: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    actionName,
    payload,
    status: "pending",
    retryCount: 0,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(action);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPending(): Promise<QueuedAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = (request.result as QueuedAction[]).filter(
        (item) => item.status === "pending" || item.retryCount < 3,
      );
      resolve(items.sort((a, b) => a.createdAt - b.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function remove(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function markFailed(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const item = request.result as QueuedAction | undefined;
      if (!item) return resolve();
      item.status = "failed";
      item.retryCount += 1;
      const update = store.put(item);
      update.onsuccess = () => resolve();
      update.onerror = () => reject(update.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export function registerOfflineAction(name: string, action: ActionExecutor) {
  registry[name] = action;
}

function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("NEXT_REDIRECT") ||
      error.message.includes("NEXT_NOT_FOUND") ||
      error.message.includes("Redirect"))
  );
}

export async function processQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const pending = await getPending();
  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    const action = registry[item.actionName];
    if (!action) {
      await markFailed(item.id);
      failed += 1;
      continue;
    }

    const formData = reconstructFormData(item.payload);
    try {
      await action({}, formData);
      await remove(item.id);
      processed += 1;
    } catch (error) {
      if (isRedirectError(error)) {
        // Redirect means the server action succeeded on the server side.
        await remove(item.id);
        processed += 1;
        continue;
      }
      await markFailed(item.id);
      failed += 1;
    }
  }

  return { processed, failed };
}

export function withOfflineQueue<S, R>(
  actionName: string,
  action: (_state: S, formData: FormData) => Promise<R>,
): (_state: S, formData: FormData) => Promise<R | { message: string }> {
  registerOfflineAction(actionName, action as unknown as ActionExecutor);
  return async (_state, formData) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const payload = await serializeFormData(formData);
      await enqueue(actionName, payload);
      return {
        message:
          "Anda offline. Data telah disimpan dan akan dikirim otomatis saat koneksi tersedia.",
      };
    }
    return action(_state, formData);
  };
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
