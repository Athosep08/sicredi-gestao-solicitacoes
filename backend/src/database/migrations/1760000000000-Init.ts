import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1760000000000 implements MigrationInterface {
  name = 'Init1760000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);

    await q.query(`CREATE TYPE "user_role" AS ENUM ('requester', 'agent', 'supervisor')`);
    await q.query(`CREATE TYPE "priority_level" AS ENUM ('low', 'medium', 'high')`);
    await q.query(`CREATE TYPE "request_status" AS ENUM ('open', 'in_analysis', 'approved', 'rejected')`);
    await q.query(`CREATE TYPE "comment_visibility" AS ENUM ('internal', 'external')`);

    await q.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "role" "user_role" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "areas" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "area_id" uuid NOT NULL REFERENCES "areas"("id"),
        "priority" "priority_level" NOT NULL,
        "status" "request_status" NOT NULL DEFAULT 'open',
        "requester_id" uuid NOT NULL REFERENCES "users"("id"),
        "resolved_by_id" uuid REFERENCES "users"("id"),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )`);
    await q.query(`CREATE INDEX "idx_requests_status" ON "requests" ("status") WHERE "deleted_at" IS NULL`);
    await q.query(`CREATE INDEX "idx_requests_created_at" ON "requests" ("created_at" DESC)`);
    await q.query(`CREATE INDEX "idx_requests_requester" ON "requests" ("requester_id")`);

    await q.query(`
      CREATE TABLE "request_status_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" uuid NOT NULL REFERENCES "requests"("id"),
        "author_id" uuid NOT NULL REFERENCES "users"("id"),
        "status" "request_status" NOT NULL,
        "comment" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_history_request" ON "request_status_history" ("request_id", "created_at")`);

    await q.query(`
      CREATE TABLE "request_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" uuid NOT NULL REFERENCES "requests"("id"),
        "author_id" uuid NOT NULL REFERENCES "users"("id"),
        "content" text NOT NULL,
        "visibility" "comment_visibility" NOT NULL DEFAULT 'external',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_comments_request" ON "request_comments" ("request_id", "created_at")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "request_comments"`);
    await q.query(`DROP TABLE "request_status_history"`);
    await q.query(`DROP TABLE "requests"`);
    await q.query(`DROP TABLE "areas"`);
    await q.query(`DROP TABLE "users"`);
    await q.query(`DROP TYPE "comment_visibility"`);
    await q.query(`DROP TYPE "request_status"`);
    await q.query(`DROP TYPE "priority_level"`);
    await q.query(`DROP TYPE "user_role"`);
  }
}
