import { RefreshAssetOptionsUseCase } from '../../application/refresh-asset-options/refresh-asset-options.use-case';
import { AssetOptionsRefreshScheduler } from './asset-options-refresh.scheduler';

describe('AssetOptionsRefreshScheduler', () => {
  let refreshAssetOptions: jest.Mocked<RefreshAssetOptionsUseCase>;
  let scheduler: AssetOptionsRefreshScheduler;

  beforeEach(() => {
    refreshAssetOptions = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RefreshAssetOptionsUseCase>;
    scheduler = new AssetOptionsRefreshScheduler(refreshAssetOptions);
  });

  it('ejecuta el caso de uso al dispararse el cron', async () => {
    refreshAssetOptions.execute.mockResolvedValue({
      stocksCount: 52,
      cryptosCount: 100,
    });

    await scheduler.handleCron();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(refreshAssetOptions.execute).toHaveBeenCalled();
  });

  it('no propaga el error si el refresh falla (no debe tumbar el proceso)', async () => {
    refreshAssetOptions.execute.mockRejectedValue(new Error('CoinGecko down'));

    await expect(scheduler.handleCron()).resolves.toBeUndefined();
  });
});
