CREATE OR REPLACE FUNCTION get_direct_application_stats()
RETURNS TABLE (
  status text,
  count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ja.application_status,
    COUNT(*)
  FROM "JobApplications" ja
  GROUP BY ja.application_status
  ORDER BY ja.application_status;
END;
$$;
