CREATE VIEW "ViewAvailableBatchYear" AS
SELECT DISTINCT 
    (raw_user_meta_data->>'batch_year')::INTEGER AS batch_year
FROM auth.users
WHERE raw_user_meta_data->>'batch_year' IS NOT NULL
ORDER BY batch_year;
