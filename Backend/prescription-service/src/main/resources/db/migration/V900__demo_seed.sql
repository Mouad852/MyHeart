-- ============================================================
-- Demo data — what was written
--
-- Prescriptions carry a diagnosis, medicines carry the "how to take it" line
-- the printed document runs full width underneath each drug, and several
-- belong to patient 1 so the portal and the timeline both have something to
-- show. Two carry more than one medicine, because a prescription with exactly
-- one item on it every time makes the expandable row look pointless.
--
-- Doses are ordinary and unremarkable on purpose. This is a portfolio project
-- and the printed document says so on its face; inventing an interesting
-- regimen would be inventing clinical content.
-- ============================================================

INSERT INTO prescriptions (id, patient_id, doctor_id, diagnosis, notes, created_at, updated_at) VALUES
    ( 1,  1, 2, 'Hypothyroidism',            'Continue current dose. Repeat thyroid function in three months.', now() - interval '18 days',  now() - interval '18 days'),
    ( 2,  1, 2, 'Iron deficiency anaemia',   'Review after the next blood count.',                              now() - interval '110 days', now() - interval '110 days'),
    ( 3,  1, 1, 'Essential hypertension',    'Started on a single agent. Blood pressure diary requested.',      now() - interval '200 days', now() - interval '200 days'),
    ( 4,  1, 2, 'Seasonal allergic rhinitis','Short course during the pollen season.',                          now() - interval '260 days', now() - interval '260 days'),
    ( 5,  3, 2, 'Acute bronchitis',          'Return if the fever has not settled in three days.',              now() - interval '12 days',  now() - interval '12 days'),
    ( 6,  8, 2, 'Acute tonsillitis',         'Complete the full course.',                                       now() - interval '4 days',   now() - interval '4 days'),
    ( 7, 13, 2, 'Type 2 diabetes',           'Repeat prescription, unchanged.',                                 now() - interval '6 days',   now() - interval '6 days'),
    ( 8,  6, 3, 'Atopic eczema',             'Apply thinly. Stop if the skin becomes sore.',                    now() - interval '21 days',  now() - interval '21 days'),
    ( 9, 11, 2, 'Type 2 diabetes',           'Dose increased after the last review.',                           now() - interval '38 days',  now() - interval '38 days'),
    (10,  9, 2, 'Gastro-oesophageal reflux', 'Four-week course, then review.',                                  now() - interval '30 days',  now() - interval '30 days'),
    (11, 10, 5, 'Rotator cuff strain',       'Analgesia and physiotherapy referral.',                           now() - interval '34 days',  now() - interval '34 days'),
    (12,  7, 2, 'Essential hypertension',    'Blood pressure well controlled; continue.',                       now() - interval '12 days',  now() - interval '12 days')
ON CONFLICT DO NOTHING;

INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
    ( 1,  1, 'Levothyroxine',   '75 mcg',  'Once daily',        '3 months', 'Take in the morning, at least 30 minutes before breakfast.'),
    ( 2,  2, 'Ferrous sulfate', '200 mg',  'Twice daily',       '2 months', 'Take with food. May darken the stool, which is expected.'),
    ( 3,  2, 'Ascorbic acid',   '500 mg',  'Once daily',        '2 months', 'Taken alongside the iron to help absorption.'),
    ( 4,  3, 'Amlodipine',      '5 mg',    'Once daily',        '3 months', 'Take at the same time each day. Report any ankle swelling.'),
    ( 5,  4, 'Loratadine',      '10 mg',   'Once daily',        '4 weeks',  'Take in the morning. May be stopped once symptoms settle.'),
    ( 6,  5, 'Amoxicillin',     '500 mg',  'Three times daily', '7 days',   'Complete the course even if the cough improves.'),
    ( 7,  5, 'Paracetamol',     '1 g',     'Up to four times daily', '5 days', 'For fever or discomfort. Leave at least four hours between doses.'),
    ( 8,  6, 'Amoxicillin',     '500 mg',  'Three times daily', '7 days',   'Complete the course.'),
    ( 9,  6, 'Ibuprofen',       '400 mg',  'Three times daily', '5 days',   'Take with food.'),
    (10,  7, 'Metformin',       '850 mg',  'Twice daily',       '3 months', 'Take with meals to reduce stomach upset.'),
    (11,  8, 'Hydrocortisone cream', '1%', 'Twice daily',       '2 weeks',  'Apply thinly to the affected area only.'),
    (12,  8, 'Emollient ointment',   '-',  'As needed',         '3 months', 'Apply generously and as often as required.'),
    (13,  9, 'Metformin',       '1 g',     'Twice daily',       '3 months', 'Take with meals.'),
    (14,  9, 'Gliclazide',      '40 mg',   'Once daily',        '3 months', 'Take with breakfast.'),
    (15, 10, 'Omeprazole',      '20 mg',   'Once daily',        '4 weeks',  'Take before breakfast.'),
    (16, 11, 'Naproxen',        '250 mg',  'Twice daily',       '10 days',  'Take with food.'),
    (17, 11, 'Paracetamol',     '1 g',     'Up to four times daily', '10 days', 'For additional pain relief if needed.'),
    (18, 12, 'Amlodipine',      '5 mg',    'Once daily',        '6 months', 'Continue at the current dose.')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('prescriptions', 'id'),
              GREATEST((SELECT MAX(id) FROM prescriptions), 1));
SELECT setval(pg_get_serial_sequence('prescription_items', 'id'),
              GREATEST((SELECT MAX(id) FROM prescription_items), 1));
