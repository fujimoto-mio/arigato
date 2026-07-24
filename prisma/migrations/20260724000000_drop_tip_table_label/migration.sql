-- Table numbers were removed from the whole product; drop the unused column.
ALTER TABLE "Tip" DROP COLUMN IF EXISTS "tableLabel";
