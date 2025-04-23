DROP FUNCTION IF EXISTS get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT);

-- Create the function with the correct column name raw_user_meta_data
CREATE OR REPLACE FUNCTION get_filtered_alumni_report_data(
    filter_college TEXT DEFAULT NULL,
    filter_program TEXT DEFAULT NULL,
    filter_batch_year TEXT DEFAULT NULL,
    search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    middle_name TEXT,
    gender TEXT,
    present_employment_status TEXT,
    program TEXT,
    agency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.raw_user_meta_data->>'first_name' AS first_name,
        u.raw_user_meta_data->>'last_name' AS last_name,
        u.raw_user_meta_data->>'middle_name' AS middle_name,
        COALESCE(NULLIF(u.raw_user_meta_data->>'gender', ''), gts.sex) AS gender,
        gts.present_employment_status,
        u.raw_user_meta_data->>'program' AS program,
        gts.agency
    FROM
        auth.users u
    LEFT JOIN
        "GraduateTracerStudy" gts ON u.id = gts.alumni_id
    WHERE
        u.raw_user_meta_data->>'user_type' = 'alumni'
        AND u.raw_user_meta_data->>'account_status' = 'approved'
        AND (filter_college IS NULL OR LOWER(u.raw_user_meta_data->>'college') = LOWER(filter_college))
        AND (filter_program IS NULL OR LOWER(u.raw_user_meta_data->>'program') = LOWER(filter_program))
        AND (filter_batch_year IS NULL OR u.raw_user_meta_data->>'batch_year' = filter_batch_year)
        AND (search_term IS NULL OR (
            LOWER(u.raw_user_meta_data->>'first_name') ILIKE '%' || LOWER(search_term) || '%' OR
            LOWER(u.raw_user_meta_data->>'last_name') ILIKE '%' || LOWER(search_term) || '%' OR
            LOWER(u.raw_user_meta_data->>'id_number') ILIKE '%' || LOWER(search_term) || '%'
        ))
    ORDER BY
        LOWER(u.raw_user_meta_data->>'last_name');
END;
$$;

GRANT EXECUTE ON FUNCTION get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT) TO authenticated;

