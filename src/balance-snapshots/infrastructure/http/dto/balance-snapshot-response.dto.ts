import { BalanceSnapshot } from '../../../domain/entities/balance-snapshot.entity';

export class BalanceSnapshotResponseDto {
  id: string;
  totalAmount: number;
  longMediumTermAmount: number;
  shortTermAmount: number;
  currency: string;
  createdAt: string;

  static fromDomain(snapshot: BalanceSnapshot): BalanceSnapshotResponseDto {
    const dto = new BalanceSnapshotResponseDto();
    dto.id = snapshot.id;
    dto.totalAmount = snapshot.totalAmount.amount;
    dto.longMediumTermAmount = snapshot.longMediumTermAmount.amount;
    dto.shortTermAmount = snapshot.shortTermAmount.amount;
    dto.currency = snapshot.totalAmount.currency;
    dto.createdAt = snapshot.createdAt.toISOString();
    return dto;
  }
}
