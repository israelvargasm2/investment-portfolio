import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea "asset_options" y la puebla con el catálogo curado que antes vivía
 * hardcodeado en el código (ver git history de asset-options.constants.ts).
 * El seed queda fijo acá a propósito: una migration es una foto histórica de
 * lo que se corrió en ese momento, no debe depender de una constante que
 * puede seguir cambiando en el código de la aplicación.
 */
export class CreateAssetOptionsTable1755100300000 implements MigrationInterface {
  name = 'CreateAssetOptionsTable1755100300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "asset_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "symbol" character varying NOT NULL,
        "name" character varying NOT NULL,
        "assetType" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_asset_options_symbol_assetType" UNIQUE ("symbol", "assetType")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "asset_options" ("symbol", "name", "assetType") VALUES
        ('AAPL', 'Apple Inc.', 'stock'),
        ('MSFT', 'Microsoft Corporation', 'stock'),
        ('GOOGL', 'Alphabet Inc. (Class A)', 'stock'),
        ('AMZN', 'Amazon.com Inc.', 'stock'),
        ('NVDA', 'NVIDIA Corporation', 'stock'),
        ('META', 'Meta Platforms Inc.', 'stock'),
        ('TSLA', 'Tesla Inc.', 'stock'),
        ('JPM', 'JPMorgan Chase & Co.', 'stock'),
        ('V', 'Visa Inc.', 'stock'),
        ('JNJ', 'Johnson & Johnson', 'stock'),
        ('WMT', 'Walmart Inc.', 'stock'),
        ('PG', 'Procter & Gamble Co.', 'stock'),
        ('MA', 'Mastercard Inc.', 'stock'),
        ('DIS', 'The Walt Disney Company', 'stock'),
        ('NFLX', 'Netflix Inc.', 'stock'),
        ('KO', 'The Coca-Cola Company', 'stock'),
        ('PEP', 'PepsiCo Inc.', 'stock'),
        ('INTC', 'Intel Corporation', 'stock'),
        ('AMD', 'Advanced Micro Devices Inc.', 'stock'),
        ('bitcoin', 'Bitcoin (BTC)', 'crypto'),
        ('ethereum', 'Ethereum (ETH)', 'crypto'),
        ('tether', 'Tether (USDT)', 'crypto'),
        ('binancecoin', 'BNB (BNB)', 'crypto'),
        ('solana', 'Solana (SOL)', 'crypto'),
        ('ripple', 'XRP (XRP)', 'crypto'),
        ('usd-coin', 'USD Coin (USDC)', 'crypto'),
        ('cardano', 'Cardano (ADA)', 'crypto'),
        ('dogecoin', 'Dogecoin (DOGE)', 'crypto'),
        ('tron', 'TRON (TRX)', 'crypto'),
        ('chainlink', 'Chainlink (LINK)', 'crypto'),
        ('polkadot', 'Polkadot (DOT)', 'crypto'),
        ('litecoin', 'Litecoin (LTC)', 'crypto'),
        ('bitcoin-cash', 'Bitcoin Cash (BCH)', 'crypto'),
        ('stellar', 'Stellar (XLM)', 'crypto')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "asset_options"`);
  }
}
