-- ============================================================
-- Demo data — the medical register
--
-- Doctor 2 is the account `doctor.demo` signs in as: the `doctorId` claim in
-- the realm export is 2, and Today is scoped server-side from that claim. The
-- name matches the Keycloak user so the header and the day agree about who is
-- signed in.
--
-- Six specialties, because the doctors page narrows the list to one specialty
-- in a click and that control has nothing to do on a register of three.
--
-- Every person here is fictional.
-- ============================================================

INSERT INTO doctors (id, name, specialty, email, phone, created_at, updated_at) VALUES
    (1, 'Amina Haddad',   'Cardiology',        'amina.haddad@medcore.local',   '+212522100201', now() - interval '4 years',   now() - interval '60 days'),
    (2, 'John Smith',     'General medicine',  'john.smith@medcore.local',     '+212522100202', now() - interval '3 years',   now() - interval '14 days'),
    (3, 'Karim Bouzidi',  'Dermatology',       'karim.bouzidi@medcore.local',  '+212522100203', now() - interval '3 years',   now() - interval '90 days'),
    (4, 'Leila Naciri',   'Paediatrics',       'leila.naciri@medcore.local',   '+212522100204', now() - interval '2 years',   now() - interval '45 days'),
    (5, 'Samir Bennis',   'Orthopaedics',      'samir.bennis@medcore.local',   '0522100205',    now() - interval '18 months', now() - interval '30 days'),
    (6, 'Hind Squalli',   'General medicine',  'hind.squalli@medcore.local',   '+212522100206', now() - interval '11 months', now() - interval '9 days')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('doctors', 'id'),
              GREATEST((SELECT MAX(id) FROM doctors), 1));
