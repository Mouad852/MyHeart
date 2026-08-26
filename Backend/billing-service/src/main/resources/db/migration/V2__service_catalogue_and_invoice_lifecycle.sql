-- ============================================================
-- A priced service catalogue, and an invoice that has a lifecycle
--
-- Two problems are fixed here.
--
-- Appointment-service billed every consultation at a hard-coded 100.00. A
-- clinic charges different amounts for different work, and the price of a
-- consultation is a business decision that should not live in another
-- service's source code.
--
-- Invoice creation was not idempotent. V1 declared a unique constraint on
-- appointment_id, but this database was created by Hibernate ddl-auto and then
-- baselined, so V1 never ran and the constraint does not exist. There is
-- already one appointment in this data carrying two invoices.
-- ============================================================

-- ── The service catalogue ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_services (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(40)     NOT NULL,
    name             VARCHAR(120)    NOT NULL,
    description      VARCHAR(500),
    price            NUMERIC(10,2)   NOT NULL,
    currency         VARCHAR(3)      NOT NULL DEFAULT 'MAD',
    duration_minutes INTEGER         NOT NULL DEFAULT 30,
    active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_clinic_service_code UNIQUE (code),
    CONSTRAINT chk_clinic_service_price CHECK (price >= 0),
    CONSTRAINT chk_clinic_service_duration CHECK (duration_minutes BETWEEN 5 AND 480)
);

-- Prices are illustrative and in Moroccan dirham, matching the demo data.
INSERT INTO clinic_services (code, name, description, price, duration_minutes) VALUES
    ('CONSULTATION',   'General consultation',   'Standard consultation with a general practitioner', 300.00, 30),
    ('FOLLOW_UP',      'Follow-up visit',        'Shorter review of an ongoing treatment',            180.00, 15),
    ('SPECIALIST',     'Specialist consultation','Consultation with a specialist',                    500.00, 45),
    ('LAB_REVIEW',     'Laboratory review',      'Review and explanation of laboratory results',      150.00, 15),
    ('PROCEDURE',      'Minor procedure',        'Minor procedure performed in the clinic',           850.00, 60)
ON CONFLICT (code) DO NOTHING;

-- ── Invoice lifecycle ───────────────────────────────────────
-- Drop whichever status constraint this database happens to carry.
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_invoice_status;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- PENDING described a state, not a stage. An invoice that has been sent to a
-- patient is ISSUED; one called off is VOID, which reads correctly next to
-- REFUNDED.
UPDATE invoices SET status = 'ISSUED' WHERE status IN ('PENDING', 'UNPAID');
UPDATE invoices SET status = 'VOID'   WHERE status = 'CANCELLED';

ALTER TABLE invoices
    ADD CONSTRAINT chk_invoice_status
    CHECK (status IN ('ISSUED', 'PAID', 'VOID', 'REFUNDED'));

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_code    VARCHAR(40);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency        VARCHAR(3) NOT NULL DEFAULT 'MAD';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_at       TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date        DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method  VARCHAR(40);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS void_reason     VARCHAR(500);

-- Existing rows predate these columns; give them sensible history.
UPDATE invoices SET issued_at = created_at WHERE issued_at IS NULL;
UPDATE invoices SET due_date = (created_at + INTERVAL '30 days')::date WHERE due_date IS NULL;
UPDATE invoices SET service_code = 'CONSULTATION' WHERE service_code IS NULL;

-- ── Idempotency ─────────────────────────────────────────────
-- Remove the duplicates already present, keeping the earliest invoice for each
-- appointment, then make a repeat impossible at the database level. A retried
-- billing call can no longer charge a patient twice.
DELETE FROM invoices a
    USING invoices b
    WHERE a.appointment_id = b.appointment_id
      AND a.id > b.id;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS uq_invoice_appointment;
ALTER TABLE invoices ADD CONSTRAINT uq_invoice_appointment UNIQUE (appointment_id);

CREATE INDEX IF NOT EXISTS idx_invoice_status   ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON invoices (due_date) WHERE status = 'ISSUED';
