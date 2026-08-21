import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchasesTable1755100200000 implements MigrationInterface {
  name = 'CreatePurchasesTable1755100200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "assetSymbol" character varying NOT NULL,
        "assetType" character varying NOT NULL,
        "quantity" double precision NOT NULL,
        "purchasePriceAmount" double precision NOT NULL,
        "purchasePriceCurrency" character varying NOT NULL,
        "purchasedAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchases_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchases_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "purchases"`);
  }
}
