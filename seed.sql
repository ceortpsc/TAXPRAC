CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS client_masterfiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL,
    client_reference VARCHAR(80) NOT NULL,
    status VARCHAR(50) NOT NULL,
    defect_issue TEXT,
    account_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transmissions (
    submission_id VARCHAR(255) PRIMARY KEY,
    office_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    errors JSONB,
    external_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_masterfiles_office_status
    ON client_masterfiles (office_id, status);

CREATE INDEX IF NOT EXISTS idx_transmissions_office_status
    ON transmissions (office_id, status);

-- Production invariant:
-- This schema file intentionally contains no taxpayer/client seed rows.
-- Production data must be created only through authenticated, office-scoped workflows.
