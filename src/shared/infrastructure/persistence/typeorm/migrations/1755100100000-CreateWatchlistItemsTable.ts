import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWatchlistItemsTable1755100100000 implements MigrationInterface {
  name = 'CreateWatchlistItemsTable1755100100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "watchlist_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "assetSymbol" character varying NOT NULL,
        "assetType" character varying NOT NULL,
        "addedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_watchlist_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_watchlist_items_user_asset" UNIQUE ("userId", "assetSymbol", "assetType"),
        CONSTRAINT "FK_watchlist_items_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "watchlist_items"`);
  }
}
