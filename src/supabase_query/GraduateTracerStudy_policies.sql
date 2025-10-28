-- Create RLS policies for GraduateTracerStudy table to allow authenticated users to read data

-- Enable RLS on the table (if not already enabled)
ALTER TABLE "GraduateTracerStudy" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read GraduateTracerStudy records
CREATE POLICY "Allow authenticated users to read GraduateTracerStudy" ON "GraduateTracerStudy"
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to read their own GTS records (more restrictive)
-- CREATE POLICY "Users can read their own GTS records" ON "GraduateTracerStudy"
-- FOR SELECT USING (auth.uid() = alumni_id);

-- If you want to allow all authenticated users to read all GTS records, use the first policy
-- If you want users to only read their own records, use the second policy (commented out)