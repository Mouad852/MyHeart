CREATE TABLE IF NOT EXISTS patients (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255)        NOT NULL,
    email       VARCHAR(255)        NOT NULL,
    phone       VARCHAR(20)         NOT NULL,
    address     VARCHAR(500),
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),
    CONSTRAINT uq_patients_email UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
