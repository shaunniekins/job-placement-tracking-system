-- Function to get application stats by college using the view
CREATE OR REPLACE FUNCTION get_view_stats_by_college(
  batch_year text DEFAULT NULL,
  selected_college text DEFAULT NULL,
  selected_program text DEFAULT NULL
)
RETURNS TABLE (
  group_name text,
  applied_count bigint,
  interview_count bigint,
  exam_count bigint,
  accepted_count bigint,
  rejected_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    UPPER(COALESCE(applicant_college, 'UNKNOWN')) as group_name,
    COUNT(*) FILTER (WHERE application_status = 'pending') as applied_count,
    COUNT(*) FILTER (WHERE application_status = 'interview') as interview_count,
    COUNT(*) FILTER (WHERE application_status = 'examination') as exam_count,
    COUNT(*) FILTER (WHERE application_status = 'accepted') as accepted_count,
    COUNT(*) FILTER (WHERE application_status = 'rejected') as rejected_count
  FROM "ViewJobApplicationsWithDetails" 
  WHERE 
    (batch_year IS NULL OR batch_year = '' OR applicant_batch_year::text = batch_year)
    AND (selected_college IS NULL OR selected_college = '' OR LOWER(applicant_college) = LOWER(selected_college))
    AND (selected_program IS NULL OR selected_program = '' OR LOWER(applicant_program) = LOWER(selected_program))
  GROUP BY applicant_college
  ORDER BY group_name;
END;
$$;

-- Function to get application stats by program using the view
CREATE OR REPLACE FUNCTION get_view_stats_by_program(
  batch_year text DEFAULT NULL,
  selected_college text DEFAULT NULL,
  selected_program text DEFAULT NULL
)
RETURNS TABLE (
  group_name text,
  applied_count bigint,
  interview_count bigint,
  exam_count bigint,
  accepted_count bigint,
  rejected_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    UPPER(COALESCE(applicant_program, 'UNKNOWN')) as group_name,
    COUNT(*) FILTER (WHERE application_status = 'pending') as applied_count,
    COUNT(*) FILTER (WHERE application_status = 'interview') as interview_count,
    COUNT(*) FILTER (WHERE application_status = 'examination') as exam_count,
    COUNT(*) FILTER (WHERE application_status = 'accepted') as accepted_count,
    COUNT(*) FILTER (WHERE application_status = 'rejected') as rejected_count
  FROM "ViewJobApplicationsWithDetails" 
  WHERE
    (batch_year IS NULL OR batch_year = '' OR applicant_batch_year::text = batch_year)
    AND (selected_college IS NULL OR selected_college = '' OR LOWER(applicant_college) = LOWER(selected_college))
    AND (selected_program IS NULL OR selected_program = '' OR LOWER(applicant_program) = LOWER(selected_program))
  GROUP BY applicant_program
  ORDER BY group_name;
END;
$$;
