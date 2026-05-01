import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders1700000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "description" character varying(500) NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_user" FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_orders_user_id" ON "orders" ("userId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_orders_user_id"`);
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
