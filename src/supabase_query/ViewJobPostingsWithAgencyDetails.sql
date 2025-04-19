CREATE OR REPLACE VIEW "ViewJobPostingsWithAgencyDetails" AS
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
    jp.programs,
    jp.number_of_applicants,
    jp.accepted_applicants,
    jp.requirements, -- Added requirements
    au.id AS agency_id,
    au.email AS agency_email,
    au.raw_user_meta_data->>'first_name' AS agency_first_name,
    au.raw_user_meta_data->>'last_name' AS agency_last_name,
    au.raw_user_meta_data->>'company_name' AS agency_company_name,
    au.raw_user_meta_data->>'company_type' AS agency_company_type,
    au.raw_user_meta_data->>'address' AS agency_address,
    au.raw_user_meta_data->>'contact_number' AS agency_mobile_number
FROM
    public."JobPostings" jp
JOIN
    auth.users au
ON
    jp.agency_id = au.id
WHERE
    au.raw_user_meta_data->>'user_type' = 'agency';
