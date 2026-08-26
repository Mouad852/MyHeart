CREATE TABLE IF NOT EXISTS doctors (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    specialization  VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_doctors_email UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
