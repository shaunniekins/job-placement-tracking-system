CREATE VIEW "ViewJobApplicationsWithDetails" AS
SELECT
    ja.job_application_id,
    ja.application_status,
    ja.application_date,
    
    -- Applicant details extracted from JSON
    a.id AS applicant_id,
    a.email AS applicant_email,
    a.raw_user_meta_data->>'first_name' AS applicant_first_name,
    a.raw_user_meta_data->>'last_name' AS applicant_last_name,
    a.raw_user_meta_data->>'contact_number' AS applicant_mobile_number,
    
    -- Job Posting details
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
    
    -- Agency details extracted from JSON
    ag.id AS agency_id,
    ag.email AS agency_email,
    ag.raw_user_meta_data->>'company_name' AS agency_company_name,
    ag.raw_user_meta_data->>'company_type' AS agency_company_type,
    ag.raw_user_meta_data->>'address' AS agency_address,
    ag.raw_user_meta_data->>'contact_number' AS agency_mobile_number
    
FROM
    "JobApplications" ja
JOIN
    "JobPostings" jp ON ja.job_posting_id = jp.job_posting_id
JOIN
    auth.users a ON ja.applicant_id = a.id
JOIN
    auth.users ag ON jp.agency_id = ag.id;
