import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * Query params aceptados por GET /assets/prices.
 * "stocks" y "cryptos" son listas separadas por coma; al menos una debe venir con datos
 * (se valida en el controlador porque involucra a ambos campos a la vez).
 */
export class GetAssetPricesQueryDto {
  @IsOptional()
  @IsString()
  stocks?: string;

  @IsOptional()
  @IsString()
  cryptos?: string;

  @IsOptional()
  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code',
  })
  currency?: string;
}
