import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/infrastructure/jwt/authenticated-user';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CreateAccountUseCase } from '../../application/create-account/create-account.use-case';
import { ListAccountsUseCase } from '../../application/list-accounts/list-accounts.use-case';
import { RemoveAccountUseCase } from '../../application/remove-account/remove-account.use-case';
import { UpdateAccountUseCase } from '../../application/update-account/update-account.use-case';
import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import { InvalidRateTiersError } from '../../domain/errors/invalid-rate-tiers.error';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';

/**
 * Adaptador de entrada HTTP: cuentas (banco, SOFIPO, etc.) del usuario
 * autenticado. JWT requerido por el guard global (ver AuthModule) — no
 * necesita `@UseGuards` propio.
 */
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly createAccount: CreateAccountUseCase,
    private readonly listAccounts: ListAccountsUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
    private readonly removeAccount: RemoveAccountUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    try {
      const account = await this.createAccount.execute({
        userId: user.id,
        institutionName: dto.institutionName,
        institutionType: dto.institutionType,
        balance: Money.of(dto.balanceAmount, dto.currency),
        rateTiers: dto.rateTiers,
      });
      return AccountResponseDto.fromDomain(account);
    } catch (error) {
      if (error instanceof InvalidRateTiersError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AccountResponseDto[]> {
    const accounts = await this.listAccounts.execute(user.id);
    return accounts.map((account) => AccountResponseDto.fromDomain(account));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    try {
      const account = await this.updateAccount.execute(id, user.id, {
        institutionName: dto.institutionName,
        institutionType: dto.institutionType,
        balance: Money.of(dto.balanceAmount, dto.currency),
        rateTiers: dto.rateTiers,
      });
      return AccountResponseDto.fromDomain(account);
    } catch (error) {
      if (error instanceof InvalidRateTiersError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof AccountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    try {
      await this.removeAccount.execute(id, user.id);
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
