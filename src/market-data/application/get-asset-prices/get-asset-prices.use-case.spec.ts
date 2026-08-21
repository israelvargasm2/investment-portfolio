import { AssetType } from '../../domain/asset-type.enum';
import { AssetPriceLookupError } from '../../domain/errors/asset-price-lookup.error';
import { RateLimitExceededError } from '../../domain/errors/rate-limit-exceeded.error';
import { CryptoPriceProviderPort } from '../../domain/ports/crypto-price-provider.port';
import { CurrencyConverterPort } from '../../domain/ports/currency-converter.port';
import { StockPriceProviderPort } from '../../domain/ports/stock-price-provider.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { GetAssetPricesUseCase } from './get-asset-prices.use-case';

describe('GetAssetPricesUseCase', () => {
  let stockPriceProvider: jest.Mocked<StockPriceProviderPort>;
  let cryptoPriceProvider: jest.Mocked<CryptoPriceProviderPort>;
  let currencyConverter: jest.Mocked<CurrencyConverterPort>;
  let useCase: GetAssetPricesUseCase;

  beforeEach(() => {
    stockPriceProvider = { getPrice: jest.fn() };
    cryptoPriceProvider = { getPrice: jest.fn() };
    currencyConverter = { convert: jest.fn() };
    useCase = new GetAssetPricesUseCase(
      stockPriceProvider,
      cryptoPriceProvider,
      currencyConverter,
    );
  });

  it('resuelve stocks y criptos en paralelo sin convertir cuando la moneda nativa coincide', async () => {
    stockPriceProvider.getPrice.mockResolvedValue(Money.of(227.16, 'USD'));
    cryptoPriceProvider.getPrice.mockResolvedValue(Money.of(60321.55, 'USD'));

    const result = await useCase.execute({
      stockSymbols: ['AAPL'],
      cryptoIds: ['bitcoin'],
      targetCurrency: 'USD',
    });

    expect(result.errors).toHaveLength(0);
    expect(result.prices).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).not.toHaveBeenCalled();

    const stockPrice = result.prices.find(
      (price) => price.assetType === AssetType.STOCK,
    );
    expect(stockPrice?.assetSymbol).toBe('AAPL');
    expect(stockPrice?.price.amount).toBe(227.16);
    expect(stockPrice?.price.currency).toBe('USD');
  });

  it('convierte el precio de una stock cuando la moneda destino difiere de la nativa', async () => {
    stockPriceProvider.getPrice.mockResolvedValue(Money.of(100, 'USD'));
    currencyConverter.convert.mockResolvedValue(92);

    const result = await useCase.execute({
      stockSymbols: ['AAPL'],
      cryptoIds: [],
      targetCurrency: 'EUR',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).toHaveBeenCalledWith(100, 'USD', 'EUR');
    expect(result.prices[0].price.amount).toBe(92);
    expect(result.prices[0].price.currency).toBe('EUR');
  });

  it('no convierte el precio de una cripto porque el proveedor ya devuelve la moneda solicitada', async () => {
    cryptoPriceProvider.getPrice.mockResolvedValue(Money.of(55000, 'EUR'));

    const result = await useCase.execute({
      stockSymbols: [],
      cryptoIds: ['bitcoin'],
      targetCurrency: 'EUR',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).not.toHaveBeenCalled();
    expect(result.prices[0].price.amount).toBe(55000);
  });

  it('devuelve una respuesta parcial: un activo fallido no bloquea a los demás', async () => {
    stockPriceProvider.getPrice.mockRejectedValue(
      new Error('Symbol not found'),
    );
    cryptoPriceProvider.getPrice.mockResolvedValue(Money.of(60321.55, 'USD'));

    const result = await useCase.execute({
      stockSymbols: ['INVALID'],
      cryptoIds: ['bitcoin'],
      targetCurrency: 'USD',
    });

    expect(result.prices).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(AssetPriceLookupError);
    expect(result.errors[0].assetSymbol).toBe('INVALID');
    expect(result.errors[0].assetType).toBe(AssetType.STOCK);
    expect(result.errors[0].message).toBe('Symbol not found');
    expect(result.errors[0].rateLimited).toBe(false);
  });

  it('marca el error con rateLimited cuando el proveedor lanza RateLimitExceededError', async () => {
    stockPriceProvider.getPrice.mockRejectedValue(
      new RateLimitExceededError('Finnhub'),
    );

    const result = await useCase.execute({
      stockSymbols: ['AAPL'],
      cryptoIds: [],
      targetCurrency: 'USD',
    });

    expect(result.errors[0].rateLimited).toBe(true);
    expect(result.errors[0].message).toContain(
      'Rate limit exceeded for Finnhub',
    );
  });
});
