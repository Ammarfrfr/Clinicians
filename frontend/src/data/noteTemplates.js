/**
 * Specialty-specific clinical note templates.
 *
 * Each template defines:
 *  - id: unique identifier
 *  - label: display name shown in the dropdown
 *  - icon: emoji for visual distinction
 *  - sections: array of { key, label, rows, placeholder } objects
 *      that replace the default SOAP clinicalFields in NotePanel.
 *
 * All templates keep prescription + followup in the "Patient Handout" compartment
 * (handled separately in NotePanel), so they are NOT listed in sections.
 */

const DEFAULT_SECTIONS = [
  { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Main symptom, severity, duration...' },
  { key: 'history', label: 'History', rows: 4, placeholder: 'Patient history, medications tried, risk factors...' },
  { key: 'examination', label: 'Examination', rows: 4, placeholder: 'Physical findings, vitals, test results...' },
  { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Clinical impression or confirmed diagnosis...' },
];

export const NOTE_TEMPLATES = {
  'General Practice': {
    id: 'general',
    label: 'General SOAP',
    icon: '🩺',
    sections: DEFAULT_SECTIONS,
  },

  'Cardiology': {
    id: 'cardiology',
    label: 'Cardiology',
    icon: '❤️',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Chest pain, dyspnea, palpitations, syncope...' },
      { key: 'history', label: 'Cardiovascular History', rows: 4, placeholder: 'Cardiac risk factors, family history of CAD, HTN, DM, smoking, lipids...' },
      { key: 'examination', label: 'Cardiovascular Examination', rows: 4, placeholder: 'JVP, heart sounds, murmurs, peripheral pulses, edema...' },
      { key: 'investigations', label: 'ECG / Echo / Investigations', rows: 3, placeholder: 'ECG findings, Echo report, stress test, Holter, catheterization...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'ACS, CHF, AF, VHD, HTN...' },
    ],
  },

  'Orthopedics': {
    id: 'orthopedics',
    label: 'Orthopedics',
    icon: '🦴',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Joint pain, fracture, deformity, restricted movement...' },
      { key: 'history', label: 'Musculoskeletal History', rows: 4, placeholder: 'Mechanism of injury, onset, previous surgeries, occupation...' },
      { key: 'examination', label: 'Musculoskeletal Examination', rows: 4, placeholder: 'Inspection, ROM, tenderness, special tests (Lachman, McMurray, etc.)...' },
      { key: 'imaging', label: 'Imaging / Investigations', rows: 3, placeholder: 'X-ray findings, MRI report, CT scan, bone density...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Fracture type, OA grade, ligament tear, disc herniation...' },
      { key: 'plan', label: 'Management Plan', rows: 3, placeholder: 'Conservative vs surgical, immobilization, physiotherapy plan...' },
    ],
  },

  'Pediatrics': {
    id: 'pediatrics',
    label: 'Pediatrics',
    icon: '👶',
    sections: [
      { key: 'chief_complaint', label: 'Presenting Complaint', rows: 2, placeholder: 'Fever, cough, diarrhea, rash, poor feeding...' },
      { key: 'history', label: 'History (incl. Birth & Feeding)', rows: 4, placeholder: 'Birth history, immunization, feeding, milestones, family history...' },
      { key: 'examination', label: 'Systemic Examination', rows: 4, placeholder: 'Growth parameters, fontanelle, ENT, chest, abdomen, CNS...' },
      { key: 'milestones', label: 'Developmental Milestones', rows: 2, placeholder: 'Gross motor, fine motor, language, social milestones for age...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Clinical impression...' },
    ],
  },

  'Psychiatry': {
    id: 'psychiatry',
    label: 'Psychiatry',
    icon: '🧠',
    sections: [
      { key: 'chief_complaint', label: 'Presenting Complaint', rows: 2, placeholder: 'Low mood, anxiety, insomnia, substance use, behavioral change...' },
      { key: 'history', label: 'Psychiatric History', rows: 4, placeholder: 'Onset, course, precipitating factors, past episodes, substance history, family history...' },
      { key: 'mse', label: 'Mental State Examination (MSE)', rows: 5, placeholder: 'Appearance, behavior, speech, mood/affect, thought form/content, perception, cognition, insight, judgment...' },
      { key: 'risk_assessment', label: 'Risk Assessment', rows: 2, placeholder: 'Suicidal ideation, self-harm, harm to others, vulnerability...' },
      { key: 'diagnosis', label: 'Diagnosis (ICD/DSM)', rows: 2, placeholder: 'MDD, GAD, Bipolar, Schizophrenia, PTSD...' },
    ],
  },

  'Dermatology': {
    id: 'dermatology',
    label: 'Dermatology',
    icon: '🧴',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Rash, itching, pigmentation, hair loss, nail changes...' },
      { key: 'history', label: 'Dermatological History', rows: 4, placeholder: 'Duration, progression, triggers, medications tried, atopic history...' },
      { key: 'examination', label: 'Lesion Description', rows: 4, placeholder: 'Morphology (macule, papule, plaque), distribution, color, borders, surface, arrangement...' },
      { key: 'investigations', label: 'Investigations', rows: 2, placeholder: 'KOH mount, skin biopsy, patch test, dermoscopy findings...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Eczema, psoriasis, fungal infection, contact dermatitis...' },
    ],
  },

  'ENT': {
    id: 'ent',
    label: 'ENT',
    icon: '👂',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Ear pain, hearing loss, sore throat, nasal obstruction, vertigo...' },
      { key: 'history', label: 'ENT History', rows: 4, placeholder: 'Duration, laterality, discharge, tinnitus, snoring, voice change...' },
      { key: 'examination', label: 'ENT Examination', rows: 4, placeholder: 'Otoscopy, anterior rhinoscopy, oropharynx, neck palpation, tuning fork tests...' },
      { key: 'investigations', label: 'Investigations', rows: 2, placeholder: 'Audiometry, tympanometry, CT PNS, FNAC, endoscopy...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'CSOM, DNS, tonsillitis, sinusitis, BPPV...' },
    ],
  },

  'Obstetrics & Gynecology': {
    id: 'obgyn',
    label: 'OB-GYN',
    icon: '🤰',
    sections: [
      { key: 'chief_complaint', label: 'Presenting Complaint', rows: 2, placeholder: 'Amenorrhea, bleeding, discharge, pain, pregnancy follow-up...' },
      { key: 'history', label: 'OB-GYN History', rows: 4, placeholder: 'Menstrual history (LMP, cycle), obstetric history (GPAL), contraception, sexual history...' },
      { key: 'examination', label: 'Examination', rows: 4, placeholder: 'Per abdomen (fundal height, FHS), per speculum, per vaginum, cervical findings...' },
      { key: 'investigations', label: 'Investigations', rows: 2, placeholder: 'USG findings, blood work, Pap smear, GTT, anomaly scan...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Intrauterine pregnancy, PCOS, fibroid, PID...' },
    ],
  },

  'Internal Medicine': {
    id: 'internal_medicine',
    label: 'Internal Medicine',
    icon: '🏥',
    sections: DEFAULT_SECTIONS,
  },

  'Ophthalmology': {
    id: 'ophthalmology',
    label: 'Ophthalmology',
    icon: '👁️',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Blurred vision, redness, pain, discharge, floaters, flashes...' },
      { key: 'history', label: 'Ophthalmic History', rows: 4, placeholder: 'Duration, laterality, glasses history, DM/HTN, previous eye surgery...' },
      { key: 'examination', label: 'Eye Examination', rows: 4, placeholder: 'VA (R/L), IOP, slit-lamp, fundoscopy, pupil reactions, EOM...' },
      { key: 'investigations', label: 'Investigations', rows: 2, placeholder: 'OCT, FFA, visual fields, B-scan, refraction...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Cataract, glaucoma, DR, AMD, conjunctivitis...' },
    ],
  },

  'Surgery': {
    id: 'surgery',
    label: 'Surgery',
    icon: '🔪',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Abdominal pain, lump, bleeding, obstruction...' },
      { key: 'history', label: 'Surgical History', rows: 4, placeholder: 'Duration, progression, past surgeries, comorbidities, anesthesia history...' },
      { key: 'examination', label: 'Examination', rows: 4, placeholder: 'Local examination, systemic examination, per rectal, per abdomen...' },
      { key: 'investigations', label: 'Investigations', rows: 2, placeholder: 'Blood work, imaging (USG/CT/MRI), endoscopy, biopsy...' },
      { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Appendicitis, hernia, cholecystitis, malignancy...' },
      { key: 'plan', label: 'Surgical Plan', rows: 3, placeholder: 'Procedure planned, pre-op workup, consent, post-op care...' },
    ],
  },
};

/**
 * Get the best matching template for a doctor's specialization.
 * Falls back to General Practice if no match.
 */
export function getTemplateForSpecialization(specialization) {
  if (!specialization) return NOTE_TEMPLATES['General Practice'];
  return NOTE_TEMPLATES[specialization] || NOTE_TEMPLATES['General Practice'];
}

/**
 * Get all available template options for the dropdown.
 */
export function getAllTemplateOptions() {
  return Object.entries(NOTE_TEMPLATES).map(([key, tmpl]) => ({
    value: key,
    label: tmpl.label,
    id: tmpl.id,
  }));
}
