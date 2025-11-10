-- Add disciplines array to Class
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "disciplines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
