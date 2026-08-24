import { IsString, Matches } from 'class-validator';

const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;

/**
 * Query params aceptados por GET /assets/exchange-rate.
 */
export class GetExchangeRateQueryDto {
  @IsString()
  @Matches(CURRENCY_CODE_PATTERN, {
    message: 'from must be a 3-letter ISO 4217 code',
  })
  from: string;

  @IsString()
  @Matches(CURRENCY_CODE_PATTERN, {
    message: 'to must be a 3-letter ISO 4217 code',
  })
  to: string;
}
