import { IsEnum, Matches } from 'class-validator';
import { BalanceSnapshotScope } from '../../../domain/balance-snapshot-scope.enum';

export class CreateBalanceSnapshotDto {
  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code',
  })
  currency: string;

  @IsEnum(BalanceSnapshotScope)
  scope: BalanceSnapshotScope;
}
