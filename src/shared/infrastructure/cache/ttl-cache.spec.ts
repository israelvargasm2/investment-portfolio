import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('llama a factory solo una vez y reusa el valor cacheado dentro del TTL', async () => {
    const cache = new TtlCache<number>(1000);
    const factory = jest.fn().mockResolvedValue(42);

    const first = await cache.getOrSet('AAPL', factory);
    const second = await cache.getOrSet('AAPL', factory);

    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('vuelve a llamar a factory una vez vencido el TTL', async () => {
    const cache = new TtlCache<number>(1000);
    const factory = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    const first = await cache.getOrSet('AAPL', factory);
    jest.advanceTimersByTime(1001);
    const second = await cache.getOrSet('AAPL', factory);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('mantiene entradas de distintas keys por separado', async () => {
    const cache = new TtlCache<number>(1000);

    const aapl = await cache.getOrSet('AAPL', () => Promise.resolve(100));
    const msft = await cache.getOrSet('MSFT', () => Promise.resolve(200));

    expect(aapl).toBe(100);
    expect(msft).toBe(200);
  });

  it('no cachea un rechazo: un miss fallido no bloquea el próximo intento', async () => {
    const cache = new TtlCache<number>(1000);
    const factory = jest
      .fn()
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce(42);

    await expect(cache.getOrSet('AAPL', factory)).rejects.toThrow(
      'rate limited',
    );
    const value = await cache.getOrSet('AAPL', factory);

    expect(value).toBe(42);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('coalesce: dos misses concurrentes de la misma key solo llaman a factory una vez', async () => {
    const cache = new TtlCache<number>(1000);
    let resolveFactory!: (value: number) => void;
    const factory = jest.fn().mockReturnValue(
      new Promise<number>((resolve) => {
        resolveFactory = resolve;
      }),
    );

    const first = cache.getOrSet('AAPL', factory);
    const second = cache.getOrSet('AAPL', factory);
    resolveFactory(7);

    expect(await first).toBe(7);
    expect(await second).toBe(7);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
