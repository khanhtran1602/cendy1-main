import { defaults, type Schema, tryParse, tryStringify } from '@/state/persisted/schema';
import { device } from '@/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type PersistedApi } from './types';

export { defaults } from '@/state/persisted/schema';
export type { PersistedAccount, Schema } from '@/state/persisted/schema';

const CENDY_STORAGE = 'CENDY_STORAGE';

let _state: Schema = defaults;

export async function init() {
  const stored = await readFromStorage();
  if (stored) {
    _state = stored;
  }
}
init satisfies PersistedApi['init'];

export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key];
}
get satisfies PersistedApi['get'];

export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  _state = { ..._state, [key]: value }; 
  await writeToStorage(_state);
}
write satisfies PersistedApi['write'];

export function onUpdate<K extends keyof Schema>(
  _key: K,
  _cb: (v: Schema[K]) => void,
): () => void {
  return () => {};
}
onUpdate satisfies PersistedApi['onUpdate'];

export async function clearStorage() {
  try {
    await AsyncStorage.removeItem(CENDY_STORAGE);
    device.removeAll();
  } catch (e: any) {
    console.error(`persisted store: failed to clear`, {message: e.toString()});
  }
}
clearStorage satisfies PersistedApi['clearStorage'];

async function writeToStorage(value: Schema) {
  const rawData = tryStringify(value);
  if (rawData) {
    try {
      await AsyncStorage.setItem(CENDY_STORAGE, rawData);
    } catch (e) {
      console.error(`persisted state: failed writing root state to storage`, {
        message: e,
      });
    }
  }
}

async function readFromStorage(): Promise<Schema | undefined> {
  let rawData: string | null = null;
  try {
    rawData = await AsyncStorage.getItem(CENDY_STORAGE);
  } catch (e) {
    console.error(`persisted state: failed reading root state from storage`, {
      message: e,
    });
  }
  if (rawData) {
    return tryParse(rawData); 
  }
}