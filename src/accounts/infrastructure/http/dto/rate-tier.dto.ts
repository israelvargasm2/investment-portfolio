import { IsNumber, IsPositive, Min, ValidateIf } from 'class-validator';

/**
 * `upToAmount: null` es válido (representa "sin tope") — class-validator no
 * corre @IsPositive sobre null salvo que se lo pidamos explícitamente, así
 * que ValidateIf solo aplica esa validación cuando el valor no es null. La
 * coherencia entre tramos (topes crecientes, null solo en el último) no se
 * valida acá a nivel de campo — eso lo hace validateRateTiers en el dominio,
 * porque depende de la lista completa, no de un tramo suelto.
 */
export class RateTierDto {
  @ValidateIf((_dto: RateTierDto, value: unknown) => value !== null)
  @IsNumber()
  @IsPositive()
  upToAmount: number | null;

  @IsNumber()
  @Min(0)
  annualRate: number;
}
