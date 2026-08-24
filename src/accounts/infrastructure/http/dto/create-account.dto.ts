import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { InstitutionType } from '../../../domain/institution-type.enum';
import { RateTierDto } from './rate-tier.dto';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  institutionName: string;

  @IsEnum(InstitutionType)
  institutionType: InstitutionType;

  @Min(0)
  balanceAmount: number;

  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code',
  })
  currency: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RateTierDto)
  rateTiers: RateTierDto[];
}
