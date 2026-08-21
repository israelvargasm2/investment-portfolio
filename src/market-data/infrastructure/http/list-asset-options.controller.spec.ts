import { ListAssetOptionsUseCase } from '../../application/list-asset-options/list-asset-options.use-case';
import { ListAssetOptionsController } from './list-asset-options.controller';

describe('ListAssetOptionsController', () => {
  it('devuelve las listas de stocks y criptos del caso de uso', async () => {
    const listAssetOptions = {
      execute: jest.fn().mockResolvedValue({
        stocks: [{ symbol: 'AAPL', name: 'Apple Inc.' }],
        cryptos: [{ symbol: 'bitcoin', name: 'Bitcoin (BTC)' }],
      }),
    } as unknown as jest.Mocked<ListAssetOptionsUseCase>;
    const controller = new ListAssetOptionsController(listAssetOptions);

    const response = await controller.list();

    expect(response).toEqual({
      stocks: [{ symbol: 'AAPL', name: 'Apple Inc.' }],
      cryptos: [{ symbol: 'bitcoin', name: 'Bitcoin (BTC)' }],
    });
  });
});
