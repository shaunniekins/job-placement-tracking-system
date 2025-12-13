-- Add 'agency' column to GraduateTracerStudy table to fix saving issue
ALTER TABLE "GraduateTracerStudy" 
ADD COLUMN IF NOT EXISTS "agency" TEXT;
