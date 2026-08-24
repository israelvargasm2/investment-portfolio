import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reemplaza la tasa plana ("annualInterestRate") por una lista de tramos
 * ("rateTiers" jsonb) — algunas instituciones pagan una tasa hasta cierto
 * monto y otra distinta al excedente (ver domain/rate-tier.ts). Migra cada
 * cuenta existente a un único tramo ilimitado con la misma tasa que ya
 * tenía, así ninguna cuenta cargada antes de este cambio pierde su valor.
 */
export class AddRateTiersToAccounts1755100500000 implements MigrationInterface {
  name = 'AddRateTiersToAccounts1755100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN "rateTiers" jsonb`,
    );
    await queryRunner.query(`
      UPDATE "accounts"
      SET "rateTiers" = jsonb_build_array(
        jsonb_build_object('upToAmount', NULL, 'annualRate', "annualInterestRate")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "rateTiers" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN "annualInterestRate"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN "annualInterestRate" double precision`,
    );
    await queryRunner.query(`
      UPDATE "accounts"
      SET "annualInterestRate" = COALESCE(("rateTiers"->0->>'annualRate')::double precision, 0)
    `);
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "annualInterestRate" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "rateTiers"`);
  }
}
