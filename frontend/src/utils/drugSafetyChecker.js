// A curated list of common orthopedic and general medications, their categories, and typical single dose bounds.
export const DRUG_SAFETY_DB = {
  paracetamol: {
    patterns: [/\b(paracetamol|acetaminophen|crocin|dolo|calpol)\b/i],
    category: 'analgesic',
    displayName: 'Paracetamol',
    minDose: 100,
    maxDose: 1000,
    unit: 'mg',
    warnMessage: 'Typical single dose of Paracetamol ranges from 100mg to 1000mg. Exceeding 1000mg per dose or 4000mg daily increases severe hepatotoxicity risk.'
  },
  ibuprofen: {
    patterns: [/\b(ibuprofen|brufen|advil|motrin)\b/i],
    category: 'nsaid',
    displayName: 'Ibuprofen',
    minDose: 100,
    maxDose: 800,
    unit: 'mg',
    warnMessage: 'Typical single dose of Ibuprofen is 200mg to 800mg. Higher doses increase GI bleeding and renal risk.'
  },
  diclofenac: {
    patterns: [/\b(diclofenac|voveran|voltaren|reactin)\b/i],
    category: 'nsaid',
    displayName: 'Diclofenac',
    minDose: 12.5,
    maxDose: 100,
    unit: 'mg',
    warnMessage: 'Typical single dose of Diclofenac is 12.5mg to 100mg.'
  },
  naproxen: {
    patterns: [/\b(naproxen|naprosyn|aleve)\b/i],
    category: 'nsaid',
    displayName: 'Naproxen',
    minDose: 100,
    maxDose: 550,
    unit: 'mg',
    warnMessage: 'Typical single dose of Naproxen is 220mg to 550mg.'
  },
  tramadol: {
    patterns: [/\b(tramadol|ultram)\b/i],
    category: 'opioid',
    displayName: 'Tramadol',
    minDose: 25,
    maxDose: 100,
    unit: 'mg',
    warnMessage: 'Typical single dose of Tramadol is 25mg to 100mg. Higher doses increase seizure and respiratory depression risks.'
  },
  cyclobenzaprine: {
    patterns: [/\b(cyclobenzaprine|flexeril)\b/i],
    category: 'muscle_relaxant',
    displayName: 'Cyclobenzaprine',
    minDose: 2.5,
    maxDose: 10,
    unit: 'mg',
    warnMessage: 'Typical single dose of Cyclobenzaprine is 5mg to 10mg. High doses cause marked somnolence.'
  },
  baclofen: {
    patterns: [/\b(baclofen|lioresal)\b/i],
    category: 'muscle_relaxant',
    displayName: 'Baclofen',
    minDose: 5,
    maxDose: 25,
    unit: 'mg',
    warnMessage: 'Typical single dose of Baclofen is 5mg to 25mg.'
  },
  tizanidine: {
    patterns: [/\b(tizanidine|sirdalud)\b/i],
    category: 'muscle_relaxant',
    displayName: 'Tizanidine',
    minDose: 1,
    maxDose: 8,
    unit: 'mg',
    warnMessage: 'Typical single dose of Tizanidine is 2mg to 8mg. High risk of hypotension and drowsiness.'
  },
  gabapentin: {
    patterns: [/\b(gabapentin|neurontin|gabin)\b/i],
    category: 'gabapentinoid',
    displayName: 'Gabapentin',
    minDose: 50,
    maxDose: 800,
    unit: 'mg',
    warnMessage: 'Typical single dose of Gabapentin ranges from 100mg to 800mg.'
  },
  pregabalin: {
    patterns: [/\b(pregabalin|lyrica)\b/i],
    category: 'gabapentinoid',
    displayName: 'Pregabalin',
    minDose: 25,
    maxDose: 150,
    unit: 'mg',
    warnMessage: 'Typical single dose of Pregabalin ranges from 25mg to 150mg.'
  },
  pantoprazole: {
    patterns: [/\b(pantoprazole|pantocid|pan)\b/i],
    category: 'ppi',
    displayName: 'Pantoprazole',
    minDose: 10,
    maxDose: 40,
    unit: 'mg',
    warnMessage: 'Typical single dose of Pantoprazole is 20mg to 40mg.'
  },
  aspirin: {
    patterns: [/\b(aspirin|ecotrin|ecosprin)\b/i],
    category: 'anticoagulant',
    displayName: 'Aspirin',
    minDose: 75,
    maxDose: 325,
    unit: 'mg',
    warnMessage: 'Typical low-dose aspirin for antiplatelet effect is 75mg to 325mg.'
  },
  clopidogrel: {
    patterns: [/\b(clopidogrel|plavix|clopilet)\b/i],
    category: 'anticoagulant',
    displayName: 'Clopidogrel',
    minDose: 75,
    maxDose: 75,
    unit: 'mg',
    warnMessage: 'Typical daily maintenance dose of Clopidogrel is 75mg.'
  },
  diazepam: {
    patterns: [/\b(diazepam|valium|calmpose)\b/i],
    category: 'cns_depressant',
    displayName: 'Diazepam',
    minDose: 2,
    maxDose: 10,
    unit: 'mg',
    warnMessage: 'Typical single dose of Diazepam is 2mg to 10mg.'
  },
  alprazolam: {
    patterns: [/\b(alprazolam|xanax|alprax)\b/i],
    category: 'cns_depressant',
    displayName: 'Alprazolam',
    minDose: 0.25,
    maxDose: 1,
    unit: 'mg',
    warnMessage: 'Typical single dose of Alprazolam is 0.25mg to 1mg.'
  }
};

const DRUG_INTERACTIONS = [
  {
    drugs: ['nsaid', 'nsaid'],
    severity: 'moderate',
    message: 'Co-prescribing multiple NSAIDs (e.g. Ibuprofen, Diclofenac, Naproxen) increases risk of GI bleeding and renal impairment.'
  },
  {
    drugs: ['nsaid', 'anticoagulant'],
    severity: 'high',
    message: 'NSAIDs combined with anticoagulants/blood thinners significantly increases bleeding risk.'
  },
  {
    drugs: ['muscle_relaxant', 'cns_depressant'],
    severity: 'high',
    message: 'Combining muscle relaxants with other CNS depressants causes severe sedation.'
  },
  {
    drugs: ['opioid', 'muscle_relaxant'],
    severity: 'high',
    message: 'Opioids prescribed with muscle relaxants can lead to profound sedation and respiratory depression.'
  },
  {
    drugs: ['opioid', 'cns_depressant'],
    severity: 'high',
    message: 'Combining opioids with CNS depressants/benzodiazepines increases risk of severe respiratory depression.'
  },
  {
    drugs: ['tramadol', 'serotonergic'],
    severity: 'high',
    message: 'Tramadol combined with SSRIs/SNRIs (e.g. Duloxetine, Sertraline) increases the risk of Serotonin Syndrome.'
  }
];

/**
 * Classify a drug name into one of our known interactive drug categories.
 */
export function getDrugCategoryAndInfo(drugName) {
  if (!drugName) return null;
  const nameClean = drugName.toLowerCase().trim();
  for (const key in DRUG_SAFETY_DB) {
    const info = DRUG_SAFETY_DB[key];
    for (const pat of info.patterns) {
      if (pat.test(nameClean)) {
        return { key, ...info };
      }
    }
  }
  // Try custom categories fallback
  if (/\b(diclofenac|ibuprofen|naproxen|meloxicam|celecoxib|etoricoxib|indomethacin|ketorolac|piroxicam|aspirin)\b/i.test(nameClean)) {
    return { key: 'generic_nsaid', category: 'nsaid', displayName: drugName };
  }
  if (/\b(warfarin|clopidogrel|heparin|apixaban|rivaroxaban|dabigatran|enoxaparin|ecosprin)\b/i.test(nameClean)) {
    return { key: 'generic_anticoagulant', category: 'anticoagulant', displayName: drugName };
  }
  if (/\b(cyclobenzaprine|baclofen|carisoprodol|tizanidine|metaxalone|chlorzoxazone|methocarbamol)\b/i.test(nameClean)) {
    return { key: 'generic_muscle_relaxant', category: 'muscle_relaxant', displayName: drugName };
  }
  if (/\b(diazepam|alprazolam|lorazepam|clonazepam|midazolam|temazepam|triazolam)\b/i.test(nameClean)) {
    return { key: 'generic_cns_depressant', category: 'cns_depressant', displayName: drugName };
  }
  if (/\b(tramadol|codeine|morphine|oxycodone|hydrocodone|fentanyl|methadone)\b/i.test(nameClean)) {
    return { key: 'generic_opioid', category: 'opioid', displayName: drugName };
  }
  if (/\b(sertraline|fluoxetine|citalopram|escitalopram|paroxetine|duloxetine|venlafaxine|desvenlafaxine|amitriptyline|imipramine)\b/i.test(nameClean)) {
    return { key: 'generic_serotonergic', category: 'serotonergic', displayName: drugName };
  }
  return null;
}

/**
 * Check if the dosage falls outside the typical bounds for a drug.
 */
export function checkDosageSanity(drugName, doseString) {
  if (!drugName || !doseString) return null;
  const drugInfo = getDrugCategoryAndInfo(drugName);
  if (!drugInfo || !drugInfo.maxDose) return null; // No range rules for this drug

  // Match first number (integer or decimal)
  const numMatch = doseString.match(/(\d+(\.\d+)?)/);
  if (!numMatch) return null;

  const unitMatch = doseString.toLowerCase().match(/\b(mg|g|mcg|ml)\b/);
  if (unitMatch) {
    let value = parseFloat(numMatch[1]);
    const unit = unitMatch[1];
    if (unit === 'g') {
      value = value * 1000; // Convert to mg
    }
    if (value < drugInfo.minDose || value > drugInfo.maxDose) {
      return {
        isWarning: true,
        message: `Typical single dose of ${drugInfo.displayName} is ${drugInfo.minDose}${drugInfo.unit} to ${drugInfo.maxDose}${drugInfo.unit}. Prescribed: "${doseString}".`
      };
    }
  }
  return null;
}

/**
 * Check a prescription list for drug-drug interactions.
 */
export function checkDrugInteractions(prescriptions) {
  const warnings = [];
  if (!Array.isArray(prescriptions) || prescriptions.length < 2) return warnings;

  // Classify all drugs in the prescription
  const classifiedMeds = prescriptions
    .map((med, idx) => {
      const drugName = typeof med === 'object' ? med.drug : String(med);
      if (!drugName) return null;
      const info = getDrugCategoryAndInfo(drugName);
      if (!info) return null;
      return {
        index: idx,
        drugName: info.displayName || drugName,
        category: info.category,
      };
    })
    .filter(Boolean);

  // Check all pairs
  for (let i = 0; i < classifiedMeds.length; i++) {
    for (let j = i + 1; j < classifiedMeds.length; j++) {
      const medA = classifiedMeds[i];
      const medB = classifiedMeds[j];

      // Match against interaction patterns
      for (const rule of DRUG_INTERACTIONS) {
        const [cat1, cat2] = rule.drugs;
        const match1 = (medA.category === cat1 && medB.category === cat2) || (medA.category === cat2 && medB.category === cat1);
        const match2 = (cat1 === cat2 && medA.category === cat1 && medB.category === cat1);

        if (match1 || match2) {
          warnings.push({
            medAIndex: medA.index,
            medBIndex: medB.index,
            medAName: medA.drugName,
            medBName: medB.drugName,
            severity: rule.severity,
            message: `${rule.message} (Detected: ${medA.drugName} + ${medB.drugName})`,
          });
        }
      }
    }
  }
  return warnings;
}
