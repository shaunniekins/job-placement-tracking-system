-- Drop the function if it exists with potentially wrong arguments, just in case
DROP FUNCTION IF EXISTS get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT);

-- Create the function with the correct signature and logic
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
    gender TEXT, -- This will hold the coalesced value
    present_employment_status TEXT,
    agency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer security to ensure permissions within the function
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.raw_user_meta_data->>'first_name' AS first_name,
        u.raw_user_meta_data->>'last_name' AS last_name,
        u.raw_user_meta_data->>'middle_name' AS middle_name,
        -- Use COALESCE: prioritize user metadata 'gender', fallback to GTS 'sex'
        -- NULLIF treats empty string '' as NULL, so COALESCE can work correctly
        COALESCE(NULLIF(u.raw_user_meta_data->>'gender', ''), gts.sex) AS gender,
        gts.present_employment_status,
        gts.agency -- Ensure this is correctly selected from the GTS table
    FROM
        auth.users u
    LEFT JOIN
        "GraduateTracerStudy" gts ON u.id = gts.alumni_id
    WHERE
        u.raw_user_meta_data->>'user_type' = 'alumni'
        AND u.raw_user_meta_data->>'account_status' = 'approved'
        -- Apply filters, checking for NULL to ignore filter if not provided
        AND (filter_college IS NULL OR u.raw_user_meta_data->>'college' = filter_college)
        AND (filter_program IS NULL OR u.raw_user_meta_data->>'program' = filter_program)
        AND (filter_batch_year IS NULL OR u.raw_user_meta_data->>'batch_year' = filter_batch_year)
        AND (search_term IS NULL OR (
            u.raw_user_meta_data->>'first_name' ILIKE '%' || search_term || '%' OR
            u.raw_user_meta_data->>'last_name' ILIKE '%' || search_term || '%'
        ));
END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT) TO anon;

