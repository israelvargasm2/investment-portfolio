import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { Account } from '../../../domain/entities/account.entity';
import {
  AccountDetailsData,
  AccountRepositoryPort,
  NewAccountData,
} from '../../../domain/ports/account-repository.port';
import { AccountOrmEntity } from './account.orm-entity';

/**
 * Adaptador de salida: implementa AccountRepositoryPort usando TypeORM sobre Postgres.
 */
@Injectable()
export class TypeOrmAccountRepository implements AccountRepositoryPort {
  constructor(
    @InjectRepository(AccountOrmEntity)
    private readonly repository: Repository<AccountOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<Account[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(newAccount: NewAccountData): Promise<Account> {
    const row = this.repository.create({
      userId: newAccount.userId,
      institutionName: newAccount.institutionName,
      institutionType: newAccount.institutionType,
      balanceAmount: newAccount.balance.amount,
      balanceCurrency: newAccount.balance.currency,
      rateTiers: newAccount.rateTiers,
    });
    const savedRow = await this.repository.save(row);
    return this.toDomain(savedRow);
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: AccountDetailsData,
  ): Promise<Account | null> {
    const result = await this.repository.update(
      { id, userId },
      {
        institutionName: data.institutionName,
        institutionType: data.institutionType,
        balanceAmount: data.balance.amount,
        balanceCurrency: data.balance.currency,
        rateTiers: data.rateTiers,
      },
    );
    if ((result.affected ?? 0) === 0) {
      return null;
    }

    const row = await this.repository.findOne({ where: { id, userId } });
    return row ? this.toDomain(row) : null;
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  private toDomain(row: AccountOrmEntity): Account {
    return new Account(
      row.id,
      row.userId,
      row.institutionName,
      row.institutionType,
      Money.of(row.balanceAmount, row.balanceCurrency),
      row.rateTiers,
      row.createdAt,
    );
  }
}
