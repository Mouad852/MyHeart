-- ============================================================
-- Demo data — the ledger
--
-- One invoice per appointment, raised when the appointment is confirmed, which
-- is the rule the service enforces: a slot the clinic never agreed to does not
-- leave a void invoice behind. So REQUESTED appointments have no invoice here,
-- and the unique constraint on appointment_id keeps it that way.
--
-- Amounts come from the catalogue in V2 rather than being invented per row:
-- CONSULTATION 300, FOLLOW_UP 180, SPECIALIST 500, LAB_REVIEW 150,
-- PROCEDURE 850, all in dirham.
--
-- The mix is chosen so the Overview and the billing screen have something true
-- to say. Older work is settled, recent work is outstanding, five invoices are
-- past their due date — there is no OVERDUE status, being overdue is what an
-- unpaid invoice becomes once its due date passes — one is void because the
-- appointment was cancelled, and one is refunded.
-- ============================================================

INSERT INTO invoices (id, appointment_id, patient_id, amount, status, description, service_code, currency, issued_at, due_date, payment_method, paid_at, created_at, updated_at) VALUES
-- ── Today's clinic — issued, not yet due ────────────────────
    ( 1,  1,  3, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '9 days',  (now() + interval '21 days')::date, NULL, NULL, now() - interval '9 days',  now()),
    ( 2,  2,  7, 180.00, 'ISSUED', 'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '12 days', (now() + interval '18 days')::date, NULL, NULL, now() - interval '12 days', now()),
    ( 3,  3, 11, 180.00, 'VOID',   'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '15 days', (now() + interval '15 days')::date, NULL, NULL, now() - interval '15 days', now()),
    ( 4,  4,  8, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '4 days',  (now() + interval '26 days')::date, 'CARD', now(), now() - interval '4 days', now()),
    ( 5,  5, 13, 180.00, 'PAID',   'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '6 days',  (now() + interval '24 days')::date, 'CASH', now(), now() - interval '6 days', now()),
    ( 6,  6,  6, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '11 days', (now() + interval '19 days')::date, NULL, NULL, now() - interval '11 days', now() - interval '11 days'),
    ( 7,  7,  2, 150.00, 'ISSUED', 'Laboratory review',       'LAB_REVIEW',   'MAD', now() - interval '8 days',  (now() + interval '22 days')::date, NULL, NULL, now() - interval '8 days',  now() - interval '8 days'),
    ( 8,  8, 10, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '5 days',  (now() + interval '25 days')::date, NULL, NULL, now() - interval '5 days',  now() - interval '5 days'),
    ( 9,  9,  4, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '20 days', (now() + interval '10 days')::date, NULL, NULL, now() - interval '20 days', now() - interval '20 days'),
    (10, 10, 14, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '2 days',  (now() + interval '28 days')::date, NULL, NULL, now() - interval '2 days',  now() - interval '2 days'),
    (11, 11, 12, 500.00, 'ISSUED', 'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '16 days', (now() + interval '14 days')::date, NULL, NULL, now() - interval '16 days', now() - interval '16 days'),
    (12, 12,  5, 500.00, 'PAID',   'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '22 days', (now() + interval '8 days')::date,  'TRANSFER', now() - interval '1 day', now() - interval '22 days', now() - interval '1 day'),
    (13, 13,  9, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '18 days', (now() + interval '12 days')::date, NULL, NULL, now() - interval '18 days', now() - interval '18 days'),
    (14, 14, 11, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '7 days',  (now() + interval '23 days')::date, NULL, NULL, now() - interval '7 days',  now() - interval '7 days'),
    (15, 15,  7, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '3 days',  (now() + interval '27 days')::date, NULL, NULL, now() - interval '3 days',  now() - interval '3 days'),

-- ── Patient 1 — a settled history and one live invoice ──────
    (16, 20,  1, 180.00, 'ISSUED', 'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '10 days',  (now() + interval '20 days')::date, NULL, NULL, now() - interval '10 days', now() - interval '10 days'),
    (17, 21,  1, 180.00, 'PAID',   'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '48 days',  (now() - interval '18 days')::date, 'CARD',     now() - interval '17 days',  now() - interval '48 days',  now() - interval '17 days'),
    (18, 22,  1, 500.00, 'PAID',   'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '70 days',  (now() - interval '40 days')::date, 'TRANSFER', now() - interval '44 days',  now() - interval '70 days',  now() - interval '44 days'),
    (19, 23,  1, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '90 days',  (now() - interval '60 days')::date, 'CASH',     now() - interval '73 days',  now() - interval '90 days',  now() - interval '73 days'),
    (20, 24,  1, 300.00, 'VOID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '115 days', (now() - interval '85 days')::date, NULL, NULL, now() - interval '115 days', now() - interval '97 days'),
    (21, 25,  1, 150.00, 'PAID',   'Laboratory review',       'LAB_REVIEW',   'MAD', now() - interval '130 days', (now() - interval '100 days')::date,'CASH',     now() - interval '109 days', now() - interval '130 days', now() - interval '109 days'),
    (22, 26,  1, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '150 days', (now() - interval '120 days')::date, NULL, NULL, now() - interval '150 days', now() - interval '130 days'),
    (23, 27,  1, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '170 days', (now() - interval '140 days')::date,'CARD',     now() - interval '149 days', now() - interval '170 days', now() - interval '149 days'),
    (24, 28,  1, 500.00, 'PAID',   'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '225 days', (now() - interval '195 days')::date,'TRANSFER', now() - interval '199 days', now() - interval '225 days', now() - interval '199 days'),
    (25, 29,  1, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '280 days', (now() - interval '250 days')::date,'CASH',     now() - interval '259 days', now() - interval '280 days', now() - interval '259 days'),
    (26, 30,  1, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '340 days', (now() - interval '310 days')::date,'CARD',     now() - interval '319 days', now() - interval '340 days', now() - interval '319 days'),
    (27, 31,  1, 500.00, 'PAID',   'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '420 days', (now() - interval '390 days')::date,'CASH',     now() - interval '399 days', now() - interval '420 days', now() - interval '399 days'),

-- ── The rest of the clinic — mostly settled ─────────────────
    (28, 32,  2, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '25 days', (now() + interval '5 days')::date,  'CARD', now() - interval '8 days',  now() - interval '25 days', now() - interval '8 days'),
    (29, 33,  3, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '30 days', (now() ) ::date,                    'CASH', now() - interval '11 days', now() - interval '30 days', now() - interval '11 days'),
    (30, 34,  4, 500.00, 'ISSUED', 'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '40 days', (now() - interval '10 days')::date, NULL, NULL, now() - interval '40 days', now() - interval '40 days'),
    (31, 35,  6, 500.00, 'PAID',   'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '45 days', (now() - interval '15 days')::date, 'CARD', now() - interval '20 days', now() - interval '45 days', now() - interval '20 days'),
    (32, 36,  8, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '50 days', (now() - interval '20 days')::date, NULL, NULL, now() - interval '50 days', now() - interval '50 days'),
    (33, 37,  9, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '55 days', (now() - interval '25 days')::date, 'CASH', now() - interval '29 days', now() - interval '55 days', now() - interval '29 days'),
    (34, 38, 10, 500.00, 'ISSUED', 'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '60 days', (now() - interval '30 days')::date, NULL, NULL, now() - interval '60 days', now() - interval '60 days'),
    (35, 39, 11, 180.00, 'PAID',   'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '65 days', (now() - interval '35 days')::date, 'CARD', now() - interval '37 days', now() - interval '65 days', now() - interval '37 days'),
    (36, 40, 12, 500.00, 'PAID',   'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '70 days', (now() - interval '40 days')::date, 'TRANSFER', now() - interval '43 days', now() - interval '70 days', now() - interval '43 days'),
    (37, 41, 13, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '75 days', (now() - interval '45 days')::date, 'CASH', now() - interval '49 days', now() - interval '75 days', now() - interval '49 days'),
    (38, 42,  5, 850.00, 'REFUNDED','Minor procedure',        'PROCEDURE',    'MAD', now() - interval '80 days', (now() - interval '50 days')::date, 'CARD', now() - interval '57 days', now() - interval '80 days', now() - interval '40 days'),
    (39, 44, 14, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '26 days', (now() + interval '4 days')::date,  NULL, NULL, now() - interval '26 days', now() - interval '26 days'),
    (40, 45,  6, 300.00, 'PAID',   'General consultation',    'CONSULTATION', 'MAD', now() - interval '18 days', (now() + interval '12 days')::date, 'CARD', now() - interval '4 days', now() - interval '18 days', now() - interval '4 days'),
    (41, 46,  4, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '30 days', (now() ) ::date,                    NULL, NULL, now() - interval '30 days', now() - interval '2 days'),

-- ── Booked but not yet seen ─────────────────────────────────
    (42, 47,  3, 180.00, 'ISSUED', 'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '3 days',  (now() + interval '27 days')::date, NULL, NULL, now() - interval '3 days',  now() - interval '3 days'),
    (43, 48,  8, 180.00, 'ISSUED', 'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '1 day',   (now() + interval '29 days')::date, NULL, NULL, now() - interval '1 day',   now() - interval '1 day'),
    (44, 49, 12, 500.00, 'ISSUED', 'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '30 days', (now() ) ::date,                    NULL, NULL, now() - interval '30 days', now() - interval '30 days'),
    (45, 50,  6, 500.00, 'ISSUED', 'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '21 days', (now() + interval '9 days')::date,  NULL, NULL, now() - interval '21 days', now() - interval '21 days'),
    (46, 51, 10, 500.00, 'ISSUED', 'Specialist consultation', 'SPECIALIST',   'MAD', now() - interval '34 days', (now() - interval '4 days')::date,  NULL, NULL, now() - interval '34 days', now() - interval '34 days'),
    (47, 52,  9, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '18 days', (now() + interval '12 days')::date, NULL, NULL, now() - interval '18 days', now() - interval '18 days'),
    (48, 53, 13, 300.00, 'ISSUED', 'General consultation',    'CONSULTATION', 'MAD', now() - interval '50 days', (now() - interval '20 days')::date, NULL, NULL, now() - interval '50 days', now() - interval '50 days'),
    (49, 54,  2, 180.00, 'ISSUED', 'Follow-up visit',         'FOLLOW_UP',    'MAD', now() - interval '9 days',  (now() + interval '21 days')::date, NULL, NULL, now() - interval '9 days',  now() - interval '9 days')
ON CONFLICT DO NOTHING;

UPDATE invoices SET void_reason = 'Appointment cancelled by the patient' WHERE id = 20 AND void_reason IS NULL;
UPDATE invoices SET void_reason = 'Patient did not attend; not charged'  WHERE id = 3  AND void_reason IS NULL;

SELECT setval(pg_get_serial_sequence('invoices', 'id'),
              GREATEST((SELECT MAX(id) FROM invoices), 1));
SELECT setval(pg_get_serial_sequence('clinic_services', 'id'),
              GREATEST((SELECT MAX(id) FROM clinic_services), 1));
