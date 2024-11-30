CREATE VIEW "ViewOrgHierarchy" AS
WITH RECURSIVE "OrgHierarchy" AS (
  SELECT id, position, name, email, parent_id
  FROM "Organization"
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT child.id, child.position, child.name, child.email, child.parent_id
  FROM "Organization" child
  INNER JOIN "OrgHierarchy" parent ON child.parent_id = parent.id
)
SELECT * FROM "OrgHierarchy";
