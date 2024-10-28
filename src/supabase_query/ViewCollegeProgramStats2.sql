CREATE VIEW "ViewCollegeProgramStats2" AS
SELECT
    a.raw_user_meta_data->>'college' AS college,
    a.raw_user_meta_data->>'program' AS program,
    a.raw_user_meta_data->>'batch_year' AS batch_year,
    
    COUNT(*) AS total_applications,
    COUNT(CASE WHEN ja.application_status = 'accepted' THEN 1 END) AS total_approved_applications

FROM
    "JobApplications" ja
JOIN
    auth.users a ON ja.applicant_id = a.id

WHERE
    a.raw_user_meta_data->>'college' IS NOT NULL
    AND a.raw_user_meta_data->>'program' IS NOT NULL
    AND a.raw_user_meta_data->>'batch_year' IS NOT NULL

GROUP BY
    a.raw_user_meta_data->>'college',
    a.raw_user_meta_data->>'program',
    a.raw_user_meta_data->>'batch_year';