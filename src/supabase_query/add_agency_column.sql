-- Add the 'agency' column to the GraduateTracerStudy table if it doesn't exist
ALTER TABLE "GraduateTracerStudy"
ADD COLUMN IF NOT EXISTS agency TEXT;
