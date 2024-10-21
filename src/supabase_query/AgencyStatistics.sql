CREATE VIEW "AgencyStatistics" AS
SELECT 
    u.id AS agency_id, 
    COUNT(DISTINCT jp.job_posting_id) AS total_job_postings,
    COUNT(DISTINCT ja.job_application_id) AS total_job_applications,
    COUNT(DISTINCT as1.application_status_id) AS total_accepted_applications
FROM
    auth.users u
    LEFT JOIN "JobPostings" jp ON u.id = jp.agency_id
    LEFT JOIN "JobApplications" ja ON jp.job_posting_id = ja.job_posting_id
    LEFT JOIN "ApplicationStatus" as1 ON ja.job_application_id = as1.job_application_id
    AND as1.final_result = 'accepted'
WHERE u.raw_user_meta_data->>'user_type' = 'agency'
GROUP BY 
    u.id;