CREATE TABLE IF NOT EXISTS invoices (
    id              BIGSERIAL PRIMARY KEY,
    appointment_id  BIGINT          NOT NULL,
    patient_id      BIGINT          NOT NULL,
    amount          NUMERIC(10,2)   NOT NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'UNPAID',
    description     VARCHAR(500),
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_invoice_appointment UNIQUE (appointment_id),
    CONSTRAINT chk_invoice_status CHECK (status IN ('PAID','UNPAID'))
);
CREATE INDEX IF NOT EXISTS idx_invoice_patient ON invoices(patient_id);
