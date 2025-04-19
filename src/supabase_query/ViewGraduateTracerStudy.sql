CREATE OR REPLACE VIEW "ViewGraduateTracerStudy" AS
SELECT 
  gts.*,
  a.email AS email,
  a.raw_user_meta_data->>'first_name' AS first_name,
  a.raw_user_meta_data->>'last_name' AS last_name,
  a.raw_user_meta_data->>'middle_name' AS middle_name,
  a.raw_user_meta_data->>'contact_number' AS contact_number, 
  a.raw_user_meta_data->>'address' AS address,
  a.raw_user_meta_data->>'birth_date' AS birth_date,
  a.raw_user_meta_data->>'college' AS college,
  a.raw_user_meta_data->>'program' AS program,
  a.raw_user_meta_data->>'batch_year' AS batch_year,
  a.raw_user_meta_data->>'gender' AS gender,
  a.raw_user_meta_data->>'user_type' AS user_type,
  a.raw_user_meta_data->>'account_status' AS account_status
FROM "GraduateTracerStudy" gts
JOIN auth.users a ON gts.alumni_id = a.id;