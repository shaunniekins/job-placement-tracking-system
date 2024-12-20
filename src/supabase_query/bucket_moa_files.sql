-- add new bucket "moa_files" with mime type: "image/*,application/pdf"

-- add new policy for bucket "moa_files":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Policy name: Give users access to folder
---- Allowed operation: Select, Update, Delete
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- ((bucket_id = 'moa_files'::text) AND ((storage.foldername(name))[1] = 'public'::text) AND (auth.role() = 'authenticated'::text))

-- another: add new policy for bucket "moa_files":
---- Choose "Get started quickly"
---- Choose: "Give new users insert access to folder"
---- Policy name: Give users access to folder
---- Allowed operation: Insert
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- bucket_id = 'moa-files' AND (storage.foldername(name))[1] = 'public'