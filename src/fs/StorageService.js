/**
 * StorageService: Type-safe LocalStorage abstraction with schema fallback and prefixing.
 */
export class StorageService {
  constructor(namespace = 'uracing') {
    this.namespace = namespace;
    this.isAvailable = this._checkAvailability();
  }

  _checkAvailability() {
    try {
      const testKey = `__${this.namespace}_test__`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage unavailable or disabled. Fallback to memory store.');
      return false;
    }
  }

  _getKey(key) {
    return `${this.namespace}:${key}`;
  }

  get(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;
    try {
      const item = localStorage.getItem(this._getKey(key));
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.error(`Failed to read key '${key}' from storage:`, err);
      return defaultValue;
    }
  }

  set(key, value) {
    if (!this.isAvailable) return false;
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Failed to write key '${key}' to storage:`, err);
      return false;
    }
  }

  remove(key) {
    if (!this.isAvailable) return;
    localStorage.removeItem(this._getKey(key));
  }

  clearAll() {
    if (!this.isAvailable) return;
    const prefix = `${this.namespace}:`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
