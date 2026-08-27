-- ============================================================
-- Reconcile the schema with the entities
--
-- V1 was written to describe a schema that already existed. It never ran:
-- these databases were created by Hibernate ddl-auto and then baselined by
-- Flyway, so V1 was recorded as applied without executing. The consequence is
-- that a clean clone builds a schema nobody has ever booted a service against.
--
-- Every service now carries one of these. They are written to be correct in
-- both worlds — a database built from V1, and a database built by Hibernate —
-- because both exist and neither can be assumed.
--
-- Here the only difference is the timestamp type. V1 declares TIMESTAMPTZ;
-- the entities map LocalDateTime, which Hibernate validates as
-- `timestamp without time zone`. On a database built from V1, validation
-- would fail at boot on every timestamp column in the service.
-- ============================================================

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND data_type = 'timestamp with time zone'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE timestamp without time zone',
            r.table_name, r.column_name);
    END LOOP;
END $$;
