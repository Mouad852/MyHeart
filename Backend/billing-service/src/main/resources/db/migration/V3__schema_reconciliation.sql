-- ============================================================
-- Reconcile the schema with the entity
--
-- The Invoice entity carries `paidAt`, which no migration ever created. On a
-- database built from V1 and V2 the service does not start: Hibernate
-- validation reports a missing column. See the note in patient-service V2.
-- ============================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Invoices already settled predate the column. The moment of payment was not
-- recorded separately, and updated_at is the closest honest approximation of
-- it — the payment is the last thing that happened to a paid invoice.
UPDATE invoices
   SET paid_at = updated_at
 WHERE status = 'PAID'
   AND paid_at IS NULL;

-- ── timestamps ──────────────────────────────────────────────
-- due_date is a DATE and maps to LocalDate; it is left alone.
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
