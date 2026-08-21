import { AssetType } from '../../domain/asset-type.enum';
import { buildBmvSicMirrors } from './bmv-sic-mirrors';

describe('buildBmvSicMirrors', () => {
  it('agrega el sufijo ".MX" al símbolo original', () => {
    const [mirror] = buildBmvSicMirrors([
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetType: AssetType.STOCK },
    ]);

    expect(mirror.symbol).toBe('QQQ.MX');
  });

  it('marca el nombre como listado en BMV/MXN, sin perder el nombre original', () => {
    const [mirror] = buildBmvSicMirrors([
      { symbol: 'AAPL', name: 'Apple Inc.', assetType: AssetType.STOCK },
    ]);

    expect(mirror.name).toBe('Apple Inc. (BMV, MXN)');
  });

  it('conserva el assetType del original', () => {
    const [mirror] = buildBmvSicMirrors([
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetType: AssetType.STOCK },
    ]);

    expect(mirror.assetType).toBe(AssetType.STOCK);
  });

  it('genera un espejo por cada entrada, en el mismo orden', () => {
    const mirrors = buildBmvSicMirrors([
      { symbol: 'AAPL', name: 'Apple Inc.', assetType: AssetType.STOCK },
      { symbol: 'MSFT', name: 'Microsoft Corp', assetType: AssetType.STOCK },
    ]);

    expect(mirrors.map((mirror) => mirror.symbol)).toEqual([
      'AAPL.MX',
      'MSFT.MX',
    ]);
  });

  it('devuelve un array vacío cuando no hay stocks de entrada', () => {
    expect(buildBmvSicMirrors([])).toEqual([]);
  });
});
