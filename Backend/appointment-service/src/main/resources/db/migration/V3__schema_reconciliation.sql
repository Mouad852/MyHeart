-- ============================================================
-- Reconcile the schema with the entity
--
-- Column names here are correct; the timestamp type is not. V1 and V2 declare
-- TIMESTAMPTZ, the entity maps LocalDateTime, and Hibernate validates that as
-- `timestamp without time zone`. See the note in patient-service V2 for why
-- the two ever diverged.
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
