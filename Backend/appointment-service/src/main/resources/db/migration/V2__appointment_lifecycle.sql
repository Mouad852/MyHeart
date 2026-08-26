-- ============================================================
-- Appointment lifecycle
--
-- V1 allowed only SCHEDULED, COMPLETED and CANCELLED, which cannot express
-- "a patient asked for this slot but the desk has not agreed yet" or "the
-- patient did not turn up". Both matter: the first is how a patient books,
-- the second is a number every clinic tracks.
--
-- SCHEDULED becomes CONFIRMED. Existing rows were all created by staff, and
-- a staff booking is an agreed slot by definition.
-- ============================================================

-- The old CHECK constraint has to go before the data can be rewritten.
--
-- Two names are possible. This database was created by Hibernate ddl-auto and
-- then baselined by Flyway, so V1 never ran against it and the live constraint
-- carries Hibernate's generated name. A database built from V1 has the name the
-- script chose. Drop whichever is present.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appt_status;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

UPDATE appointments SET status = 'CONFIRMED' WHERE status = 'SCHEDULED';

ALTER TABLE appointments
    ADD CONSTRAINT chk_appt_status
    CHECK (status IN ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

-- How long the slot occupies the calendar. Held per row rather than read from
-- configuration so that changing the clinic default later cannot silently
-- reshape appointments that are already booked.
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appt_duration;
ALTER TABLE appointments
    ADD CONSTRAINT chk_appt_duration CHECK (duration_minutes BETWEEN 5 AND 480);

-- Cancellations and no-shows are worth explaining to whoever reads the record
-- afterwards.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status_changed_at   TIMESTAMPTZ;

UPDATE appointments SET status_changed_at = updated_at WHERE status_changed_at IS NULL;

-- Conflict detection scans a doctor's or a patient's active appointments
-- inside a time window on every booking, so both need an index that leads
-- with the owner and then the date.
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date_status
    ON appointments (doctor_id, appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_appt_patient_date_status
    ON appointments (patient_id, appointment_date, status);
