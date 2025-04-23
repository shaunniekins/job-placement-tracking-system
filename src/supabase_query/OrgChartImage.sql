CREATE TABLE "OrgChartImage" (
  id INTEGER PRIMARY KEY,
  image_url TEXT NULL
);

-- Insert a single record that will always be updated
INSERT INTO "OrgChartImage" (id, image_url) VALUES (1, NULL);
