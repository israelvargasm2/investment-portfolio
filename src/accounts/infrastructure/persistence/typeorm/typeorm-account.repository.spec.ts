import { Repository } from 'typeorm';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { InstitutionType } from '../../../domain/institution-type.enum';
import { RateTier } from '../../../domain/rate-tier';
import { AccountOrmEntity } from './account.orm-entity';
import { TypeOrmAccountRepository } from './typeorm-account.repository';

describe('TypeOrmAccountRepository', () => {
  let repository: jest.Mocked<Repository<AccountOrmEntity>>;
  let accountRepository: TypeOrmAccountRepository;

  const rateTiers: RateTier[] = [{ upToAmount: null, annualRate: 8.5 }];

  const row: AccountOrmEntity = {
    id: 'account-1',
    userId: 'user-1',
    institutionName: 'BBVA',
    institutionType: InstitutionType.BANK,
    balanceAmount: 10000,
    balanceCurrency: 'MXN',
    rateTiers,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<AccountOrmEntity>>;
    accountRepository = new TypeOrmAccountRepository(repository);
  });

  it('lista y mapea las cuentas del usuario, con Money y tramos reconstruidos', async () => {
    repository.find.mockResolvedValue([row]);

    const result = await accountRepository.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].balance.amount).toBe(10000);
    expect(result[0].balance.currency).toBe('MXN');
    expect(result[0].rateTiers).toEqual(rateTiers);
    expect(result[0].estimatedAnnualYield).toBeCloseTo(850);
  });

  it('crea y guarda una cuenta nueva, separando el Money y guardando los tramos como jsonb', async () => {
    repository.create.mockReturnValue(row);
    repository.save.mockResolvedValue(row);

    const result = await accountRepository.create({
      userId: 'user-1',
      institutionName: 'BBVA',
      institutionType: InstitutionType.BANK,
      balance: Money.of(10000, 'MXN'),
      rateTiers,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      institutionName: 'BBVA',
      institutionType: InstitutionType.BANK,
      balanceAmount: 10000,
      balanceCurrency: 'MXN',
      rateTiers,
    });
    expect(result.id).toBe('account-1');
  });

  it('actualiza la cuenta y devuelve la entidad mapeada cuando pertenece al usuario', async () => {
    const newTiers: RateTier[] = [
      { upToAmount: 25000, annualRate: 15 },
      { upToAmount: null, annualRate: 6 },
    ];
    repository.update.mockResolvedValue({
      affected: 1,
      raw: {},
      generatedMaps: [],
    });
    repository.findOne.mockResolvedValue({
      ...row,
      balanceAmount: 20000,
      rateTiers: newTiers,
    });

    const result = await accountRepository.updateByIdAndUserId(
      'account-1',
      'user-1',
      {
        institutionName: 'BBVA',
        institutionType: InstitutionType.BANK,
        balance: Money.of(20000, 'MXN'),
        rateTiers: newTiers,
      },
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'account-1', userId: 'user-1' },
      {
        institutionName: 'BBVA',
        institutionType: InstitutionType.BANK,
        balanceAmount: 20000,
        balanceCurrency: 'MXN',
        rateTiers: newTiers,
      },
    );
    expect(result?.balance.amount).toBe(20000);
    expect(result?.rateTiers).toEqual(newTiers);
  });

  it('devuelve null al actualizar cuando la cuenta no existe o no pertenece al usuario', async () => {
    repository.update.mockResolvedValue({
      affected: 0,
      raw: {},
      generatedMaps: [],
    });

    const result = await accountRepository.updateByIdAndUserId(
      'account-1',
      'user-1',
      {
        institutionName: 'BBVA',
        institutionType: InstitutionType.BANK,
        balance: Money.of(20000, 'MXN'),
        rateTiers,
      },
    );

    expect(result).toBeNull();
  });

  it('devuelve true al borrar cuando la cuenta pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 1, raw: {} });

    const result = await accountRepository.deleteByIdAndUserId(
      'account-1',
      'user-1',
    );

    expect(result).toBe(true);
  });

  it('devuelve false al borrar cuando la cuenta no existe o no pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 0, raw: {} });

    const result = await accountRepository.deleteByIdAndUserId(
      'account-1',
      'user-1',
    );

    expect(result).toBe(false);
  });
});
