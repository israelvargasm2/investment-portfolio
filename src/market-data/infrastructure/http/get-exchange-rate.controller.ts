import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../auth/infrastructure/http/public.decorator';
import { GetExchangeRateUseCase } from '../../application/get-exchange-rate/get-exchange-rate.use-case';
import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';
import { GetExchangeRateQueryDto } from './dto/get-exchange-rate-query.dto';

// Límite propio, igual criterio que get-asset-prices.controller.ts: es
// público y reenvía a Frankfurter (con cache de 1h atrás, pero igual sin
// límite cualquiera podría scriptear pares de moneda distintos).
const RATE_THROTTLE_TTL_MS = 60_000;
const RATE_THROTTLE_LIMIT = 30;

/**
 * Adaptador de entrada HTTP: expone una tasa de cambio simple para el
 * selector de moneda de visualización del frontend (USD/MXN). Público,
 * mismo criterio que /assets/prices — no es un dato del usuario.
 */
@Controller('assets')
export class GetExchangeRateController {
  constructor(private readonly getExchangeRate: GetExchangeRateUseCase) {}

  @Public()
  @Throttle({
    default: { limit: RATE_THROTTLE_LIMIT, ttl: RATE_THROTTLE_TTL_MS },
  })
  @Get('exchange-rate')
  async get(
    @Query() query: GetExchangeRateQueryDto,
  ): Promise<ExchangeRateResponseDto> {
    const rate = await this.getExchangeRate.execute(query.from, query.to);
    return { from: query.from.toUpperCase(), to: query.to.toUpperCase(), rate };
  }
}
