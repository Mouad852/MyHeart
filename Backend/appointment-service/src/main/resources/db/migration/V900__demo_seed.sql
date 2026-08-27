-- ============================================================
-- Demo data — the diary
--
-- Every time is written relative to now(), so the demo has a real today
-- whenever it is started or reset. A seed with fixed dates is a clinic that
-- was busy in March 2025 and has been empty since.
--
-- The day is composed rather than generated, because the screens are about
-- specific situations:
--
--   Today (doctor 2)   a morning already seen, one patient who did not turn
--                      up, and an afternoon still to come — so the clock line
--                      on the spine has appointments above and below it
--                      whatever time the demo is opened.
--   Overview           four REQUESTED slots nobody has answered, which is the
--                      only region of that screen meant to end in a click.
--   Patient 1          a fourteen-month history, so the record has something
--                      to draw and the month grouping has more than one group.
--   Doctors 1, 3, 4, 6 their own bookings, so the day view is a clinic rather
--                      than one doctor, and the specialty filter has work.
--
-- Doctor 2 is `doctor.demo`; patient 1 is `patient.demo`.
--
-- No two appointments for the same doctor share a time: the booking rules
-- refuse overlaps on half-open intervals, and seed data that violates the
-- rules the product enforces is a demo that argues with itself.
-- ============================================================

-- ── Today, doctor 2 — the demo doctor's working day ─────────
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, status, duration_minutes, notes, status_changed_at, created_at, updated_at) VALUES
    ( 1,  3, 2, date_trunc('day', now()) + interval '8 hours 30 minutes',  'COMPLETED', 30, 'Persistent cough, three weeks',        date_trunc('day', now()) + interval '9 hours',  now() - interval '9 days',  now()),
    ( 2,  7, 2, date_trunc('day', now()) + interval '9 hours',             'COMPLETED', 30, 'Blood pressure review',               date_trunc('day', now()) + interval '9 hours 30 minutes', now() - interval '12 days', now()),
    ( 3, 11, 2, date_trunc('day', now()) + interval '9 hours 30 minutes',  'NO_SHOW',   30, 'Follow-up, diabetes',                 date_trunc('day', now()) + interval '10 hours', now() - interval '15 days', now()),
    ( 4,  8, 2, date_trunc('day', now()) + interval '10 hours',            'COMPLETED', 30, 'Sore throat and fever',               date_trunc('day', now()) + interval '10 hours 30 minutes', now() - interval '4 days',  now()),
    ( 5, 13, 2, date_trunc('day', now()) + interval '10 hours 30 minutes', 'COMPLETED', 15, 'Repeat prescription',                 date_trunc('day', now()) + interval '10 hours 45 minutes', now() - interval '6 days',  now()),
    ( 6,  6, 2, date_trunc('day', now()) + interval '11 hours 30 minutes', 'CONFIRMED', 30, 'Lower back pain',                     NULL, now() - interval '11 days', now() - interval '11 days'),
    ( 7,  2, 2, date_trunc('day', now()) + interval '14 hours',            'CONFIRMED', 30, 'Results review',                      NULL, now() - interval '8 days',  now() - interval '8 days'),
    ( 8, 10, 2, date_trunc('day', now()) + interval '14 hours 30 minutes', 'CONFIRMED', 30, 'Migraine, worsening',                 NULL, now() - interval '5 days',  now() - interval '5 days'),
    ( 9,  4, 2, date_trunc('day', now()) + interval '15 hours 30 minutes', 'CONFIRMED', 30, 'Annual check',                        NULL, now() - interval '20 days', now() - interval '20 days'),
    (10, 14, 2, date_trunc('day', now()) + interval '16 hours',            'CONFIRMED', 30, 'First consultation',                  NULL, now() - interval '2 days',  now() - interval '2 days'),

-- ── Today, the rest of the clinic ───────────────────────────
    (11, 12, 1, date_trunc('day', now()) + interval '9 hours',             'CONFIRMED', 45, 'Palpitations',                        NULL, now() - interval '16 days', now() - interval '16 days'),
    (12,  5, 1, date_trunc('day', now()) + interval '11 hours',            'COMPLETED', 45, 'Post-operative review',               date_trunc('day', now()) + interval '11 hours 45 minutes', now() - interval '22 days', now()),
    (13,  9, 4, date_trunc('day', now()) + interval '10 hours',            'CONFIRMED', 30, 'Childhood vaccination',               NULL, now() - interval '18 days', now() - interval '18 days'),
    (14, 11, 3, date_trunc('day', now()) + interval '14 hours',            'CONFIRMED', 30, 'Recurring rash',                      NULL, now() - interval '7 days',  now() - interval '7 days'),
    (15,  7, 6, date_trunc('day', now()) + interval '15 hours',            'CONFIRMED', 30, 'Fatigue',                             NULL, now() - interval '3 days',  now() - interval '3 days'),

-- ── Awaiting a decision — the Overview queue ────────────────
-- A patient can only ask; a slot booked by a patient begins REQUESTED and
-- stays there until the desk agrees. These are what the Confirm buttons act on.
    (16, 14, 2, date_trunc('day', now()) + interval '1 day 16 hours 30 minutes', 'REQUESTED', 30, 'Requested online — chest tightness', NULL, now() - interval '2 days', now() - interval '2 days'),
    (17,  5, 2, date_trunc('day', now()) + interval '2 days 9 hours',            'REQUESTED', 30, 'Requested online — knee pain',       NULL, now() - interval '1 day',  now() - interval '1 day'),
    (18,  9, 6, date_trunc('day', now()) + interval '3 days 11 hours',           'REQUESTED', 30, 'Requested online — sleep problems',  NULL, now() - interval '1 day',  now() - interval '1 day'),
    (19, 12, 1, date_trunc('day', now()) + interval '4 days 10 hours 30 minutes','REQUESTED', 45, 'Requested online — follow-up',       NULL, now() - interval '6 hours', now() - interval '6 hours'),

-- ── Patient 1 — the record the portal and the timeline draw ──
-- Next appointment first, then fourteen months of history.
    (20,  1, 2, date_trunc('day', now()) + interval '3 days 9 hours',   'CONFIRMED', 30, 'Thyroid review',                  NULL, now() - interval '10 days', now() - interval '10 days'),
    (21,  1, 2, date_trunc('day', now()) - interval '18 days'  + interval '9 hours 30 minutes', 'COMPLETED', 30, 'Thyroid function follow-up', date_trunc('day', now()) - interval '18 days' + interval '10 hours', now() - interval '48 days', now() - interval '18 days'),
    (22,  1, 1, date_trunc('day', now()) - interval '45 days'  + interval '11 hours',           'COMPLETED', 45, 'Cardiology referral',        date_trunc('day', now()) - interval '45 days' + interval '11 hours 45 minutes', now() - interval '70 days', now() - interval '45 days'),
    (23,  1, 2, date_trunc('day', now()) - interval '74 days'  + interval '14 hours 30 minutes','COMPLETED', 30, 'Fatigue and weight change',  date_trunc('day', now()) - interval '74 days' + interval '15 hours', now() - interval '90 days', now() - interval '74 days'),
    (24,  1, 2, date_trunc('day', now()) - interval '95 days'  + interval '10 hours',           'CANCELLED', 30, 'Routine review',             date_trunc('day', now()) - interval '97 days', now() - interval '115 days', now() - interval '97 days'),
    (25,  1, 2, date_trunc('day', now()) - interval '110 days' + interval '9 hours',            'COMPLETED', 30, 'Blood test review',          date_trunc('day', now()) - interval '110 days' + interval '9 hours 30 minutes', now() - interval '130 days', now() - interval '110 days'),
    (26,  1, 2, date_trunc('day', now()) - interval '130 days' + interval '15 hours',           'NO_SHOW',   30, 'Routine review',             date_trunc('day', now()) - interval '130 days' + interval '15 hours 30 minutes', now() - interval '150 days', now() - interval '130 days'),
    (27,  1, 2, date_trunc('day', now()) - interval '150 days' + interval '11 hours 30 minutes','COMPLETED', 30, 'Persistent headaches',       date_trunc('day', now()) - interval '150 days' + interval '12 hours', now() - interval '170 days', now() - interval '150 days'),
    (28,  1, 1, date_trunc('day', now()) - interval '200 days' + interval '10 hours 30 minutes','COMPLETED', 45, 'Cardiology, first visit',    date_trunc('day', now()) - interval '200 days' + interval '11 hours 15 minutes', now() - interval '225 days', now() - interval '200 days'),
    (29,  1, 2, date_trunc('day', now()) - interval '260 days' + interval '9 hours',            'COMPLETED', 30, 'Seasonal allergy',           date_trunc('day', now()) - interval '260 days' + interval '9 hours 30 minutes', now() - interval '280 days', now() - interval '260 days'),
    (30,  1, 2, date_trunc('day', now()) - interval '320 days' + interval '16 hours',           'COMPLETED', 30, 'Annual check',               date_trunc('day', now()) - interval '320 days' + interval '16 hours 30 minutes', now() - interval '340 days', now() - interval '320 days'),
    (31,  1, 3, date_trunc('day', now()) - interval '400 days' + interval '14 hours',           'COMPLETED', 30, 'Skin complaint',             date_trunc('day', now()) - interval '400 days' + interval '14 hours 30 minutes', now() - interval '420 days', now() - interval '400 days'),

-- ── The rest of the clinic's recent history ─────────────────
    (32,  2, 2, date_trunc('day', now()) - interval '9 days'  + interval '11 hours',           'COMPLETED', 30, 'Blood tests requested',   date_trunc('day', now()) - interval '9 days'  + interval '11 hours 30 minutes', now() - interval '25 days', now() - interval '9 days'),
    (33,  3, 2, date_trunc('day', now()) - interval '12 days' + interval '15 hours',           'COMPLETED', 30, 'Chest infection',         date_trunc('day', now()) - interval '12 days' + interval '15 hours 30 minutes', now() - interval '30 days', now() - interval '12 days'),
    (34,  4, 1, date_trunc('day', now()) - interval '15 days' + interval '9 hours 30 minutes', 'COMPLETED', 45, 'Cardiology follow-up',    date_trunc('day', now()) - interval '15 days' + interval '10 hours 15 minutes', now() - interval '40 days', now() - interval '15 days'),
    (35,  6, 3, date_trunc('day', now()) - interval '21 days' + interval '14 hours 30 minutes','COMPLETED', 30, 'Eczema review',           date_trunc('day', now()) - interval '21 days' + interval '15 hours', now() - interval '45 days', now() - interval '21 days'),
    (36,  8, 4, date_trunc('day', now()) - interval '26 days' + interval '10 hours',           'COMPLETED', 30, 'Paediatric review',       date_trunc('day', now()) - interval '26 days' + interval '10 hours 30 minutes', now() - interval '50 days', now() - interval '26 days'),
    (37,  9, 2, date_trunc('day', now()) - interval '30 days' + interval '16 hours',           'COMPLETED', 30, 'Abdominal pain',          date_trunc('day', now()) - interval '30 days' + interval '16 hours 30 minutes', now() - interval '55 days', now() - interval '30 days'),
    (38, 10, 5, date_trunc('day', now()) - interval '34 days' + interval '11 hours',           'COMPLETED', 45, 'Shoulder injury',         date_trunc('day', now()) - interval '34 days' + interval '11 hours 45 minutes', now() - interval '60 days', now() - interval '34 days'),
    (39, 11, 2, date_trunc('day', now()) - interval '38 days' + interval '9 hours',            'COMPLETED', 30, 'Diabetes review',         date_trunc('day', now()) - interval '38 days' + interval '9 hours 30 minutes', now() - interval '65 days', now() - interval '38 days'),
    (40, 12, 1, date_trunc('day', now()) - interval '44 days' + interval '15 hours 30 minutes','COMPLETED', 45, 'Palpitations, first visit',date_trunc('day', now()) - interval '44 days' + interval '16 hours 15 minutes', now() - interval '70 days', now() - interval '44 days'),
    (41, 13, 6, date_trunc('day', now()) - interval '50 days' + interval '10 hours 30 minutes','COMPLETED', 30, 'General consultation',    date_trunc('day', now()) - interval '50 days' + interval '11 hours', now() - interval '75 days', now() - interval '50 days'),
    (42,  5, 5, date_trunc('day', now()) - interval '58 days' + interval '14 hours',           'COMPLETED', 60, 'Knee, pre-operative',     date_trunc('day', now()) - interval '58 days' + interval '15 hours', now() - interval '80 days', now() - interval '58 days'),
    (43,  7, 2, date_trunc('day', now()) - interval '63 days' + interval '11 hours 30 minutes','CANCELLED', 30, 'Routine review',          date_trunc('day', now()) - interval '65 days', now() - interval '85 days', now() - interval '65 days'),
    (44, 14, 6, date_trunc('day', now()) - interval '20 days' + interval '9 hours 30 minutes', 'COMPLETED', 30, 'Registration consultation',date_trunc('day', now()) - interval '20 days' + interval '10 hours', now() - interval '26 days', now() - interval '20 days'),
    (45,  6, 2, date_trunc('day', now()) - interval '5 days'  + interval '14 hours',           'COMPLETED', 30, 'Back pain, first visit',  date_trunc('day', now()) - interval '5 days'  + interval '14 hours 30 minutes', now() - interval '18 days', now() - interval '5 days'),
    (46,  4, 2, date_trunc('day', now()) - interval '2 days'  + interval '10 hours',           'NO_SHOW',   30, 'Annual check',            date_trunc('day', now()) - interval '2 days'  + interval '10 hours 30 minutes', now() - interval '30 days', now() - interval '2 days'),

-- ── Still to come ───────────────────────────────────────────
    (47,  3, 2, date_trunc('day', now()) + interval '1 day 10 hours',            'CONFIRMED', 30, 'Cough follow-up',      NULL, now() - interval '3 days',  now() - interval '3 days'),
    (48,  8, 2, date_trunc('day', now()) + interval '1 day 11 hours',            'CONFIRMED', 30, 'Throat review',        NULL, now() - interval '1 day',   now() - interval '1 day'),
    (49, 12, 1, date_trunc('day', now()) + interval '2 days 15 hours',           'CONFIRMED', 45, 'Cardiology follow-up', NULL, now() - interval '30 days', now() - interval '30 days'),
    (50,  6, 3, date_trunc('day', now()) + interval '5 days 14 hours 30 minutes','CONFIRMED', 30, 'Eczema review',        NULL, now() - interval '21 days', now() - interval '21 days'),
    (51, 10, 5, date_trunc('day', now()) + interval '7 days 11 hours',           'CONFIRMED', 45, 'Shoulder review',      NULL, now() - interval '34 days', now() - interval '34 days'),
    (52,  9, 4, date_trunc('day', now()) + interval '9 days 10 hours',           'CONFIRMED', 30, 'Vaccination, second',  NULL, now() - interval '18 days', now() - interval '18 days'),
    (53, 13, 6, date_trunc('day', now()) + interval '12 days 10 hours 30 minutes','CONFIRMED',30, 'General review',       NULL, now() - interval '50 days', now() - interval '50 days'),
    (54,  2, 2, date_trunc('day', now()) + interval '14 days 9 hours 30 minutes','CONFIRMED', 30, 'Six-week review',      NULL, now() - interval '9 days',  now() - interval '9 days')
ON CONFLICT DO NOTHING;

UPDATE appointments
   SET cancellation_reason = 'Cancelled by the patient'
 WHERE id IN (24, 43) AND cancellation_reason IS NULL;

SELECT setval(pg_get_serial_sequence('appointments', 'id'),
              GREATEST((SELECT MAX(id) FROM appointments), 1));
