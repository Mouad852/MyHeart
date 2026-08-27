-- ============================================================
-- Reconcile the schema with the entities
--
-- V1 named both timestamp columns created_at. The entities map requestedAt and
-- resultedAt, which are the names Hibernate produced and the names the live
-- databases carry. V1 never ran (see the note in patient-service V2), so the
-- disagreement has never been visible — until a clean clone, where lab-service
-- fails validation on two missing columns.
--
-- The entity names win. `requested_at` and `resulted_at` say when the doctor
-- asked and when the laboratory answered; two columns both called created_at
-- say only that a row was inserted, which is the least interesting fact about
-- either of them.
-- ============================================================

-- ── lab_requests.created_at → requested_at ──────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'lab_requests'
                  AND column_name = 'created_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'lab_requests'
                  AND column_name = 'requested_at')
    THEN
        ALTER TABLE lab_requests RENAME COLUMN created_at TO requested_at;
    END IF;
END $$;

ALTER TABLE lab_requests ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP;
UPDATE lab_requests SET requested_at = now() WHERE requested_at IS NULL;
ALTER TABLE lab_requests ALTER COLUMN requested_at SET NOT NULL;

-- ── lab_results.created_at → resulted_at ────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'lab_results'
                  AND column_name = 'created_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'lab_results'
                  AND column_name = 'resulted_at')
    THEN
        ALTER TABLE lab_results RENAME COLUMN created_at TO resulted_at;
    END IF;
END $$;

ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS resulted_at TIMESTAMP;
UPDATE lab_results SET resulted_at = now() WHERE resulted_at IS NULL;
ALTER TABLE lab_results ALTER COLUMN resulted_at SET NOT NULL;

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
