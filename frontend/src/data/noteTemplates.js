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


export const NOTE_TEMPLATES = {
  'SOAP': {
    id: 'soap',
    label: 'SOAP',
    icon: '',
    sections: [
      { key: 'subjective', label: 'Subjective', rows: 3, placeholder: 'Patient history, symptoms, onset...' },
      { key: 'objective', label: 'Objective', rows: 3, placeholder: 'Physical exam findings, test results, vitals...' },
      { key: 'assessment', label: 'Assessment', rows: 3, placeholder: 'Differential diagnosis, clinical impression...' },
      { key: 'plan', label: 'Plan', rows: 3, placeholder: 'Prescriptions, follow up instructions, care plan...' }
    ]
  },
  'Patient Handout': {
    id: 'patient_handout',
    label: 'Patient Handout',
    icon: '',
    sections: [
      { key: 'diagnosis_summary', label: 'What We Found', rows: 3, placeholder: 'Simple explanation of diagnosis...' },
      { key: 'medications', label: 'Your Medications', rows: 3, placeholder: 'Medicines prescribed with instructions...' },
      { key: 'exercises', label: 'Exercises & Rehabilitation', rows: 3, placeholder: 'Prescribed exercises with instructions...' },
      { key: 'lifestyle_advice', label: 'Lifestyle Advice', rows: 2, placeholder: 'Diet, activity, rest instructions...' },
      { key: 'warning_signs', label: 'When to Seek Immediate Care', rows: 2, placeholder: 'Red flag symptoms to watch for...' },
      { key: 'followup', label: 'Next Appointment & Advice', rows: 2, placeholder: 'Follow-up date and instructions...' },
    ]
  },
  'Discharge Summary': {
    id: 'discharge_summary',
    label: 'Discharge Summary',
    icon: '',
    sections: [
      { key: 'admission_date', label: 'Admission Date', rows: 1, placeholder: 'Date of admission...' },
      { key: 'discharge_date', label: 'Discharge Date', rows: 1, placeholder: 'Date of discharge...' },
      { key: 'primary_diagnosis', label: 'Primary Discharge Diagnosis', rows: 2, placeholder: 'Main diagnosis on discharge...' },
      { key: 'secondary_diagnoses', label: 'Secondary Diagnoses', rows: 2, placeholder: 'Comorbidities & secondary diagnoses...' },
      { key: 'reason_for_admission', label: 'Reason for Admission', rows: 2, placeholder: 'Chief complaint & reason for stay...' },
      { key: 'key_investigations_procedures', label: 'Key Investigations & Procedures', rows: 4, placeholder: 'Tests, imaging, labs, & procedures done...' },
      { key: 'hospital_course', label: 'Hospital Course', rows: 5, placeholder: 'Chronological summary of hospital stay...' },
      { key: 'condition_at_discharge', label: 'Condition at Discharge', rows: 2, placeholder: 'Clinical state at discharge...' },
      { key: 'discharge_medications', label: 'Discharge Medications', rows: 3, placeholder: 'Meds, doses, and frequency...' },
      { key: 'discharge_instructions', label: 'Discharge Instructions', rows: 3, placeholder: 'Diet, wound care, restrictions...' },
      { key: 'followup', label: 'Follow-up & Pending Results', rows: 2, placeholder: 'Follow-up timeline and pending lab tests...' },
    ]
  },
  'Sick Note': {
    id: 'sick_note',
    label: 'Sick Note',
    icon: '',
    sections: [
      { key: 'assessment_date', label: 'Assessment Date', rows: 1, placeholder: 'Date of clinical assessment...' },
      { key: 'reason_for_absence', label: 'Reason for Absence', rows: 2, placeholder: 'General authorized clinical reason...' },
      { key: 'absence_period', label: 'Recommended Absence Period', rows: 2, placeholder: 'E.g. 3 days (from Date to Date)...' },
      { key: 'work_restrictions', label: 'Work / Duty Restrictions', rows: 2, placeholder: 'Specific work or physical activity restrictions...' },
      { key: 'notes', label: 'Certificate Remarks', rows: 2, placeholder: 'Additional clinical remarks...' },
    ]
  },
  'Admission Note': {
    id: 'admission_note',
    label: 'Admission Note',
    icon: '',
    sections: [
      { key: 'patient_identification', label: 'Patient Identification', rows: 2, placeholder: 'Name, age, gender, MRN...' },
      { key: 'presenting_complaint', label: 'Presenting Complaint', rows: 2, placeholder: 'Reason for admission...' },
      { key: 'hpi', label: 'History of Present Illness', rows: 4, placeholder: 'Detailed history of symptoms...' },
      { key: 'pmh', label: 'Past Medical History', rows: 3, placeholder: 'Comorbidities, past surgical history...' },
      { key: 'meds_allergies', label: 'Medications & Allergies', rows: 2, placeholder: 'Current meds and documented allergies...' },
      { key: 'exam', label: 'Systemic Examination', rows: 4, placeholder: 'Vitals, general physical, cardiac, resp...' },
      { key: 'plan', label: 'Initial Treatment Plan', rows: 3, placeholder: 'Admit orders, IV fluids, initial drugs...' },
    ]
  },
  'Consult Note': {
    id: 'consult_note',
    label: 'Consult Note',
    icon: '',
    sections: [
      { key: 'reason_for_consult', label: 'Reason for Consultation', rows: 2, placeholder: 'Why was consult requested?' },
      { key: 'hpi', label: 'History of Present Illness', rows: 4, placeholder: 'Relevant history...' },
      { key: 'examination', label: 'Findings / Examination', rows: 4, placeholder: 'Physical exam findings...' },
      { key: 'diagnosis', label: 'Impression / Diagnosis', rows: 2, placeholder: 'Clinical impression...' },
      { key: 'recommendations', label: 'Recommendations', rows: 4, placeholder: 'Treatment/management advice...' },
    ]
  },
  'Surgery Consult': {
    id: 'surgery_consult',
    label: 'Surgery Consult',
    icon: '',
    sections: [
      { key: 'consult_question', label: 'Consultation Question', rows: 2, placeholder: 'Surgical consult question...' },
      { key: 'relevant_history', label: 'Relevant Clinical History', rows: 4, placeholder: 'HPI and surgical history...' },
      { key: 'examination_findings', label: 'Examination Findings', rows: 4, placeholder: 'Physical exam findings...' },
      { key: 'investigations_reviewed', label: 'Investigations Reviewed', rows: 3, placeholder: 'Labs, CT/MRI, X-rays...' },
      { key: 'impression', label: 'Surgical Impression', rows: 3, placeholder: 'Impression & operative indication...' },
      { key: 'recommendations', label: 'Surgical Recommendations', rows: 4, placeholder: 'Surgical management plan & orders...' },
    ]
  },
  'Referral Letter': {
    id: 'referral_letter',
    label: 'Referral Letter',
    icon: '',
    sections: [
      { key: 'recipient', label: 'Recipient Doctor Details', rows: 2, placeholder: 'Dr. Name, specialty, hospital...' },
      { key: 'introduction', label: 'Patient Introduction', rows: 2, placeholder: 'Patient name, age, gender...' },
      { key: 'history_diagnosis', label: 'Clinical History & Diagnosis', rows: 4, placeholder: 'Summary of clinical presentation...' },
      { key: 'purpose', label: 'Purpose of Referral', rows: 2, placeholder: 'Reason for sending the patient...' },
    ]
  },
  'History & Physical': {
    id: 'history_physical',
    label: 'History & Physical',
    icon: '',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Reason for encounter...' },
      { key: 'hpi', label: 'History of Present Illness', rows: 4, placeholder: 'HPI details...' },
      { key: 'past_history', label: 'Past Medical/Surgical History', rows: 3, placeholder: 'Prior history...' },
      { key: 'ros', label: 'Review of Systems', rows: 4, placeholder: 'Systemic review...' },
      { key: 'physical_exam', label: 'Physical Examination', rows: 4, placeholder: 'Physical exam findings...' },
      { key: 'assessment_plan', label: 'Assessment & Plan', rows: 4, placeholder: 'Differential diagnosis and plan...' },
    ]
  },
  'Orthopaedic Surgery Consult': {
    id: 'ortho_consult',
    label: 'Orthopaedic Surgery Consult',
    icon: '',
    sections: [
      { key: 'chief_complaint', label: 'Chief Complaint (Joint/Limb)', rows: 2, placeholder: 'Affected limb/joint pain...' },
      { key: 'history', label: 'Mechanism of Injury / History', rows: 4, placeholder: 'Onset, injury mechanism...' },
      { key: 'examination', label: 'Orthopaedic Examination', rows: 4, placeholder: 'Inspection, tenderness, deformity...' },
      { key: 'rom', label: 'Range of Motion / Special Tests', rows: 3, placeholder: 'ROM, stability, special tests...' },
      { key: 'imaging', label: 'Imaging Findings', rows: 3, placeholder: 'X-rays, MRI, CT reports...' },
      { key: 'diagnosis', label: 'Diagnosis & Plan', rows: 3, placeholder: 'Diagnosis and surgical/conservative plan...' },
    ]
  },
  'Progress Note': {
    id: 'progress_note',
    label: 'Progress Note',
    icon: '',
    sections: [
      { key: 'subjective', label: 'Subjective (Patient Update)', rows: 3, placeholder: 'Patient concerns, pain scores, subjective progress...' },
      { key: 'objective', label: 'Objective (Vitals & Exam)', rows: 3, placeholder: 'Temp, BP, HR, exam updates...' },
      { key: 'assessment', label: 'Assessment (Progress)', rows: 2, placeholder: 'Is patient improving or stable...' },
      { key: 'plan', label: 'Plan / Updates', rows: 3, placeholder: 'Continued orders or updates...' },
    ]
  }
};

/**
 * Get the best matching template for a doctor's specialization.
 * Falls back to Consult Note if no match.
 */
export function getTemplateForSpecialization(specialization) {
  if (!specialization) return NOTE_TEMPLATES['SOAP'];
  return NOTE_TEMPLATES[specialization] || NOTE_TEMPLATES['SOAP'];
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
