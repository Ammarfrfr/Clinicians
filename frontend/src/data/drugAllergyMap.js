/**
 * Drug-to-Allergen Class Mapping for Indian medications.
 *
 * Each entry maps a regex pattern (matching common drug names from
 * the CDSCO database) to the allergen class that could trigger
 * an allergic reaction.
 *
 * Used by allergyChecker.js to cross-reference prescriptions
 * against a patient's known allergies.
 */

export const DRUG_ALLERGY_MAP = [
  // Penicillins
  {
    pattern: /amoxicillin|augmentin|ampicillin|piperacillin|mox\b|cloxacillin|penicillin|flucloxacillin/i,
    allergen: 'penicillin',
    className: 'Penicillin',
  },
  // Cephalosporins (cross-reactivity with Penicillin ~1-2%)
  {
    pattern: /cefixime|cephalexin|cefuroxime|ceftriaxone|cefpodoxime|cefadroxil|cefoperazone|taxim/i,
    allergen: 'cephalosporin',
    crossReacts: ['penicillin'],
    className: 'Cephalosporin',
  },
  // Sulfonamides
  {
    pattern: /sulfasalazine|cotrimoxazole|sulfa|sulfadiazine|sulfamethoxazole|bactrim|septran/i,
    allergen: 'sulfa',
    className: 'Sulfonamide',
  },
  // NSAIDs
  {
    pattern: /ibuprofen|diclofenac|naproxen|piroxicam|mefenamic|aceclofenac|etoricoxib|nimesulide|brufen|voveran|combiflam|zerodol|nucoxia|meftal/i,
    allergen: 'nsaid',
    className: 'NSAID',
  },
  // Aspirin
  {
    pattern: /aspirin|ecosprin|acetylsalicylic/i,
    allergen: 'aspirin',
    crossReacts: ['nsaid'],
    className: 'Aspirin',
  },
  // Fluoroquinolones
  {
    pattern: /ciprofloxacin|ofloxacin|levofloxacin|norfloxacin|moxifloxacin|ciplox|zenflox|levoflox/i,
    allergen: 'fluoroquinolone',
    className: 'Fluoroquinolone',
  },
  // Macrolides
  {
    pattern: /azithromycin|erythromycin|clarithromycin|azithral/i,
    allergen: 'macrolide',
    className: 'Macrolide',
  },
  // Tetracyclines
  {
    pattern: /doxycycline|tetracycline|minocycline|doxt/i,
    allergen: 'tetracycline',
    className: 'Tetracycline',
  },
  // Metronidazole
  {
    pattern: /metronidazole|tinidazole|flagyl|norflox-tz/i,
    allergen: 'metronidazole',
    className: 'Nitroimidazole',
  },
  // ACE inhibitors
  {
    pattern: /enalapril|ramipril|lisinopril|captopril|envas|cardace/i,
    allergen: 'ace inhibitor',
    className: 'ACE Inhibitor',
  },
  // Statins
  {
    pattern: /atorvastatin|rosuvastatin|simvastatin|atorva|rozavel/i,
    allergen: 'statin',
    className: 'Statin',
  },
  // Opioids
  {
    pattern: /tramadol|codeine|morphine|fentanyl|ultracet/i,
    allergen: 'opioid',
    className: 'Opioid',
  },
  // Local anesthetics
  {
    pattern: /lidocaine|lignocaine|bupivacaine/i,
    allergen: 'local anesthetic',
    className: 'Local Anesthetic',
  },
  // Contrast dye (iodine-based)
  {
    pattern: /iodine|contrast|iopamidol|iohexol/i,
    allergen: 'iodine',
    className: 'Iodine / Contrast',
  },
];
