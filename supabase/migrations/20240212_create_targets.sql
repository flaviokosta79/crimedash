-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON targets;

-- Drop the existing table if it exists
DROP TABLE IF EXISTS targets CASCADE;

-- Create the targets table
CREATE TABLE targets (
    id BIGSERIAL PRIMARY KEY,
    unit VARCHAR(10) NOT NULL,
    crime_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(unit, crime_type, year, semester)
);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_targets_updated_at
    BEFORE UPDATE ON targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON targets
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Enable update for all users" ON targets
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Insert initial data for 1º semester 2025
INSERT INTO targets (unit, crime_type, target_value, year, semester) VALUES
-- 1ª RISP
('RISP 1', 'letalidade violenta', 15, 2025, 1),
('RISP 1', 'roubo de veículo', 50, 2025, 1),
('RISP 1', 'roubo de rua', 100, 2025, 1),
('RISP 1', 'roubo de carga', 20, 2025, 1),

-- 2ª RISP
('RISP 2', 'letalidade violenta', 15, 2025, 1),
('RISP 2', 'roubo de veículo', 50, 2025, 1),
('RISP 2', 'roubo de rua', 100, 2025, 1),
('RISP 2', 'roubo de carga', 20, 2025, 1),

-- 3ª RISP
('RISP 3', 'letalidade violenta', 15, 2025, 1),
('RISP 3', 'roubo de veículo', 50, 2025, 1),
('RISP 3', 'roubo de rua', 100, 2025, 1),
('RISP 3', 'roubo de carga', 20, 2025, 1),

-- 4ª RISP
('RISP 4', 'letalidade violenta', 15, 2025, 1),
('RISP 4', 'roubo de veículo', 50, 2025, 1),
('RISP 4', 'roubo de rua', 100, 2025, 1),
('RISP 4', 'roubo de carga', 20, 2025, 1),

-- 5ª RISP
('RISP 5', 'letalidade violenta', 15, 2025, 1),
('RISP 5', 'roubo de veículo', 50, 2025, 1),
('RISP 5', 'roubo de rua', 100, 2025, 1),
('RISP 5', 'roubo de carga', 20, 2025, 1),

-- 6ª RISP
('RISP 6', 'letalidade violenta', 15, 2025, 1),
('RISP 6', 'roubo de veículo', 50, 2025, 1),
('RISP 6', 'roubo de rua', 100, 2025, 1),
('RISP 6', 'roubo de carga', 20, 2025, 1),

-- 7ª RISP
('RISP 7', 'letalidade violenta', 15, 2025, 1),
('RISP 7', 'roubo de veículo', 50, 2025, 1),
('RISP 7', 'roubo de rua', 100, 2025, 1),
('RISP 7', 'roubo de carga', 20, 2025, 1),

-- 10º BPM
('AISP 10', 'letalidade violenta', 3, 2025, 1),
('AISP 10', 'roubo de veículo', 10, 2025, 1),
('AISP 10', 'roubo de rua', 20, 2025, 1),
('AISP 10', 'roubo de carga', 4, 2025, 1),

-- 28º BPM
('AISP 28', 'letalidade violenta', 4, 2025, 1),
('AISP 28', 'roubo de veículo', 15, 2025, 1),
('AISP 28', 'roubo de rua', 25, 2025, 1),
('AISP 28', 'roubo de carga', 5, 2025, 1),

-- 33º BPM
('AISP 33', 'letalidade violenta', 3, 2025, 1),
('AISP 33', 'roubo de veículo', 12, 2025, 1),
('AISP 33', 'roubo de rua', 22, 2025, 1),
('AISP 33', 'roubo de carga', 4, 2025, 1),

-- 37º BPM
('AISP 37', 'letalidade violenta', 4, 2025, 1),
('AISP 37', 'roubo de veículo', 13, 2025, 1),
('AISP 37', 'roubo de rua', 23, 2025, 1),
('AISP 37', 'roubo de carga', 5, 2025, 1),

-- 43º BPM
('AISP 43', 'letalidade violenta', 3, 2025, 1),
('AISP 43', 'roubo de veículo', 11, 2025, 1),
('AISP 43', 'roubo de rua', 21, 2025, 1),
('AISP 43', 'roubo de carga', 4, 2025, 1);
