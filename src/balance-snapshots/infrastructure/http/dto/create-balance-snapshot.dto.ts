import { Matches } from 'class-validator';

export class CreateBalanceSnapshotDto {
  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code',
  })
  currency: string;
}
