/**
 * dataset.js — the demo clinic.
 *
 * This is the same clinic as `V900__demo_seed.sql`: the same fourteen patients,
 * six doctors, fifty-four appointments, forty-nine invoices, twelve
 * prescriptions and sixteen laboratory requests, with the same ids. The two
 * have to agree, because a reviewer may see the hosted demo and then run the
 * real stack, and finding a different clinic in each would say the demo was
 * mocked up rather than built from the system.
 *
 * Every date is derived from the moment the page loads, exactly as the SQL is
 * derived from now(). A fixture with fixed dates is a clinic that was busy last
 * spring and has been shut since.
 */

/** Midnight today, local time — the anchor everything else is offset from. */
function midnight() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** ISO local date-time, the shape the services return (no zone suffix). */
function iso(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** `at(0, '14:00')` → today at 14:00. `at(-18, '09:30')` → eighteen days ago. */
function at(dayOffset, time) {
  const [h, m] = time.split(':').map(Number)
  const d = midnight()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return iso(d)
}

/** N days before now, keeping the current time of day. */
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}

/** N days from today as a plain date, for invoice due dates. */
function dateIn(n) {
  const d = midnight()
  d.setDate(d.getDate() + n)
  return iso(d).slice(0, 10)
}

// ── The register ────────────────────────────────────────────────
// Three numbers are in the local 0-prefixed form rather than +212. The patient
// form accepts both, and formatPhone once dropped two digits from exactly this
// shape, so the demo carries the case that found the bug.
export const patients = [
  { id: 1, name: 'Sara Bennani', email: 'sara.bennani@example.ma', phone: '+212661234501' },
  { id: 2, name: 'Yasmine Belkacem', email: 'yasmine.belkacem@example.ma', phone: '+212661234502' },
  { id: 3, name: 'Omar El Fassi', email: 'omar.elfassi@example.ma', phone: '+212661234503' },
  { id: 4, name: 'Khadija Tazi', email: 'khadija.tazi@example.ma', phone: '+212661234504' },
  { id: 5, name: 'Youssef Amrani', email: 'youssef.amrani@example.ma', phone: '0661234505' },
  { id: 6, name: 'Nadia Cherkaoui', email: 'nadia.cherkaoui@example.ma', phone: '+212661234506' },
  { id: 7, name: 'Hamza Ouazzani', email: 'hamza.ouazzani@example.ma', phone: '+212661234507' },
  { id: 8, name: 'Imane Berrada', email: 'imane.berrada@example.ma', phone: '0661234508' },
  { id: 9, name: 'Mehdi Lahlou', email: 'mehdi.lahlou@example.ma', phone: '+212661234509' },
  { id: 10, name: 'Salma Idrissi', email: 'salma.idrissi@example.ma', phone: '+212661234510' },
  { id: 11, name: 'Rachid Benjelloun', email: 'rachid.benjelloun@example.ma', phone: '+212661234511' },
  { id: 12, name: 'Fatima Zahra Alaoui', email: 'fatimazahra.alaoui@example.ma', phone: '+212661234512' },
  { id: 13, name: 'Anas Sbai', email: 'anas.sbai@example.ma', phone: '0661234513' },
  { id: 14, name: 'Loubna Kettani', email: 'loubna.kettani@example.ma', phone: '+212661234514' },
].map((p, i) => ({
  ...p,
  createdAt: daysAgo(1000 - i * 60),
  updatedAt: daysAgo(30 - (i % 25)),
}))

export const doctors = [
  { id: 1, name: 'Amina Haddad', specialty: 'Cardiology', email: 'amina.haddad@medcore.local', phone: '+212522100201' },
  { id: 2, name: 'John Smith', specialty: 'General medicine', email: 'john.smith@medcore.local', phone: '+212522100202' },
  { id: 3, name: 'Karim Bouzidi', specialty: 'Dermatology', email: 'karim.bouzidi@medcore.local', phone: '+212522100203' },
  { id: 4, name: 'Leila Naciri', specialty: 'Paediatrics', email: 'leila.naciri@medcore.local', phone: '+212522100204' },
  { id: 5, name: 'Samir Bennis', specialty: 'Orthopaedics', email: 'samir.bennis@medcore.local', phone: '0522100205' },
  { id: 6, name: 'Hind Squalli', specialty: 'General medicine', email: 'hind.squalli@medcore.local', phone: '+212522100206' },
].map((d, i) => ({
  ...d,
  createdAt: daysAgo(1400 - i * 90),
  updatedAt: daysAgo(90 - i * 10),
}))

// ── The diary ───────────────────────────────────────────────────
// [id, patientId, doctorId, dayOffset, time, status, minutes, notes]
const APPOINTMENTS = [
  // Today, doctor 2 — a morning already seen, an afternoon still to come.
  [1, 3, 2, 0, '08:30', 'COMPLETED', 30, 'Persistent cough, three weeks'],
  [2, 7, 2, 0, '09:00', 'COMPLETED', 30, 'Blood pressure review'],
  [3, 11, 2, 0, '09:30', 'NO_SHOW', 30, 'Follow-up, diabetes'],
  [4, 8, 2, 0, '10:00', 'COMPLETED', 30, 'Sore throat and fever'],
  [5, 13, 2, 0, '10:30', 'COMPLETED', 15, 'Repeat prescription'],
  [6, 6, 2, 0, '11:30', 'CONFIRMED', 30, 'Lower back pain'],
  [7, 2, 2, 0, '14:00', 'CONFIRMED', 30, 'Results review'],
  [8, 10, 2, 0, '14:30', 'CONFIRMED', 30, 'Migraine, worsening'],
  [9, 4, 2, 0, '15:30', 'CONFIRMED', 30, 'Annual check'],
  [10, 14, 2, 0, '16:00', 'CONFIRMED', 30, 'First consultation'],
  // Today, the rest of the clinic.
  [11, 12, 1, 0, '09:00', 'CONFIRMED', 45, 'Palpitations'],
  [12, 5, 1, 0, '11:00', 'COMPLETED', 45, 'Post-operative review'],
  [13, 9, 4, 0, '10:00', 'CONFIRMED', 30, 'Childhood vaccination'],
  [14, 11, 3, 0, '14:00', 'CONFIRMED', 30, 'Recurring rash'],
  [15, 7, 6, 0, '15:00', 'CONFIRMED', 30, 'Fatigue'],
  // Awaiting a decision — the Overview queue.
  [16, 14, 2, 1, '16:30', 'REQUESTED', 30, 'Requested online — chest tightness'],
  [17, 5, 2, 2, '09:00', 'REQUESTED', 30, 'Requested online — knee pain'],
  [18, 9, 6, 3, '11:00', 'REQUESTED', 30, 'Requested online — sleep problems'],
  [19, 12, 1, 4, '10:30', 'REQUESTED', 45, 'Requested online — follow-up'],
  // Patient 1 — next, then fourteen months of history.
  [20, 1, 2, 3, '09:00', 'CONFIRMED', 30, 'Thyroid review'],
  [21, 1, 2, -18, '09:30', 'COMPLETED', 30, 'Thyroid function follow-up'],
  [22, 1, 1, -45, '11:00', 'COMPLETED', 45, 'Cardiology referral'],
  [23, 1, 2, -74, '14:30', 'COMPLETED', 30, 'Fatigue and weight change'],
  [24, 1, 2, -95, '10:00', 'CANCELLED', 30, 'Routine review'],
  [25, 1, 2, -110, '09:00', 'COMPLETED', 30, 'Blood test review'],
  [26, 1, 2, -130, '15:00', 'NO_SHOW', 30, 'Routine review'],
  [27, 1, 2, -150, '11:30', 'COMPLETED', 30, 'Persistent headaches'],
  [28, 1, 1, -200, '10:30', 'COMPLETED', 45, 'Cardiology, first visit'],
  [29, 1, 2, -260, '09:00', 'COMPLETED', 30, 'Seasonal allergy'],
  [30, 1, 2, -320, '16:00', 'COMPLETED', 30, 'Annual check'],
  [31, 1, 3, -400, '14:00', 'COMPLETED', 30, 'Skin complaint'],
  // The rest of the clinic's recent history.
  [32, 2, 2, -9, '11:00', 'COMPLETED', 30, 'Blood tests requested'],
  [33, 3, 2, -12, '15:00', 'COMPLETED', 30, 'Chest infection'],
  [34, 4, 1, -15, '09:30', 'COMPLETED', 45, 'Cardiology follow-up'],
  [35, 6, 3, -21, '14:30', 'COMPLETED', 30, 'Eczema review'],
  [36, 8, 4, -26, '10:00', 'COMPLETED', 30, 'Paediatric review'],
  [37, 9, 2, -30, '16:00', 'COMPLETED', 30, 'Abdominal pain'],
  [38, 10, 5, -34, '11:00', 'COMPLETED', 45, 'Shoulder injury'],
  [39, 11, 2, -38, '09:00', 'COMPLETED', 30, 'Diabetes review'],
  [40, 12, 1, -44, '15:30', 'COMPLETED', 45, 'Palpitations, first visit'],
  [41, 13, 6, -50, '10:30', 'COMPLETED', 30, 'General consultation'],
  [42, 5, 5, -58, '14:00', 'COMPLETED', 60, 'Knee, pre-operative'],
  [43, 7, 2, -63, '11:30', 'CANCELLED', 30, 'Routine review'],
  [44, 14, 6, -20, '09:30', 'COMPLETED', 30, 'Registration consultation'],
  [45, 6, 2, -5, '14:00', 'COMPLETED', 30, 'Back pain, first visit'],
  [46, 4, 2, -2, '10:00', 'NO_SHOW', 30, 'Annual check'],
  // Still to come.
  [47, 3, 2, 1, '10:00', 'CONFIRMED', 30, 'Cough follow-up'],
  [48, 8, 2, 1, '11:00', 'CONFIRMED', 30, 'Throat review'],
  [49, 12, 1, 2, '15:00', 'CONFIRMED', 45, 'Cardiology follow-up'],
  [50, 6, 3, 5, '14:30', 'CONFIRMED', 30, 'Eczema review'],
  [51, 10, 5, 7, '11:00', 'CONFIRMED', 45, 'Shoulder review'],
  [52, 9, 4, 9, '10:00', 'CONFIRMED', 30, 'Vaccination, second'],
  [53, 13, 6, 12, '10:30', 'CONFIRMED', 30, 'General review'],
  [54, 2, 2, 14, '09:30', 'CONFIRMED', 30, 'Six-week review'],
]

export const appointments = APPOINTMENTS.map(
  ([id, patientId, doctorId, day, time, status, durationMinutes, notes]) => ({
    id,
    patientId,
    doctorId,
    appointmentDate: at(day, time),
    status,
    durationMinutes,
    notes,
    cancellationReason:
      status === 'CANCELLED' ? 'Cancelled by the patient' : null,
    statusChangedAt: status === 'CONFIRMED' ? null : at(day, time),
    createdAt: daysAgo(Math.min(400, Math.abs(day) + 12)),
  })
)

// ── The ledger ──────────────────────────────────────────────────
// [id, appointmentId, patientId, serviceCode, status, issuedDayOffset, paidDayOffset]
const PRICES = {
  CONSULTATION: [300, 'General consultation'],
  FOLLOW_UP: [180, 'Follow-up visit'],
  SPECIALIST: [500, 'Specialist consultation'],
  LAB_REVIEW: [150, 'Laboratory review'],
  PROCEDURE: [850, 'Minor procedure'],
}

const INVOICES = [
  [1, 1, 3, 'CONSULTATION', 'ISSUED', -9, null],
  [2, 2, 7, 'FOLLOW_UP', 'ISSUED', -12, null],
  [3, 3, 11, 'FOLLOW_UP', 'VOID', -15, null],
  [4, 4, 8, 'CONSULTATION', 'PAID', -4, 0],
  [5, 5, 13, 'FOLLOW_UP', 'PAID', -6, 0],
  [6, 6, 6, 'CONSULTATION', 'ISSUED', -11, null],
  [7, 7, 2, 'LAB_REVIEW', 'ISSUED', -8, null],
  [8, 8, 10, 'CONSULTATION', 'ISSUED', -5, null],
  [9, 9, 4, 'CONSULTATION', 'ISSUED', -20, null],
  [10, 10, 14, 'CONSULTATION', 'ISSUED', -2, null],
  [11, 11, 12, 'SPECIALIST', 'ISSUED', -16, null],
  [12, 12, 5, 'SPECIALIST', 'PAID', -22, -1],
  [13, 13, 9, 'CONSULTATION', 'ISSUED', -18, null],
  [14, 14, 11, 'CONSULTATION', 'ISSUED', -7, null],
  [15, 15, 7, 'CONSULTATION', 'ISSUED', -3, null],
  [16, 20, 1, 'FOLLOW_UP', 'ISSUED', -10, null],
  [17, 21, 1, 'FOLLOW_UP', 'PAID', -48, -17],
  [18, 22, 1, 'SPECIALIST', 'PAID', -70, -44],
  [19, 23, 1, 'CONSULTATION', 'PAID', -90, -73],
  [20, 24, 1, 'CONSULTATION', 'VOID', -115, null],
  [21, 25, 1, 'LAB_REVIEW', 'PAID', -130, -109],
  [22, 26, 1, 'CONSULTATION', 'ISSUED', -150, null],
  [23, 27, 1, 'CONSULTATION', 'PAID', -170, -149],
  [24, 28, 1, 'SPECIALIST', 'PAID', -225, -199],
  [25, 29, 1, 'CONSULTATION', 'PAID', -280, -259],
  [26, 30, 1, 'CONSULTATION', 'PAID', -340, -319],
  [27, 31, 1, 'SPECIALIST', 'PAID', -420, -399],
  [28, 32, 2, 'CONSULTATION', 'PAID', -25, -8],
  [29, 33, 3, 'CONSULTATION', 'PAID', -30, -11],
  [30, 34, 4, 'SPECIALIST', 'ISSUED', -40, null],
  [31, 35, 6, 'SPECIALIST', 'PAID', -45, -20],
  [32, 36, 8, 'CONSULTATION', 'ISSUED', -50, null],
  [33, 37, 9, 'CONSULTATION', 'PAID', -55, -29],
  [34, 38, 10, 'SPECIALIST', 'ISSUED', -60, null],
  [35, 39, 11, 'FOLLOW_UP', 'PAID', -65, -37],
  [36, 40, 12, 'SPECIALIST', 'PAID', -70, -43],
  [37, 41, 13, 'CONSULTATION', 'PAID', -75, -49],
  [38, 42, 5, 'PROCEDURE', 'REFUNDED', -80, -57],
  [39, 44, 14, 'CONSULTATION', 'ISSUED', -26, null],
  [40, 45, 6, 'CONSULTATION', 'PAID', -18, -4],
  [41, 46, 4, 'CONSULTATION', 'ISSUED', -30, null],
  [42, 47, 3, 'FOLLOW_UP', 'ISSUED', -3, null],
  [43, 48, 8, 'FOLLOW_UP', 'ISSUED', -1, null],
  [44, 49, 12, 'SPECIALIST', 'ISSUED', -30, null],
  [45, 50, 6, 'SPECIALIST', 'ISSUED', -21, null],
  [46, 51, 10, 'SPECIALIST', 'ISSUED', -34, null],
  [47, 52, 9, 'CONSULTATION', 'ISSUED', -18, null],
  [48, 53, 13, 'CONSULTATION', 'ISSUED', -50, null],
  [49, 54, 2, 'FOLLOW_UP', 'ISSUED', -9, null],
]

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER']

export const invoices = INVOICES.map(
  ([id, appointmentId, patientId, serviceCode, status, issuedDay, paidDay]) => {
    const [amount, description] = PRICES[serviceCode]
    return {
      id,
      appointmentId,
      patientId,
      amount,
      currency: 'MAD',
      status,
      description,
      serviceCode,
      issuedAt: daysAgo(-issuedDay),
      // Thirty days' terms, so being overdue is derived on read from the due
      // date rather than stored — the same rule the service applies.
      dueDate: dateIn(issuedDay + 30),
      paymentMethod: paidDay === null ? null : PAYMENT_METHODS[id % 3],
      paidAt: paidDay === null ? null : daysAgo(-paidDay),
      voidReason:
        id === 20
          ? 'Appointment cancelled by the patient'
          : id === 3
            ? 'Patient did not attend; not charged'
            : null,
      createdAt: daysAgo(-issuedDay),
    }
  }
)

export const clinicServices = Object.entries(PRICES).map(
  ([code, [price, name]], i) => ({
    id: i + 1,
    code,
    name,
    price,
    currency: 'MAD',
    durationMinutes: code === 'PROCEDURE' ? 60 : code === 'SPECIALIST' ? 45 : 30,
    active: true,
  })
)

// ── What was written ────────────────────────────────────────────
const PRESCRIPTIONS = [
  [1, 1, 2, 'Hypothyroidism', 'Continue current dose. Repeat thyroid function in three months.', -18],
  [2, 1, 2, 'Iron deficiency anaemia', 'Review after the next blood count.', -110],
  [3, 1, 1, 'Essential hypertension', 'Started on a single agent. Blood pressure diary requested.', -200],
  [4, 1, 2, 'Seasonal allergic rhinitis', 'Short course during the pollen season.', -260],
  [5, 3, 2, 'Acute bronchitis', 'Return if the fever has not settled in three days.', -12],
  [6, 8, 2, 'Acute tonsillitis', 'Complete the full course.', -4],
  [7, 13, 2, 'Type 2 diabetes', 'Repeat prescription, unchanged.', -6],
  [8, 6, 3, 'Atopic eczema', 'Apply thinly. Stop if the skin becomes sore.', -21],
  [9, 11, 2, 'Type 2 diabetes', 'Dose increased after the last review.', -38],
  [10, 9, 2, 'Gastro-oesophageal reflux', 'Four-week course, then review.', -30],
  [11, 10, 5, 'Rotator cuff strain', 'Analgesia and physiotherapy referral.', -34],
  [12, 7, 2, 'Essential hypertension', 'Blood pressure well controlled; continue.', -12],
]

const ITEMS = [
  [1, 1, 'Levothyroxine', '75 mcg', 'Once daily', '3 months', 'Take in the morning, at least 30 minutes before breakfast.'],
  [2, 2, 'Ferrous sulfate', '200 mg', 'Twice daily', '2 months', 'Take with food. May darken the stool, which is expected.'],
  [3, 2, 'Ascorbic acid', '500 mg', 'Once daily', '2 months', 'Taken alongside the iron to help absorption.'],
  [4, 3, 'Amlodipine', '5 mg', 'Once daily', '3 months', 'Take at the same time each day. Report any ankle swelling.'],
  [5, 4, 'Loratadine', '10 mg', 'Once daily', '4 weeks', 'Take in the morning. May be stopped once symptoms settle.'],
  [6, 5, 'Amoxicillin', '500 mg', 'Three times daily', '7 days', 'Complete the course even if the cough improves.'],
  [7, 5, 'Paracetamol', '1 g', 'Up to four times daily', '5 days', 'For fever or discomfort. Leave at least four hours between doses.'],
  [8, 6, 'Amoxicillin', '500 mg', 'Three times daily', '7 days', 'Complete the course.'],
  [9, 6, 'Ibuprofen', '400 mg', 'Three times daily', '5 days', 'Take with food.'],
  [10, 7, 'Metformin', '850 mg', 'Twice daily', '3 months', 'Take with meals to reduce stomach upset.'],
  [11, 8, 'Hydrocortisone cream', '1%', 'Twice daily', '2 weeks', 'Apply thinly to the affected area only.'],
  [12, 8, 'Emollient ointment', '-', 'As needed', '3 months', 'Apply generously and as often as required.'],
  [13, 9, 'Metformin', '1 g', 'Twice daily', '3 months', 'Take with meals.'],
  [14, 9, 'Gliclazide', '40 mg', 'Once daily', '3 months', 'Take with breakfast.'],
  [15, 10, 'Omeprazole', '20 mg', 'Once daily', '4 weeks', 'Take before breakfast.'],
  [16, 11, 'Naproxen', '250 mg', 'Twice daily', '10 days', 'Take with food.'],
  [17, 11, 'Paracetamol', '1 g', 'Up to four times daily', '10 days', 'For additional pain relief if needed.'],
  [18, 12, 'Amlodipine', '5 mg', 'Once daily', '6 months', 'Continue at the current dose.'],
]

export const prescriptions = PRESCRIPTIONS.map(
  ([id, patientId, doctorId, diagnosis, notes, day]) => ({
    id,
    patientId,
    doctorId,
    diagnosis,
    notes,
    createdAt: daysAgo(-day),
    items: ITEMS.filter(([, pid]) => pid === id).map(
      ([itemId, , medicineName, dosage, frequency, duration, instructions]) => ({
        id: itemId,
        medicineName,
        dosage,
        frequency,
        duration,
        instructions,
      })
    ),
  })
)

// ── The laboratory ──────────────────────────────────────────────
const LAB_REQUESTS = [
  [1, 1, 2, 'Thyroid function', 'TSH, free T4. Dose review.', 'COMPLETED', -25],
  [2, 1, 2, 'Full blood count', 'Anaemia follow-up.', 'COMPLETED', -115],
  [3, 1, 1, 'Lipid profile', 'Cardiovascular risk assessment.', 'COMPLETED', -205],
  [4, 1, 2, 'Thyroid function', 'Three-month repeat before the next review.', 'PENDING', -2],
  [5, 2, 2, 'Full blood count', 'Fatigue, no obvious cause.', 'COMPLETED', -9],
  [6, 2, 2, 'Vitamin D', 'Requested alongside the blood count.', 'IN_PROGRESS', -9],
  [7, 3, 2, 'Chest X-ray', 'Persistent cough, three weeks.', 'IN_PROGRESS', -1],
  [8, 9, 2, 'Liver function', 'Abdominal pain.', 'COMPLETED', -30],
  [9, 11, 2, 'HbA1c', 'Diabetes control.', 'COMPLETED', -38],
  [10, 11, 2, 'HbA1c', 'Three-month repeat.', 'PENDING', -1],
  [11, 12, 1, 'Electrocardiogram', 'Palpitations.', 'COMPLETED', -44],
  [12, 4, 1, 'Lipid profile', 'Cardiology follow-up.', 'IN_PROGRESS', -15],
  [13, 8, 2, 'Throat swab', 'Tonsillitis, culture requested.', 'PENDING', -4],
  [14, 7, 2, 'Renal function', 'Routine, on antihypertensive treatment.', 'COMPLETED', -12],
  [15, 10, 5, 'Shoulder ultrasound', 'Suspected rotator cuff injury.', 'CANCELLED', -34],
  [16, 6, 3, 'Skin swab', 'Recurrent eczema, query infection.', 'PENDING', -3],
]

export const labRequests = LAB_REQUESTS.map(
  ([id, patientId, doctorId, testName, testDescription, status, day]) => ({
    id,
    patientId,
    doctorId,
    testName,
    testDescription,
    status,
    requestedAt: daysAgo(-day),
  })
)

// No result carries a file. An attachment is a real object in storage with a
// checksum, and a download button that can only fail is worse than none.
// Uploading one is part of the demo.
const LAB_RESULTS = [
  [1, 1, 'TSH 3.1 mIU/L. Free T4 15.2 pmol/L.', 'Within the reference range on the current dose. No change advised.', -20],
  [2, 2, 'Haemoglobin 10.8 g/dL. MCV 74 fL. Ferritin 11 ng/mL.', 'Microcytic picture consistent with iron deficiency.', -111],
  [3, 3, 'Total cholesterol 5.4 mmol/L. LDL 3.3. HDL 1.2. Triglycerides 1.6.', 'Mildly raised. Dietary advice given.', -201],
  [4, 5, 'Haemoglobin 13.4 g/dL. White cells 6.2. Platelets 249.', 'No abnormality detected.', -5],
  [5, 8, 'ALT 28 U/L. AST 24 U/L. Bilirubin 12 umol/L.', 'Liver function normal.', -27],
  [6, 9, 'HbA1c 7.8% (62 mmol/mol).', 'Above target. Treatment adjusted at the following review.', -35],
  [7, 11, 'Sinus rhythm, rate 74. No conduction abnormality.', 'Normal resting trace.', -41],
  [8, 14, 'Creatinine 78 umol/L. eGFR above 90.', 'Renal function normal on treatment.', -9],
]

export const labResults = LAB_RESULTS.map(
  ([id, labRequestId, resultText, observations, day]) => ({
    id,
    labRequestId,
    resultText,
    observations,
    resultedAt: daysAgo(-day),
    filePath: null,
    fileName: null,
    fileContentType: null,
    fileSize: null,
    fileUploadedAt: null,
  })
)

export { iso }
