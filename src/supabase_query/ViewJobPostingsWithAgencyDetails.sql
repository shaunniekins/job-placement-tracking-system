CREATE VIEW "ViewJobPostingsWithAgencyDetails" AS
SELECT 
    jp.job_posting_id,
    jp.job_title,
    jp.job_description,
    jp.job_location,
    jp.job_type,
    jp.salary_range,
    jp.industry,
    jp.application_deadline,
    jp.date_posted,
    jp.job_status,
    au.id AS agency_id,
    au.email AS agency_email,
    au.raw_user_meta_data->>'first_name' AS agency_first_name,
    au.raw_user_meta_data->>'last_name' AS agency_last_name,
    au.raw_user_meta_data->>'companyName' AS agency_company_name,
    au.raw_user_meta_data->>'companyType' AS agency_company_type,
    au.raw_user_meta_data->>'address' AS agency_address,
    au.raw_user_meta_data->>'mobile_number' AS agency_mobile_number
FROM 
    public."JobPostings" jp
JOIN 
    auth.users au
ON 
    jp.agency_id = au.id
WHERE 
    au.raw_user_meta_data->>'user_type' = 'agency';
