CREATE VIEW "ViewCollegeProgramStats" AS
SELECT 
    raw_user_meta_data->>'college' AS college,
    raw_user_meta_data->>'program' AS program,
    raw_user_meta_data->>'batch_year' AS batch_year,
    COUNT(*) AS total_population,
    COUNT(CASE WHEN raw_user_meta_data->>'is_currently_employed' = 'yes' THEN 1 END) AS employed_count,
    COUNT(CASE WHEN raw_user_meta_data->>'is_course_aligned_with_job' = 'yes' THEN 1 END) AS course_aligned_count,
    COUNT(CASE WHEN raw_user_meta_data->>'scholarship' IS NOT NULL 
                AND raw_user_meta_data->>'scholarship' != 'n/a' 
                AND raw_user_meta_data->>'scholarship' != '' THEN 1 END) AS scholarship_count
FROM auth.users
WHERE raw_user_meta_data->>'college' IS NOT NULL
AND raw_user_meta_data->>'program' IS NOT NULL
AND raw_user_meta_data->>'batch_year' IS NOT NULL
AND raw_user_meta_data->>'account_status' = 'approved'
AND raw_user_meta_data->>'user_type' = 'alumni'
GROUP BY raw_user_meta_data->>'college', raw_user_meta_data->>'program', raw_user_meta_data->>'batch_year';