-- add new bucket "orgchart-images" with mime type: "image/*"

-- add new policy for bucket "orgchart-images":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Policy name: Give users access to folder
---- Allowed operation: All
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- ((bucket_id = 'orgchart-images'::text) AND ((storage.foldername(name))[1] = 'public'::text) AND (auth.role() = 'authenticated'::text))
