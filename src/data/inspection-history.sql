-- Mock inspection history for the Inspector demo.
-- This is presentation data for a future database/API integration.

CREATE TABLE inspections (
  id INTEGER PRIMARY KEY,
  property_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  inspector_name TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  status TEXT NOT NULL,
  completed_checks INTEGER NOT NULL,
  total_checks INTEGER NOT NULL
);

CREATE TABLE inspection_checks (
  id INTEGER PRIMARY KEY,
  inspection_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

CREATE TABLE inspection_photos (
  id INTEGER PRIMARY KEY,
  inspection_id INTEGER NOT NULL,
  check_id INTEGER,
  file_name TEXT NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id),
  FOREIGN KEY (check_id) REFERENCES inspection_checks(id)
);

INSERT INTO inspections (
  id, property_name, street_address, city, state, zip_code,
  inspector_name, inspection_date, status, completed_checks, total_checks
) VALUES
  (1001, '18 Hawthorn Lane', '18 Hawthorn Lane', 'Merriam', 'KS', '66203',
   'Alex Kim', '2024-06-01', 'In progress', 0, 5),
  (1002, '42 Oak Street', '42 Oak Street', 'Overland Park', 'KS', '66210',
   'Alex Kim', '2024-05-28', 'Complete', 5, 5),
  (1003, '907 Riverbend Drive', '907 Riverbend Drive', 'Kansas City', 'MO', '64111',
   'Alex Kim', '2024-05-17', 'Needs follow-up', 4, 5),
  (1004, '311 Cedar Court', '311 Cedar Court', 'Shawnee', 'KS', '66216',
   'Jordan Lee', '2024-05-09', 'Complete', 5, 5);

INSERT INTO inspection_checks (id, inspection_id, title, status, note) VALUES
  (1, 1001, 'Exterior surfaces', 'pending', NULL),
  (2, 1001, 'Entry & access', 'pending', NULL),
  (3, 1001, 'Interior condition', 'pending', NULL),
  (4, 1001, 'Systems & utilities', 'pending', NULL),
  (5, 1001, 'Safety & closeout', 'pending', NULL),
  (6, 1002, 'Exterior surfaces', 'complete', 'Siding and foundation appeared to be in good condition.'),
  (7, 1002, 'Entry & access', 'complete', 'Front steps are secure and all exterior doors latch properly.'),
  (8, 1002, 'Interior condition', 'complete', 'No visible moisture damage found during walkthrough.'),
  (9, 1002, 'Systems & utilities', 'complete', 'HVAC, plumbing, and electrical systems tested normally.'),
  (10, 1002, 'Safety & closeout', 'complete', 'Smoke and carbon monoxide detectors were present.'),
  (11, 1003, 'Exterior surfaces', 'complete', 'Minor cracking noted near the rear foundation.'),
  (12, 1003, 'Entry & access', 'complete', 'Side gate latch needs adjustment.'),
  (13, 1003, 'Interior condition', 'complete', 'Small ceiling stain documented in upstairs hallway.'),
  (14, 1003, 'Systems & utilities', 'complete', 'Water heater is nearing the end of its expected service life.'),
  (15, 1003, 'Safety & closeout', 'pending', NULL),
  (16, 1004, 'Exterior surfaces', 'complete', 'Roof and exterior drainage were clear.'),
  (17, 1004, 'Entry & access', 'complete', 'All entries were accessible and secure.'),
  (18, 1004, 'Interior condition', 'complete', 'Interior finishes were in expected condition for the home age.'),
  (19, 1004, 'Systems & utilities', 'complete', 'No significant system concerns observed.'),
  (20, 1004, 'Safety & closeout', 'complete', 'Final safety review completed with no open items.');

INSERT INTO inspection_photos (id, inspection_id, check_id, file_name) VALUES
  (1, 1002, 6, 'oak-street-front-foundation.jpg'),
  (2, 1002, 9, 'oak-street-hvac-label.jpg'),
  (3, 1003, 11, 'riverbend-rear-foundation.jpg'),
  (4, 1003, 13, 'riverbend-hallway-stain.jpg'),
  (5, 1004, 16, 'cedar-court-roofline.jpg');

-- Example history query for a future history view.
SELECT
  property_name,
  city || ', ' || state || ' ' || zip_code AS location,
  inspection_date,
  status,
  completed_checks || '/' || total_checks AS progress
FROM inspections
ORDER BY inspection_date DESC;
