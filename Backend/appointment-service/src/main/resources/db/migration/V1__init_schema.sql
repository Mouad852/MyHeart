CREATE TABLE IF NOT EXISTS appointments (
    id                  BIGSERIAL PRIMARY KEY,
    patient_id          BIGINT          NOT NULL,
    doctor_id           BIGINT          NOT NULL,
    appointment_date    TIMESTAMPTZ     NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'SCHEDULED',
    notes               VARCHAR(1000),
    version             BIGINT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT chk_appt_status CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_appt_patient     ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor      ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date ON appointments(doctor_id, appointment_date);
