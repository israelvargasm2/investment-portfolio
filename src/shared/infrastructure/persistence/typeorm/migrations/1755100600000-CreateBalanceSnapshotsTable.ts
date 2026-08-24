import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBalanceSnapshotsTable1755100600000 implements MigrationInterface {
  name = 'CreateBalanceSnapshotsTable1755100600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "balance_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "totalAmount" double precision NOT NULL,
        "currency" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_balance_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_balance_snapshots_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "balance_snapshots"`);
  }
}
