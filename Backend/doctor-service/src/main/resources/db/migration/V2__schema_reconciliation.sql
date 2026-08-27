-- ============================================================
-- Reconcile the schema with the entity
--
-- V1 never ran (see the note in patient-service V2). Three things it declares
-- do not match the Doctor entity, and each of them breaks a clean boot:
--
--   specialization  the entity maps `specialty`; Hibernate validation fails
--   phone NOT NULL  the entity had no phone field at all, so an insert could
--                   never satisfy it
--   TIMESTAMPTZ     the entity maps LocalDateTime
--
-- The doctors page has been rendering `doctor.phone` since it was written,
-- against an API that has never been able to return one. The column is kept
-- and the field added to the entity rather than the other way round: a medical
-- register without a telephone number is the wrong answer to that mismatch.
-- ============================================================

-- ── specialization → specialty ──────────────────────────────
-- A Hibernate-built database already has `specialty`; a V1-built one has
-- `specialization`. Rename only in the second case.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'doctors'
                  AND column_name = 'specialization')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'doctors'
                  AND column_name = 'specialty')
    THEN
        ALTER TABLE doctors RENAME COLUMN specialization TO specialty;
    END IF;
END $$;

ALTER TABLE doctors ALTER COLUMN specialty SET NOT NULL;

-- ── phone ───────────────────────────────────────────────────
-- Nullable: every doctor already on file was created through an API that
-- could not accept one, so requiring it here would fail on existing rows.
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE doctors ALTER COLUMN phone DROP NOT NULL;

-- ── timestamps ──────────────────────────────────────────────
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
