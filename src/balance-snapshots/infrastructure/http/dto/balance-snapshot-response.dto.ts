import { BalanceSnapshot } from '../../../domain/entities/balance-snapshot.entity';

export class BalanceSnapshotResponseDto {
  id: string;
  totalAmount: number;
  currency: string;
  createdAt: string;

  static fromDomain(snapshot: BalanceSnapshot): BalanceSnapshotResponseDto {
    const dto = new BalanceSnapshotResponseDto();
    dto.id = snapshot.id;
    dto.totalAmount = snapshot.total.amount;
    dto.currency = snapshot.total.currency;
    dto.createdAt = snapshot.createdAt.toISOString();
    return dto;
  }
}
