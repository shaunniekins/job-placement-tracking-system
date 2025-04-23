DROP FUNCTION IF EXISTS get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_filtered_alumni_report_data(
  filter_college text,
  filter_program text,
  filter_batch_year text,
  search_term text
) 
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  middle_name text,
  gender text,
  present_employment_status text,
  program text,
  agency text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.raw_user_meta_data->>'middle_name' as middle_name,
    u.raw_user_meta_data->>'gender' as gender,
    gts.present_employment_status,
    u.raw_user_meta_data->>'program' as program,
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
    AND (search_term IS NULL 
         OR LOWER(u.raw_user_meta_data->>'first_name') ILIKE '%' || LOWER(search_term) || '%'
         OR LOWER(u.raw_user_meta_data->>'last_name') ILIKE '%' || LOWER(search_term) || '%'
         OR LOWER(u.raw_user_meta_data->>'id_number') ILIKE '%' || LOWER(search_term) || '%')
  ORDER BY 
    u.raw_user_meta_data->>'last_name';
END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT) TO authenticated;
