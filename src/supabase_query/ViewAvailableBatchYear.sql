CREATE OR REPLACE VIEW "ViewAvailableBatchYear" AS
SELECT DISTINCT 
    CASE 
        WHEN raw_user_meta_data->>'batch_year' ~ '^\d+$' 
        THEN (raw_user_meta_data->>'batch_year')::INTEGER
        ELSE NULL
    END AS batch_year
FROM auth.users
WHERE 
    raw_user_meta_data->>'batch_year' IS NOT NULL AND
    raw_user_meta_data->>'batch_year' ~ '^\d+$' -- Only include values that can be parsed as integers
ORDER BY batch_year;
