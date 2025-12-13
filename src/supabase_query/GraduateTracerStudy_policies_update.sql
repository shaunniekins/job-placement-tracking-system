-- Allow authenticated users to insert their own GTS records
CREATE POLICY "Allow authenticated users to insert their own GTS records" ON "GraduateTracerStudy"
FOR INSERT WITH CHECK (auth.uid() = alumni_id);

-- Allow authenticated users to update their own GTS records
CREATE POLICY "Allow authenticated users to update their own GTS records" ON "GraduateTracerStudy"
FOR UPDATE USING (auth.uid() = alumni_id) WITH CHECK (auth.uid() = alumni_id);
