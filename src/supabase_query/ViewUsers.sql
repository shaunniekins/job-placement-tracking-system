CREATE OR REPLACE VIEW "ViewUsers" AS
SELECT
    id,
    email,
    raw_user_meta_data AS meta_data, -- Alias raw_user_meta_data as meta_data
    created_at,
    updated_at,
    last_sign_in_at
FROM
    auth.users;