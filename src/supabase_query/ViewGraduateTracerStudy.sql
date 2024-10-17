CREATE VIEW "ViewGraduateTracerStudy" AS
SELECT 
  gts.*,
  a.email AS email,
  a.raw_user_meta_data->>'first_name' AS first_name,
  a.raw_user_meta_data->>'last_name' AS last_name,
  a.raw_user_meta_data->>'middle_name' AS middle_name,
  a.raw_user_meta_data->>'contact_number' AS contact_number, 
  a.raw_user_meta_data->'address' AS address,
  a.raw_user_meta_data->'birth_date' AS birth_date
FROM "GraduateTracerStudy" gts
JOIN auth.users a ON gts.alumni_id = a.id;