DROP FUNCTION IF EXISTS get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_filtered_alumni_report_data(
  filter_college text,
  filter_program text,
  filter_batch_year text,
  search_term text
) RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'user_id', u.id,
    'first_name', u.raw_user_meta_data->>'first_name',
    'last_name', u.raw_user_meta_data->>'last_name',
    'middle_name', u.raw_user_meta_data->>'middle_name',
    'gender', u.raw_user_meta_data->>'gender',
    'present_employment_status', gts.present_employment_status,
    'agency', gts.agency,
    'program', u.raw_user_meta_data->>'program'
  )
  FROM auth.users u
  LEFT JOIN "GraduateTracerStudy" gts ON u.id = gts.alumni_id
  WHERE 
    u.raw_user_meta_data->>'user_type' = 'alumni'
    AND u.raw_user_meta_data->>'account_status' = 'approved'
    AND (filter_college IS NULL OR u.raw_user_meta_data->>'college' = filter_college)
    AND (filter_program IS NULL OR u.raw_user_meta_data->>'program' = filter_program)
    AND (filter_batch_year IS NULL OR u.raw_user_meta_data->>'batch_year' = filter_batch_year)
    AND (
      search_term IS NULL OR
      u.raw_user_meta_data->>'first_name' ILIKE '%' || search_term || '%' OR
      u.raw_user_meta_data->>'last_name' ILIKE '%' || search_term || '%' OR
      u.raw_user_meta_data->>'program' ILIKE '%' || search_term || '%' OR
      u.email ILIKE '%' || search_term || '%'
    )
  ORDER BY u.raw_user_meta_data->>'last_name' ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_filtered_alumni_report_data(TEXT, TEXT, TEXT, TEXT) TO authenticated;

