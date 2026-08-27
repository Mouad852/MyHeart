-- ============================================================
-- Reconcile the schema with the entities
--
-- V1 predates three fields the entities now require, and never ran anywhere
-- (see the note in patient-service V2), so on a clean database the service
-- fails Hibernate validation before it serves a request:
--
--   prescriptions.diagnosis        what the prescription is for
--   prescription_items.frequency   how often the medicine is taken
--   prescription_items.instructions  the "how to take it" line the printed
--                                    document runs full width under each drug
--
-- The last of those is already drawn by the PDF writer, from a field the
-- database has never had a column for.
-- ============================================================

-- ── prescriptions.diagnosis ─────────────────────────────────
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis VARCHAR(255);

-- Existing rows have no diagnosis and nowhere to get one. They are marked as
-- such rather than given a plausible-looking condition: a prescription that
-- states an invented diagnosis is worse than one that admits to none.
UPDATE prescriptions SET diagnosis = 'Not recorded' WHERE diagnosis IS NULL;
ALTER TABLE prescriptions ALTER COLUMN diagnosis SET NOT NULL;

-- ── prescription_items ──────────────────────────────────────
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS frequency    VARCHAR(255);
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS instructions VARCHAR(500);

UPDATE prescription_items SET frequency = 'Not recorded' WHERE frequency IS NULL;
ALTER TABLE prescription_items ALTER COLUMN frequency SET NOT NULL;

-- dosage and duration are nullable in V1 and non-null on the entity. Hibernate
-- validates existence and type, not nullability, so this is a data-integrity
-- fix rather than a boot fix.
UPDATE prescription_items SET dosage   = 'Not recorded' WHERE dosage   IS NULL;
UPDATE prescription_items SET duration = 'Not recorded' WHERE duration IS NULL;
ALTER TABLE prescription_items ALTER COLUMN dosage   SET NOT NULL;
ALTER TABLE prescription_items ALTER COLUMN duration SET NOT NULL;

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
