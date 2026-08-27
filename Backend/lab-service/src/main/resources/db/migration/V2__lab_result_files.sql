-- Attachments for laboratory results, plus the indexes V1 promised.
--
-- V1 never ran on this database. Flyway found existing tables and wrote a
-- baseline row instead, so the live schema is the one Hibernate produced from
-- the entities: requested_at rather than created_at, no indexes, and a check
-- constraint named lab_requests_status_check rather than chk_lab_status.
--
-- This migration therefore targets what is actually there, and is written so it
-- also works on a database where V1 did run. That is the fourth service where
-- the same baseline has bitten, and the reason every statement below is
-- conditional.

-- ---------------------------------------------------------------------------
-- Attachment columns.
--
-- file_path exists on a Hibernate-built database, added from a field commented
-- "Simulated file path" that nothing ever wrote to; it now holds a real storage
-- key. It does *not* exist on a database built from V1, which never declared
-- it. This script originally assumed the first case and aborted on the second
-- with `column "file_path" does not exist`, taking the whole service down with
-- it — a clean clone could not migrate lab-service at all. Creating it here
-- first makes both cases work.
-- ---------------------------------------------------------------------------
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS file_path       VARCHAR(255);
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS file_name       VARCHAR(160);
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS file_content_type VARCHAR(80);
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS file_size       BIGINT;
-- VARCHAR rather than CHAR: the entity maps it as a String with a length, which
-- Hibernate validates as varchar. CHAR also pads with spaces, which would make
-- every checksum comparison depend on trimming.
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS file_checksum   VARCHAR(64);
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS file_uploaded_at TIMESTAMP;

-- Clear the phantom attachments first.
--
-- file_path used to be accepted straight from the request body, so existing
-- rows carry paths like 'results/patient-1/cbc-report.pdf' that were typed by
-- whoever posted the result and point at nothing: no file of that name has ever
-- existed, because until now nothing ever wrote a file. Keeping them would mean
-- the UI offering a download that can only ever fail.
--
-- Only the dangling reference is removed. The result text and observations, the
-- part that is actually clinical data, are untouched.
UPDATE lab_results
   SET file_path = NULL
 WHERE file_path IS NOT NULL
   AND file_checksum IS NULL;

-- A result either has a whole attachment or none of one. Half a row here would
-- mean a file on disk nobody can name, or a name pointing at nothing.
ALTER TABLE lab_results DROP CONSTRAINT IF EXISTS chk_result_file_complete;
ALTER TABLE lab_results ADD CONSTRAINT chk_result_file_complete CHECK (
    (file_path IS NULL AND file_name IS NULL AND file_checksum IS NULL)
    OR
    (file_path IS NOT NULL AND file_name IS NOT NULL AND file_checksum IS NOT NULL)
);

-- The same storage key must never be claimed by two results.
CREATE UNIQUE INDEX IF NOT EXISTS uq_lab_result_file_path
    ON lab_results (file_path) WHERE file_path IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Referential integrity between a result and the request it answers. Hibernate
-- created lab_request_id without a foreign key, so a result could point at a
-- request that does not exist.
-- ---------------------------------------------------------------------------
DELETE FROM lab_results r
 WHERE NOT EXISTS (SELECT 1 FROM lab_requests q WHERE q.id = r.lab_request_id);

ALTER TABLE lab_results DROP CONSTRAINT IF EXISTS fk_lab_result_request;
ALTER TABLE lab_results ADD CONSTRAINT fk_lab_result_request
    FOREIGN KEY (lab_request_id) REFERENCES lab_requests (id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- Status check. Both possible names are dropped, since which one exists depends
-- on whether V1 ran or Hibernate built the table.
-- ---------------------------------------------------------------------------
ALTER TABLE lab_requests DROP CONSTRAINT IF EXISTS chk_lab_status;
ALTER TABLE lab_requests DROP CONSTRAINT IF EXISTS lab_requests_status_check;
ALTER TABLE lab_requests ADD CONSTRAINT chk_lab_status
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- ---------------------------------------------------------------------------
-- The indexes V1 declared and the database never got. Every read path in the
-- service filters on one of these.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lab_req_patient ON lab_requests (patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_req_doctor  ON lab_requests (doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_req_status  ON lab_requests (status);
CREATE INDEX IF NOT EXISTS idx_lab_result_request ON lab_results (lab_request_id);
