import { GetExchangeRateUseCase } from './get-exchange-rate.use-case';
import type { CurrencyConverterPort } from '../../domain/ports/currency-converter.port';

describe('GetExchangeRateUseCase', () => {
  let currencyConverter: jest.Mocked<CurrencyConverterPort>;
  let useCase: GetExchangeRateUseCase;

  beforeEach(() => {
    currencyConverter = { convert: jest.fn() };
    useCase = new GetExchangeRateUseCase(currencyConverter);
  });

  it('pide la tasa para 1 unidad de la moneda de origen', async () => {
    currencyConverter.convert.mockResolvedValue(18.5);

    const rate = await useCase.execute('USD', 'MXN');

    expect(rate).toBe(18.5);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).toHaveBeenCalledWith(1, 'USD', 'MXN');
  });

  it('normaliza los códigos de moneda a mayúsculas', async () => {
    currencyConverter.convert.mockResolvedValue(18.5);

    await useCase.execute('usd', 'mxn');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).toHaveBeenCalledWith(1, 'USD', 'MXN');
  });
});
