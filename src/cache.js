export class UsageCache {
  constructor(ttlMinutes = 5) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.data = null;
    this.timestamp = null;
  }

  isValid() {
    if (!this.data || !this.timestamp) return false;
    const now = Date.now();
    return (now - this.timestamp) < this.ttlMs;
  }

  get() {
    if (this.isValid()) {
      return { data: this.data, fromCache: true };
    }
    return null;
  }

  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  }

  clear() {
    this.data = null;
    this.timestamp = null;
  }
}