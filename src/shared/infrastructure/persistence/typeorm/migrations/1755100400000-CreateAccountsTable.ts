import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsTable1755100400000 implements MigrationInterface {
  name = 'CreateAccountsTable1755100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "institutionName" character varying NOT NULL,
        "institutionType" character varying NOT NULL,
        "balanceAmount" double precision NOT NULL,
        "balanceCurrency" character varying NOT NULL,
        "annualInterestRate" double precision NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}
