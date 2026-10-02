/*
# Create resources and borrowing_history tables

1. New Tables
- `resources` — stores all campus resources available for borrowing
  - id (uuid, PK)
  - name (text, not null)
  - category (text, not null) — one of: Books, Calculators, Electronics, Lab Equipment, Stationery, Study Materials, Other
  - description (text)
  - owner_name (text, not null)
  - owner_id (text, not null) — student ID of owner
  - owner_contact (text, not null)
  - condition (text) — New, Good, Fair, Used
  - availability_status (text, default 'Available') — Available or Borrowed
  - borrower_name (text, nullable)
  - borrower_id (text, nullable) — student ID of borrower
  - borrowed_at (timestamptz, nullable)
  - expected_return_date (date, nullable)
  - created_at (timestamptz, default now())
- `borrowing_history` — permanent record of every completed borrow/return transaction
  - id (uuid, PK)
  - resource_id (uuid, FK to resources)
  - resource_name (text)
  - borrower_name (text)
  - borrower_id (text)
  - borrowed_at (timestamptz)
  - returned_at (timestamptz)
  - expected_return_date (date)

2. Security
- RLS enabled on both tables.
- This is a single-tenant no-auth campus app: all CRUD is open to anon + authenticated.
- USING (true) is intentional because resource data is shared campus-wide.

3. Indexes
- resources(availability_status) for filtering
- resources(category) for filtering
- resources(name) for search
- borrowing_history(resource_id) for lookups
- borrowing_history(borrower_id) for user history
*/

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Books','Calculators','Electronics','Lab Equipment','Stationery','Study Materials','Other')),
  description text DEFAULT '',
  owner_name text NOT NULL,
  owner_id text NOT NULL,
  owner_contact text NOT NULL,
  condition text DEFAULT 'Good' CHECK (condition IN ('New','Good','Fair','Used')),
  availability_status text NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available','Borrowed')),
  borrower_name text,
  borrower_id text,
  borrowed_at timestamptz,
  expected_return_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS borrowing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  resource_name text NOT NULL,
  borrower_name text NOT NULL,
  borrower_id text NOT NULL,
  borrowed_at timestamptz NOT NULL,
  returned_at timestamptz DEFAULT now(),
  expected_return_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_history ENABLE ROW LEVEL SECURITY;

-- resources: full CRUD for anon + authenticated (shared campus data)
DROP POLICY IF EXISTS "anon_select_resources" ON resources;
CREATE POLICY "anon_select_resources" ON resources FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_resources" ON resources;
CREATE POLICY "anon_insert_resources" ON resources FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_resources" ON resources;
CREATE POLICY "anon_update_resources" ON resources FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_resources" ON resources;
CREATE POLICY "anon_delete_resources" ON resources FOR DELETE
TO anon, authenticated USING (true);

-- borrowing_history: full CRUD for anon + authenticated
DROP POLICY IF EXISTS "anon_select_history" ON borrowing_history;
CREATE POLICY "anon_select_history" ON borrowing_history FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_history" ON borrowing_history;
CREATE POLICY "anon_insert_history" ON borrowing_history FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_history" ON borrowing_history;
CREATE POLICY "anon_update_history" ON borrowing_history FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_history" ON borrowing_history;
CREATE POLICY "anon_delete_history" ON borrowing_history FOR DELETE
TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(availability_status);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name);
CREATE INDEX IF NOT EXISTS idx_history_resource_id ON borrowing_history(resource_id);
CREATE INDEX IF NOT EXISTS idx_history_borrower_id ON borrowing_history(borrower_id);
