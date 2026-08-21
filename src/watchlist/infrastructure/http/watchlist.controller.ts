import {
  Body,
  ConflictException,
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
import { AddWatchlistItemUseCase } from '../../application/add-watchlist-item/add-watchlist-item.use-case';
import { GetWatchlistWithPricesUseCase } from '../../application/get-watchlist-with-prices/get-watchlist-with-prices.use-case';
import { RemoveWatchlistItemUseCase } from '../../application/remove-watchlist-item/remove-watchlist-item.use-case';
import { UpdateWatchlistItemUseCase } from '../../application/update-watchlist-item/update-watchlist-item.use-case';
import { WatchlistItemAlreadyExistsError } from '../../domain/errors/watchlist-item-already-exists.error';
import { WatchlistItemNotFoundError } from '../../domain/errors/watchlist-item-not-found.error';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';
import { WatchlistItemResponseDto } from './dto/watchlist-item-response.dto';
import { WatchlistWithPricesResponseDto } from './dto/watchlist-with-prices-response.dto';

/**
 * Adaptador de entrada HTTP: watchlist del usuario autenticado. JWT requerido
 * por el guard global (ver AuthModule) — no necesita `@UseGuards` propio.
 */
@Controller('watchlist')
export class WatchlistController {
  constructor(
    private readonly addWatchlistItem: AddWatchlistItemUseCase,
    private readonly getWatchlistWithPrices: GetWatchlistWithPricesUseCase,
    private readonly updateWatchlistItem: UpdateWatchlistItemUseCase,
    private readonly removeWatchlistItem: RemoveWatchlistItemUseCase,
  ) {}

  @Post()
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddWatchlistItemDto,
  ): Promise<WatchlistItemResponseDto> {
    try {
      const item = await this.addWatchlistItem.execute({
        userId: user.id,
        assetSymbol: dto.assetSymbol,
        assetType: dto.assetType,
      });
      return WatchlistItemResponseDto.fromDomain(item);
    } catch (error) {
      if (error instanceof WatchlistItemAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WatchlistWithPricesResponseDto> {
    const result = await this.getWatchlistWithPrices.execute(user.id);
    return WatchlistWithPricesResponseDto.fromResult(result);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWatchlistItemDto,
  ): Promise<WatchlistItemResponseDto> {
    try {
      const item = await this.updateWatchlistItem.execute(id, user.id, {
        assetSymbol: dto.assetSymbol,
        assetType: dto.assetType,
      });
      return WatchlistItemResponseDto.fromDomain(item);
    } catch (error) {
      if (error instanceof WatchlistItemAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof WatchlistItemNotFoundError) {
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
      await this.removeWatchlistItem.execute(id, user.id);
    } catch (error) {
      if (error instanceof WatchlistItemNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
