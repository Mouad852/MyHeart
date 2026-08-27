-- ============================================================
-- Demo data — the laboratory
--
-- The screen is built around request → result → report, and each stage exists
-- without the next. The seed reflects that: some requests are waiting for a
-- sample, some are at the laboratory, some have been answered, and one was
-- cancelled. Only COMPLETED requests carry a result.
--
-- No result carries a file. An attachment is a real object in storage with a
-- checksum, and the table's own constraint refuses half of one — a row naming
-- a report that was never uploaded would put a download button on the screen
-- that could only ever fail. Uploading one through the UI is part of the demo.
--
-- This is also the screen a LAB_TECHNICIAN lands on and the only place they
-- can act, so there is deliberately work waiting in both open states.
-- ============================================================

INSERT INTO lab_requests (id, patient_id, doctor_id, test_name, test_description, status, requested_at, updated_at) VALUES
    ( 1,  1, 2, 'Thyroid function',       'TSH, free T4. Dose review.',                    'COMPLETED',   now() - interval '25 days',  now() - interval '20 days'),
    ( 2,  1, 2, 'Full blood count',       'Anaemia follow-up.',                            'COMPLETED',   now() - interval '115 days', now() - interval '111 days'),
    ( 3,  1, 1, 'Lipid profile',          'Cardiovascular risk assessment.',               'COMPLETED',   now() - interval '205 days', now() - interval '201 days'),
    ( 4,  1, 2, 'Thyroid function',       'Three-month repeat before the next review.',    'PENDING',     now() - interval '2 days',   now() - interval '2 days'),
    ( 5,  2, 2, 'Full blood count',       'Fatigue, no obvious cause.',                    'COMPLETED',   now() - interval '9 days',   now() - interval '5 days'),
    ( 6,  2, 2, 'Vitamin D',              'Requested alongside the blood count.',          'IN_PROGRESS', now() - interval '9 days',   now() - interval '3 days'),
    ( 7,  3, 2, 'Chest X-ray',            'Persistent cough, three weeks.',                'IN_PROGRESS', now() - interval '1 day',    now() - interval '1 day'),
    ( 8,  9, 2, 'Liver function',         'Abdominal pain.',                               'COMPLETED',   now() - interval '30 days',  now() - interval '27 days'),
    ( 9, 11, 2, 'HbA1c',                  'Diabetes control.',                             'COMPLETED',   now() - interval '38 days',  now() - interval '35 days'),
    (10, 11, 2, 'HbA1c',                  'Three-month repeat.',                           'PENDING',     now() - interval '1 day',    now() - interval '1 day'),
    (11, 12, 1, 'Electrocardiogram',      'Palpitations.',                                 'COMPLETED',   now() - interval '44 days',  now() - interval '41 days'),
    (12,  4, 1, 'Lipid profile',          'Cardiology follow-up.',                         'IN_PROGRESS', now() - interval '15 days',  now() - interval '10 days'),
    (13,  8, 2, 'Throat swab',            'Tonsillitis, culture requested.',               'PENDING',     now() - interval '4 days',   now() - interval '4 days'),
    (14,  7, 2, 'Renal function',         'Routine, on antihypertensive treatment.',       'COMPLETED',   now() - interval '12 days',  now() - interval '9 days'),
    (15, 10, 5, 'Shoulder ultrasound',    'Suspected rotator cuff injury.',                'CANCELLED',   now() - interval '34 days',  now() - interval '30 days'),
    (16,  6, 3, 'Skin swab',              'Recurrent eczema, query infection.',            'PENDING',     now() - interval '3 days',   now() - interval '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO lab_results (id, lab_request_id, result_text, observations, resulted_at) VALUES
    (1,  1, 'TSH 3.1 mIU/L. Free T4 15.2 pmol/L.',                      'Within the reference range on the current dose. No change advised.', now() - interval '20 days'),
    (2,  2, 'Haemoglobin 10.8 g/dL. MCV 74 fL. Ferritin 11 ng/mL.',     'Microcytic picture consistent with iron deficiency.',                now() - interval '111 days'),
    (3,  3, 'Total cholesterol 5.4 mmol/L. LDL 3.3. HDL 1.2. Triglycerides 1.6.', 'Mildly raised. Dietary advice given.',                     now() - interval '201 days'),
    (4,  5, 'Haemoglobin 13.4 g/dL. White cells 6.2. Platelets 249.',   'No abnormality detected.',                                           now() - interval '5 days'),
    (5,  8, 'ALT 28 U/L. AST 24 U/L. Bilirubin 12 umol/L.',             'Liver function normal.',                                             now() - interval '27 days'),
    (6,  9, 'HbA1c 7.8% (62 mmol/mol).',                                'Above target. Treatment adjusted at the following review.',          now() - interval '35 days'),
    (7, 11, 'Sinus rhythm, rate 74. No conduction abnormality.',        'Normal resting trace.',                                              now() - interval '41 days'),
    (8, 14, 'Creatinine 78 umol/L. eGFR above 90.',                     'Renal function normal on treatment.',                                now() - interval '9 days')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('lab_requests', 'id'),
              GREATEST((SELECT MAX(id) FROM lab_requests), 1));
SELECT setval(pg_get_serial_sequence('lab_results', 'id'),
              GREATEST((SELECT MAX(id) FROM lab_results), 1));
