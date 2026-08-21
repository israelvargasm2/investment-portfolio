import { BadRequestException } from '@nestjs/common';
import { AssetType } from '../../domain/asset-type.enum';
import { AssetPrice } from '../../domain/entities/asset-price.entity';
import { AssetPriceLookupError } from '../../domain/errors/asset-price-lookup.error';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { GetAssetPricesUseCase } from '../../application/get-asset-prices/get-asset-prices.use-case';
import { GetAssetPricesController } from './get-asset-prices.controller';

describe('GetAssetPricesController', () => {
  let useCase: jest.Mocked<GetAssetPricesUseCase>;
  let controller: GetAssetPricesController;

  beforeEach(() => {
    useCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetAssetPricesUseCase>;
    controller = new GetAssetPricesController(useCase);
  });

  it('parsea las listas separadas por coma y usa USD por defecto', async () => {
    useCase.execute.mockResolvedValue({ prices: [], errors: [] });

    await controller.getPrices({ stocks: ' AAPL, MSFT ', cryptos: 'bitcoin' });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(useCase.execute).toHaveBeenCalledWith({
      stockSymbols: ['AAPL', 'MSFT'],
      cryptoIds: ['bitcoin'],
      targetCurrency: 'USD',
    });
  });

  it('lanza BadRequestException cuando no se envía ni stocks ni cryptos', async () => {
    await expect(controller.getPrices({})).rejects.toThrow(BadRequestException);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('mapea el resultado del caso de uso al DTO de respuesta', async () => {
    useCase.execute.mockResolvedValue({
      prices: [
        new AssetPrice(
          'AAPL',
          AssetType.STOCK,
          Money.of(227.16, 'USD'),
          new Date('2026-08-13T00:00:00.000Z'),
        ),
      ],
      errors: [
        new AssetPriceLookupError(
          'INVALID',
          AssetType.STOCK,
          'Symbol not found',
        ),
      ],
    });

    const response = await controller.getPrices({ stocks: 'AAPL,INVALID' });

    expect(response.currency).toBe('USD');
    expect(response.prices).toEqual([
      {
        symbol: 'AAPL',
        type: AssetType.STOCK,
        price: 227.16,
        currency: 'USD',
        asOf: '2026-08-13T00:00:00.000Z',
      },
    ]);
    expect(response.errors).toEqual([
      {
        symbol: 'INVALID',
        type: AssetType.STOCK,
        message: 'Symbol not found',
        rateLimited: false,
      },
    ]);
  });
});
