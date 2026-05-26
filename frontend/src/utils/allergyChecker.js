/**
 * Allergy Checker — cross-references a prescribed drug against
 * a patient's known allergies using the drug-class mapping.
 *
 * Usage:
 *   const warning = checkDrugAllergy('Amoxicillin', ['Penicillin', 'Sulfa']);
 *   // → { isWarning: true, message: 'Patient is allergic to Penicillin (Penicillin class)' }
 */

import { DRUG_ALLERGY_MAP } from '../data/drugAllergyMap.js';

/**
 * Check if a drug name triggers any known patient allergy.
 *
 * @param {string} drugName - The drug name from the prescription.
 * @param {string[]} patientAllergies - Array of allergy strings from patient profile.
 * @returns {{ isWarning: boolean, message: string, allergen: string } | null}
 */
export function checkDrugAllergy(drugName, patientAllergies) {
  if (!drugName || !patientAllergies || patientAllergies.length === 0) return null;

  const drugLower = drugName.toLowerCase().trim();
  if (drugLower.length < 2) return null;

  // Normalize allergies to lowercase
  const allergiesLower = patientAllergies.map((a) => a.toLowerCase().trim());

  // Step 1: Direct name match — patient allergy directly matches drug name
  for (const allergy of allergiesLower) {
    if (drugLower.includes(allergy) || allergy.includes(drugLower)) {
      return {
        isWarning: true,
        message: `Patient is allergic to ${allergy}`,
        allergen: allergy,
      };
    }
  }

  // Step 2: Class-based match — drug belongs to a class the patient is allergic to
  for (const entry of DRUG_ALLERGY_MAP) {
    if (!entry.pattern.test(drugLower)) continue;

    // Check if the allergen class matches any patient allergy
    if (allergiesLower.some((a) => a.includes(entry.allergen) || entry.allergen.includes(a))) {
      return {
        isWarning: true,
        message: `Patient is allergic to ${entry.className} class`,
        allergen: entry.allergen,
      };
    }

    // Check cross-reactivity (e.g., Cephalosporin ↔ Penicillin)
    if (entry.crossReacts) {
      for (const crossAllergen of entry.crossReacts) {
        if (allergiesLower.some((a) => a.includes(crossAllergen) || crossAllergen.includes(a))) {
          return {
            isWarning: true,
            message: `Potential cross-reactivity: Patient allergic to ${crossAllergen}, prescribing ${entry.className}`,
            allergen: crossAllergen,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check all medications in a prescription array against patient allergies.
 * Returns a map of { [index]: warningObject }.
 */
export function checkAllPrescriptionAllergies(prescriptionArray, patientAllergies) {
  const warnings = {};
  if (!Array.isArray(prescriptionArray) || !patientAllergies?.length) return warnings;

  prescriptionArray.forEach((med, idx) => {
    const drugName = typeof med === 'object' ? med.drug : String(med);
    const warning = checkDrugAllergy(drugName, patientAllergies);
    if (warning) {
      warnings[idx] = warning;
    }
  });

  return warnings;
}
