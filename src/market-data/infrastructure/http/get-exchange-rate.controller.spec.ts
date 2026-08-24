import { GetExchangeRateUseCase } from '../../application/get-exchange-rate/get-exchange-rate.use-case';
import { GetExchangeRateController } from './get-exchange-rate.controller';

describe('GetExchangeRateController', () => {
  let useCase: jest.Mocked<GetExchangeRateUseCase>;
  let controller: GetExchangeRateController;

  beforeEach(() => {
    useCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetExchangeRateUseCase>;
    controller = new GetExchangeRateController(useCase);
  });

  it('pide la tasa al caso de uso con los códigos recibidos', async () => {
    useCase.execute.mockResolvedValue(18.5);

    await controller.get({ from: 'USD', to: 'MXN' });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(useCase.execute).toHaveBeenCalledWith('USD', 'MXN');
  });

  it('devuelve los códigos normalizados a mayúsculas junto con la tasa', async () => {
    useCase.execute.mockResolvedValue(18.5);

    const response = await controller.get({ from: 'usd', to: 'mxn' });

    expect(response).toEqual({ from: 'USD', to: 'MXN', rate: 18.5 });
  });
});
