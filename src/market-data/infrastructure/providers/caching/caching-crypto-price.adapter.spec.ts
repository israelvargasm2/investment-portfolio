import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { CryptoPriceProviderPort } from '../../../domain/ports/crypto-price-provider.port';
import { CachingCryptoPriceProviderAdapter } from './caching-crypto-price.adapter';

describe('CachingCryptoPriceProviderAdapter', () => {
  let delegate: jest.Mocked<CryptoPriceProviderPort>;
  let adapter: CachingCryptoPriceProviderAdapter;

  beforeEach(() => {
    delegate = { getPrice: jest.fn() };
    adapter = new CachingCryptoPriceProviderAdapter(delegate);
  });

  it('no golpea al delegate de nuevo para el mismo coinId y moneda dentro del TTL', async () => {
    delegate.getPrice.mockResolvedValue(Money.of(55000, 'USD'));

    await adapter.getPrice('bitcoin', 'USD');
    await adapter.getPrice('bitcoin', 'USD');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(1);
  });

  it('trata distintas monedas para el mismo coinId como entradas separadas', async () => {
    delegate.getPrice.mockResolvedValue(Money.of(55000, 'USD'));

    await adapter.getPrice('bitcoin', 'USD');
    await adapter.getPrice('bitcoin', 'EUR');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(2);
  });

  it('propaga el error del delegate sin cachear la falla', async () => {
    delegate.getPrice.mockRejectedValueOnce(new Error('rate limited'));
    delegate.getPrice.mockResolvedValueOnce(Money.of(55000, 'USD'));

    await expect(adapter.getPrice('bitcoin', 'USD')).rejects.toThrow(
      'rate limited',
    );
    const price = await adapter.getPrice('bitcoin', 'USD');

    expect(price).toEqual(Money.of(55000, 'USD'));
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(2);
  });
});
