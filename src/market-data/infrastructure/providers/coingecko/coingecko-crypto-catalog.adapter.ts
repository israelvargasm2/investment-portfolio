import { Injectable } from '@nestjs/common';
import { AssetType } from '../../../domain/asset-type.enum';
import { RateLimitExceededError } from '../../../domain/errors/rate-limit-exceeded.error';
import { AssetOptionRecord } from '../../../domain/ports/asset-option-repository.port';
import { CryptoCatalogProviderPort } from '../../../domain/ports/crypto-catalog-provider.port';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

interface CoinGeckoListedCoin {
  id: string;
  symbol: string;
  name: string;
}

/**
 * Adaptador de salida que trae TODAS las criptomonedas que trackea CoinGecko
 * (sin tope), para refrescar el catálogo de "asset_options". Usa `/coins/list`
 * en vez de `/coins/markets` a propósito: ese último solo da market cap
 * ranking paginado (arriba de 250 por página, habría que paginar muchas
 * veces), mientras que `/coins/list` devuelve el listado completo en una sola
 * respuesta. `status=active` filtra las que ya no cotizan (no tiene sentido
 * ofrecerlas para trackear). El `id` de CoinGecko es el que usamos como
 * `symbol` (es lo que espera getPrice).
 */
@Injectable()
export class CoinGeckoCryptoCatalogAdapter implements CryptoCatalogProviderPort {
  async fetchAll(): Promise<AssetOptionRecord[]> {
    const url = `${COINGECKO_BASE_URL}/coins/list?status=active`;

    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitExceededError('CoinGecko');
    }
    if (!response.ok) {
      throw new Error(
        `CoinGecko request failed with status ${response.status}`,
      );
    }

    const coins = (await response.json()) as CoinGeckoListedCoin[];
    return coins.map((coin) => ({
      symbol: coin.id,
      name: `${coin.name} (${coin.symbol.toUpperCase()})`,
      assetType: AssetType.CRYPTO,
    }));
  }
}
