CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS client_masterfiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    taxpayer_name VARCHAR(255) NOT NULL,
    ssn_masked VARCHAR(15) NOT NULL,
    status VARCHAR(50) NOT NULL,
    defect_issue TEXT,
    imf_data JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transmissions (
    submission_id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    errors JSONB,
    updated_at TIMESTAMP WITH TIME ZONE
);

INSERT INTO client_masterfiles (taxpayer_name, ssn_masked, status, defect_issue, imf_data)
VALUES 
('RONALD K JOHNSON', '***-**-7352', 'FREEZE (TC 570)', 'LTR 12C (Form 8962 Missing)', '{"account_balance": 0.00, "freeze_codes": ["TC 570"]}'),
('MARIA ROJAS', '***-**-8192', 'PROCESSING', 'Schedule C Substantiation', '{"account_balance": 1250.00, "freeze_codes": []}'),
('MARCUS PORTER', '***-**-4451', 'HARDSHIP', 'Delinquent Return 2023', '{"account_balance": -450.00, "freeze_codes": ["TC 514"]}');
