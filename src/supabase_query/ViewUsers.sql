CREATE VIEW public."ViewUsers" AS
SELECT
  users.id,
  users.email,
  users.raw_user_meta_data  AS meta_data,
  users.created_at,
  users.updated_at
FROM auth.users;