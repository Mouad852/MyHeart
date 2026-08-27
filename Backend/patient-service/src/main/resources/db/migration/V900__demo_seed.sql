-- ============================================================
-- Demo data — the patient register
--
-- Numbered V900 so every real schema change lands before it, and so the seed
-- can be dropped from a deployment that should start empty by excluding this
-- one file from the migration location.
--
-- Ids are explicit and stable. The other services reference patients by id
-- across database boundaries, and appointment 12 belonging to patient 1 has to
-- mean the same thing in six databases. The sequence is reset afterwards so
-- that a patient registered through the UI does not collide with a seeded one.
--
-- Patient 1 is the account `patient.demo` signs in as: the `patientId` claim in
-- the realm export is 1, and every ownership check reads that claim. Renaming
-- or renumbering this row silently empties the patient portal.
--
-- Every person here is fictional.
-- ============================================================

INSERT INTO patients (id, name, email, phone, created_at, updated_at) VALUES
    ( 1, 'Sara Bennani',        'sara.bennani@example.ma',      '+212661234501', now() - interval '3 years',   now() - interval '20 days'),
    ( 2, 'Yasmine Belkacem',    'yasmine.belkacem@example.ma',  '+212661234502', now() - interval '2 years',   now() - interval '40 days'),
    ( 3, 'Omar El Fassi',       'omar.elfassi@example.ma',      '+212661234503', now() - interval '18 months', now() - interval '65 days'),
    ( 4, 'Khadija Tazi',        'khadija.tazi@example.ma',      '+212661234504', now() - interval '14 months', now() - interval '12 days'),
    ( 5, 'Youssef Amrani',      'youssef.amrani@example.ma',    '0661234505',    now() - interval '11 months', now() - interval '90 days'),
    ( 6, 'Nadia Cherkaoui',     'nadia.cherkaoui@example.ma',   '+212661234506', now() - interval '9 months',  now() - interval '5 days'),
    ( 7, 'Hamza Ouazzani',      'hamza.ouazzani@example.ma',    '+212661234507', now() - interval '8 months',  now() - interval '31 days'),
    ( 8, 'Imane Berrada',       'imane.berrada@example.ma',     '0661234508',    now() - interval '7 months',  now() - interval '7 days'),
    ( 9, 'Mehdi Lahlou',        'mehdi.lahlou@example.ma',      '+212661234509', now() - interval '6 months',  now() - interval '55 days'),
    (10, 'Salma Idrissi',       'salma.idrissi@example.ma',     '+212661234510', now() - interval '5 months',  now() - interval '3 days'),
    (11, 'Rachid Benjelloun',   'rachid.benjelloun@example.ma', '+212661234511', now() - interval '4 months',  now() - interval '28 days'),
    (12, 'Fatima Zahra Alaoui', 'fatimazahra.alaoui@example.ma','+212661234512', now() - interval '3 months',  now() - interval '2 days'),
    (13, 'Anas Sbai',           'anas.sbai@example.ma',         '0661234513',    now() - interval '2 months',  now() - interval '18 days'),
    (14, 'Loubna Kettani',      'loubna.kettani@example.ma',    '+212661234514', now() - interval '26 days',   now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- Explicit ids bypass the sequence, which would otherwise still be at 1 and
-- hand a duplicate to the next patient registered through the UI.
SELECT setval(pg_get_serial_sequence('patients', 'id'),
              GREATEST((SELECT MAX(id) FROM patients), 1));
