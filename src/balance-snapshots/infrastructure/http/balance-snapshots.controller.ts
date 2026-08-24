import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/infrastructure/jwt/authenticated-user';
import { CreateBalanceSnapshotUseCase } from '../../application/create-balance-snapshot/create-balance-snapshot.use-case';
import { ListBalanceSnapshotsUseCase } from '../../application/list-balance-snapshots/list-balance-snapshots.use-case';
import { RemoveBalanceSnapshotUseCase } from '../../application/remove-balance-snapshot/remove-balance-snapshot.use-case';
import { BalanceSnapshotCalculationError } from '../../domain/errors/balance-snapshot-calculation.error';
import { BalanceSnapshotNotFoundError } from '../../domain/errors/balance-snapshot-not-found.error';
import { BalanceSnapshotResponseDto } from './dto/balance-snapshot-response.dto';
import { CreateBalanceSnapshotDto } from './dto/create-balance-snapshot.dto';

/**
 * Adaptador de entrada HTTP: histórico del balance total del usuario
 * autenticado. JWT requerido por el guard global (ver AuthModule) — no
 * necesita `@UseGuards` propio.
 */
@Controller('balance-snapshots')
export class BalanceSnapshotsController {
  constructor(
    private readonly createSnapshot: CreateBalanceSnapshotUseCase,
    private readonly listSnapshots: ListBalanceSnapshotsUseCase,
    private readonly removeSnapshot: RemoveBalanceSnapshotUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBalanceSnapshotDto,
  ): Promise<BalanceSnapshotResponseDto> {
    try {
      const snapshot = await this.createSnapshot.execute(user.id, dto.currency);
      return BalanceSnapshotResponseDto.fromDomain(snapshot);
    } catch (error) {
      if (error instanceof BalanceSnapshotCalculationError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BalanceSnapshotResponseDto[]> {
    const snapshots = await this.listSnapshots.execute(user.id);
    return snapshots.map((snapshot) =>
      BalanceSnapshotResponseDto.fromDomain(snapshot),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    try {
      await this.removeSnapshot.execute(id, user.id);
    } catch (error) {
      if (error instanceof BalanceSnapshotNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
