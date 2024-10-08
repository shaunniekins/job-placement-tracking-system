CREATE VIEW public."ViewUsers" AS
SELECT
  users.id,
  users.email,
  users.raw_user_meta_data  AS meta_data
FROM auth.users;