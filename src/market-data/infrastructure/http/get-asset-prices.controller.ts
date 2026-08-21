import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../auth/infrastructure/http/public.decorator';
import { GetAssetPricesUseCase } from '../../application/get-asset-prices/get-asset-prices.use-case';
import { AssetPricesResponseDto } from './dto/asset-prices-response.dto';
import { GetAssetPricesQueryDto } from './dto/get-asset-prices-query.dto';

const DEFAULT_CURRENCY = 'USD';

// Límite propio, más estricto que el global (ver app.module.ts): es público
// (lo necesita la validación de símbolo del frontend antes de loguearse no
// aplica, pero sí el catálogo/precio en vivo) y reenvía cada llamada a
// proveedores externos (Finnhub/CoinGecko/Yahoo/Frankfurter) que tienen su
// propio límite de cuota — sin este freno, alguien puede scriptear listas
// grandes de símbolos y agotar esa cuota compartida por toda la app.
const PRICES_THROTTLE_TTL_MS = 60_000;
const PRICES_THROTTLE_LIMIT = 30;

/**
 * Adaptador de entrada HTTP: expone el caso de uso GetAssetPrices como endpoint REST.
 */
@Controller('assets')
export class GetAssetPricesController {
  constructor(private readonly getAssetPricesUseCase: GetAssetPricesUseCase) {}

  @Public()
  @Throttle({
    default: { limit: PRICES_THROTTLE_LIMIT, ttl: PRICES_THROTTLE_TTL_MS },
  })
  @Get('prices')
  async getPrices(
    @Query() query: GetAssetPricesQueryDto,
  ): Promise<AssetPricesResponseDto> {
    const stockSymbols = this.parseCommaSeparatedList(query.stocks);
    const cryptoIds = this.parseCommaSeparatedList(query.cryptos);

    if (stockSymbols.length === 0 && cryptoIds.length === 0) {
      throw new BadRequestException(
        'At least one of "stocks" or "cryptos" query params must be provided',
      );
    }

    const targetCurrency = (query.currency ?? DEFAULT_CURRENCY).toUpperCase();

    const result = await this.getAssetPricesUseCase.execute({
      stockSymbols,
      cryptoIds,
      targetCurrency,
    });

    return AssetPricesResponseDto.fromResult(targetCurrency, result);
  }

  private parseCommaSeparatedList(value?: string): string[] {
    if (!value) {
      return [];
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
