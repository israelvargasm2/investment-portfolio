import { AssetType } from '../../../market-data/domain/asset-type.enum';
import { AssetPrice } from '../../../market-data/domain/entities/asset-price.entity';
import { GetAssetPricesUseCase } from '../../../market-data/application/get-asset-prices/get-asset-prices.use-case';
import { CurrencyConverterPort } from '../../../market-data/domain/ports/currency-converter.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../../domain/entities/purchase.entity';
import { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';
import { PurchaseAssetType } from '../../domain/purchase-asset-type.enum';
import { GetPurchasesPerformanceUseCase } from './get-purchases-performance.use-case';

describe('GetPurchasesPerformanceUseCase', () => {
  let purchaseRepository: jest.Mocked<PurchaseRepositoryPort>;
  let getAssetPrices: jest.Mocked<GetAssetPricesUseCase>;
  let currencyConverter: jest.Mocked<CurrencyConverterPort>;
  let useCase: GetPurchasesPerformanceUseCase;

  beforeEach(() => {
    purchaseRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    getAssetPrices = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetAssetPricesUseCase>;
    currencyConverter = {
      convert: jest.fn(),
    };
    useCase = new GetPurchasesPerformanceUseCase(
      purchaseRepository,
      getAssetPrices,
      currencyConverter,
    );
  });

  it('devuelve vacío cuando el usuario no tiene compras', async () => {
    purchaseRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({ performances: [], errors: [] });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getAssetPrices.execute).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).not.toHaveBeenCalled();
  });

  it('calcula ganancia/pérdida comparando el TOTAL pagado (no un precio por unidad) vs. el valor actual, en USD', async () => {
    // purchase.purchasePrice.amount es lo que el usuario pagó por las 10
    // acciones en conjunto ($1500 en total), no un precio de $1500 por
    // acción: no debe multiplicarse de nuevo por `quantity` al calcular lo
    // invertido (bug real: reportado por el usuario, la cuenta daba 10x más).
    const purchase = new Purchase(
      'purchase-1',
      'user-1',
      'AAPL',
      PurchaseAssetType.STOCK,
      10,
      Money.of(1500, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    purchaseRepository.findByUserId.mockResolvedValue([purchase]);
    getAssetPrices.execute.mockResolvedValue({
      prices: [
        new AssetPrice(
          'AAPL',
          AssetType.STOCK,
          Money.of(180, 'USD'),
          new Date(),
        ),
      ],
      errors: [],
    });

    const result = await useCase.execute('user-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getAssetPrices.execute).toHaveBeenCalledWith({
      stockSymbols: ['AAPL'],
      cryptoIds: [],
      targetCurrency: 'USD',
    });
    // Ya está en USD: no hace falta pedir tasa de cambio.
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).not.toHaveBeenCalled();
    expect(result.errors).toHaveLength(0);
    expect(result.performances).toHaveLength(1);
    const [performance] = result.performances;
    expect(performance.investedAmountUsd).toBeCloseTo(1500);
    expect(performance.currentValue).toBeCloseTo(1800); // 180 (precio por acción) * 10
    expect(performance.gainLoss).toBeCloseTo(300);
    expect(performance.gainLossPercentage).toBeCloseTo(20, 1);
  });

  it('pide el precio actual de todos los activos en una sola llamada, sin importar la moneda de compra', async () => {
    const usdPurchase = new Purchase(
      'purchase-1',
      'user-1',
      'AAPL',
      PurchaseAssetType.STOCK,
      1,
      Money.of(100, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    const mxnPurchase = new Purchase(
      'purchase-2',
      'user-2',
      'IVVPESO.MX',
      PurchaseAssetType.STOCK,
      10,
      Money.of(500, 'MXN'), // total pagado por las 10 unidades, no por unidad
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    purchaseRepository.findByUserId.mockResolvedValue([
      usdPurchase,
      mxnPurchase,
    ]);
    getAssetPrices.execute.mockResolvedValue({
      prices: [
        new AssetPrice(
          'AAPL',
          AssetType.STOCK,
          Money.of(110, 'USD'),
          new Date(),
        ),
        new AssetPrice(
          'IVVPESO.MX',
          AssetType.STOCK,
          Money.of(30, 'USD'),
          new Date(),
        ),
      ],
      errors: [],
    });
    currencyConverter.convert.mockResolvedValue(0.05); // 1 MXN = 0.05 USD

    const result = await useCase.execute('user-1');

    /* eslint-disable @typescript-eslint/unbound-method -- jest.fn() no usa `this` */
    expect(getAssetPrices.execute).toHaveBeenCalledTimes(1);
    expect(getAssetPrices.execute).toHaveBeenCalledWith({
      stockSymbols: ['AAPL', 'IVVPESO.MX'],
      cryptoIds: [],
      targetCurrency: 'USD',
    });
    expect(currencyConverter.convert).toHaveBeenCalledTimes(1);
    expect(currencyConverter.convert).toHaveBeenCalledWith(1, 'MXN', 'USD');
    /* eslint-enable @typescript-eslint/unbound-method */
    expect(result.performances).toHaveLength(2);

    const mxnPerformance = result.performances.find(
      (performance) => performance.purchase.id === 'purchase-2',
    );
    // 500 * 0.05 = 25 (total convertido), NO 25 * 10: la cantidad ya está
    // incluida en el total pagado, no hay que volver a multiplicarla.
    expect(mxnPerformance?.investedAmountUsd).toBeCloseTo(25);
    expect(mxnPerformance?.purchase.purchasePrice.currency).toBe('MXN');
    expect(mxnPerformance?.purchase.purchasePrice.amount).toBe(500);
  });

  it('reporta un error por compra cuando no se pudo obtener el precio actual', async () => {
    const purchase = new Purchase(
      'purchase-1',
      'user-1',
      'UNKNOWN',
      PurchaseAssetType.STOCK,
      1,
      Money.of(100, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    purchaseRepository.findByUserId.mockResolvedValue([purchase]);
    getAssetPrices.execute.mockResolvedValue({ prices: [], errors: [] });

    const result = await useCase.execute('user-1');

    expect(result.performances).toHaveLength(0);
    expect(result.errors).toEqual([
      {
        purchaseId: 'purchase-1',
        assetSymbol: 'UNKNOWN',
        message: 'Current price unavailable for "UNKNOWN"',
      },
    ]);
  });

  it('reporta un error por compra cuando no se pudo obtener la tasa de cambio', async () => {
    const purchase = new Purchase(
      'purchase-1',
      'user-1',
      'IVVPESO.MX',
      PurchaseAssetType.STOCK,
      1,
      Money.of(500, 'MXN'),
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    purchaseRepository.findByUserId.mockResolvedValue([purchase]);
    getAssetPrices.execute.mockResolvedValue({
      prices: [
        new AssetPrice(
          'IVVPESO.MX',
          AssetType.STOCK,
          Money.of(30, 'USD'),
          new Date(),
        ),
      ],
      errors: [],
    });
    currencyConverter.convert.mockRejectedValue(new Error('rate unavailable'));

    const result = await useCase.execute('user-1');

    expect(result.performances).toHaveLength(0);
    expect(result.errors).toEqual([
      {
        purchaseId: 'purchase-1',
        assetSymbol: 'IVVPESO.MX',
        message: 'Exchange rate unavailable for "MXN"',
      },
    ]);
  });
});
