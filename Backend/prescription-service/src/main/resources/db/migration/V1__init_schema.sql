CREATE TABLE IF NOT EXISTS prescriptions (
    id          BIGSERIAL PRIMARY KEY,
    patient_id  BIGINT          NOT NULL,
    doctor_id   BIGINT          NOT NULL,
    notes       VARCHAR(1000),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prescription_items (
    id                  BIGSERIAL PRIMARY KEY,
    prescription_id     BIGINT          NOT NULL REFERENCES prescriptions(id),
    medicine_name       VARCHAR(255)    NOT NULL,
    dosage              VARCHAR(255),
    duration            VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_presc_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_presc_doctor  ON prescriptions(doctor_id);
