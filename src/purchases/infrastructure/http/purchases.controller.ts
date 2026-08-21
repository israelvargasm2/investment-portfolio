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
import { CreatePurchaseUseCase } from '../../application/create-purchase/create-purchase.use-case';
import { GetPurchasesPerformanceUseCase } from '../../application/get-purchases-performance/get-purchases-performance.use-case';
import { RemovePurchaseUseCase } from '../../application/remove-purchase/remove-purchase.use-case';
import { UpdatePurchaseUseCase } from '../../application/update-purchase/update-purchase.use-case';
import { InvalidPurchaseDateError } from '../../domain/errors/invalid-purchase-date.error';
import { PurchaseNotFoundError } from '../../domain/errors/purchase-not-found.error';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { PurchasesPerformanceResponseDto } from './dto/purchases-performance-response.dto';

/**
 * Adaptador de entrada HTTP: compras del usuario autenticado. JWT requerido
 * por el guard global (ver AuthModule) — no necesita `@UseGuards` propio.
 */
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly createPurchase: CreatePurchaseUseCase,
    private readonly getPurchasesPerformance: GetPurchasesPerformanceUseCase,
    private readonly updatePurchase: UpdatePurchaseUseCase,
    private readonly removePurchase: RemovePurchaseUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    try {
      const purchase = await this.createPurchase.execute({
        userId: user.id,
        assetSymbol: dto.assetSymbol,
        assetType: dto.assetType,
        quantity: dto.quantity,
        purchasePrice: Money.of(dto.purchasePriceAmount, dto.currency),
        purchasedAt: new Date(dto.purchasedAt),
      });
      return PurchaseResponseDto.fromDomain(purchase);
    } catch (error) {
      if (error instanceof InvalidPurchaseDateError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PurchasesPerformanceResponseDto> {
    const result = await this.getPurchasesPerformance.execute(user.id);
    return PurchasesPerformanceResponseDto.fromResult(result);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    try {
      const purchase = await this.updatePurchase.execute(id, user.id, {
        assetSymbol: dto.assetSymbol,
        assetType: dto.assetType,
        quantity: dto.quantity,
        purchasePrice: Money.of(dto.purchasePriceAmount, dto.currency),
        purchasedAt: new Date(dto.purchasedAt),
      });
      return PurchaseResponseDto.fromDomain(purchase);
    } catch (error) {
      if (error instanceof InvalidPurchaseDateError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof PurchaseNotFoundError) {
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
      await this.removePurchase.execute(id, user.id);
    } catch (error) {
      if (error instanceof PurchaseNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
