CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE INDEX IF NOT EXISTS idx_client_masterfiles_office_status
    ON client_masterfiles (office_id, status);

CREATE INDEX IF NOT EXISTS idx_transmissions_office_status
    ON transmissions (office_id, status);

SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;

SHOW autovacuum_vacuum_scale_factor;
SHOW autovacuum_vacuum_cost_limit;
