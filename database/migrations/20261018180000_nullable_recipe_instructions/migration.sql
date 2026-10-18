ALTER TABLE "Recipe" ALTER COLUMN "instructions" DROP NOT NULL;

UPDATE "Recipe" SET "instructions" = NULL WHERE BTRIM("instructions") = '';
