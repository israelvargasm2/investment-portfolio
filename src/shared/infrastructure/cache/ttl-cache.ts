interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache en memoria con expiración por tiempo (TTL) y coalescing de misses
 * concurrentes: si dos llamadas piden la misma key mientras la primera
 * todavía está en vuelo, la segunda espera esa misma promesa en vez de
 * disparar otra consulta al proveedor externo.
 *
 * Nunca cachea un rechazo: si `factory()` falla (ej. rate limit, red caída),
 * el error se propaga sin guardar nada, así el próximo llamado reintenta
 * contra el proveedor real en vez de quedar pegado a una falla durante todo
 * el TTL.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly pending = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number) {}

  async getOrSet(key: string, factory: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const inFlight = this.pending.get(key);
    if (inFlight) {
      return inFlight;
    }

    const promise = factory()
      .then((value) => {
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        return value;
      })
      .finally(() => this.pending.delete(key));

    this.pending.set(key, promise);
    return promise;
  }

  private get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
