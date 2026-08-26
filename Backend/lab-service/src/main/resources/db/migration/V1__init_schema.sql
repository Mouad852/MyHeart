CREATE TABLE IF NOT EXISTS lab_requests (
    id               BIGSERIAL PRIMARY KEY,
    patient_id       BIGINT          NOT NULL,
    doctor_id        BIGINT          NOT NULL,
    test_name        VARCHAR(255)    NOT NULL,
    test_description VARCHAR(500),
    status           VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT chk_lab_status CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED'))
);
CREATE TABLE IF NOT EXISTS lab_results (
    id              BIGSERIAL PRIMARY KEY,
    lab_request_id  BIGINT          NOT NULL REFERENCES lab_requests(id),
    result_text     TEXT            NOT NULL,
    observations    VARCHAR(1000),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_req_patient ON lab_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_req_doctor  ON lab_requests(doctor_id);
