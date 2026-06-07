-- Team Ledger - Add Incomes Table
-- Version: 002

-- Add income_category type
CREATE TYPE income_category AS ENUM (
  'project_income', 'payment_received', 'refund',
  'bonus', 'investment', 'other_income'
);

-- Incomes Table
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category income_category NOT NULL DEFAULT 'other_income',
  description TEXT,
  image_url TEXT,
  project_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incomes_team_id ON incomes(team_id);
CREATE INDEX idx_incomes_user_id ON incomes(user_id);
CREATE INDEX idx_incomes_date ON incomes(date);
CREATE INDEX idx_incomes_category ON incomes(category);

-- RLS Policies for incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Team members can see all incomes in their team
CREATE POLICY "Team members can view incomes"
  ON incomes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = incomes.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team members can insert incomes in their team
CREATE POLICY "Team members can insert incomes"
  ON incomes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = incomes.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team members can update incomes in their team
CREATE POLICY "Team members can update incomes"
  ON incomes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = incomes.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team members can delete incomes in their team
CREATE POLICY "Team members can delete incomes"
  ON incomes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = incomes.team_id
      AND team_members.user_id = auth.uid()
    )
  );
