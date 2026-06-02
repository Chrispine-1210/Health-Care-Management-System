import { logger } from './logger';

export type InteractionSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface MedicationInput {
  productId?: string;
  name: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
}

export interface PatientSafetyContext {
  allergies?: string[];
  conditions?: string[];
  currentMedications?: MedicationInput[];
}

export interface ClinicalAlert {
  type: 'drug-drug' | 'contraindication' | 'allergy';
  severity: InteractionSeverity;
  medications: string[];
  explanation: string;
  suggestedAlternatives?: string[];
  requiresOverride: boolean;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const drugInteractionRules = [
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 'critical' as InteractionSeverity,
    explanation: 'Combined anticoagulant and antiplatelet therapy may significantly increase bleeding risk.',
    suggestedAlternatives: ['paracetamol/acetaminophen for pain where clinically appropriate'],
  },
  {
    drugs: ['warfarin', 'ibuprofen'],
    severity: 'critical' as InteractionSeverity,
    explanation: 'NSAIDs can increase gastrointestinal bleeding risk when combined with warfarin.',
    suggestedAlternatives: ['paracetamol/acetaminophen where clinically appropriate'],
  },
  {
    drugs: ['metformin', 'contrast'],
    severity: 'high' as InteractionSeverity,
    explanation: 'Iodinated contrast can increase risk of metformin-associated lactic acidosis in renal impairment.',
  },
  {
    drugs: ['simvastatin', 'clarithromycin'],
    severity: 'high' as InteractionSeverity,
    explanation: 'Clarithromycin can increase simvastatin exposure and risk of myopathy/rhabdomyolysis.',
    suggestedAlternatives: ['azithromycin where clinically appropriate', 'temporary statin hold with prescriber approval'],
  },
  {
    drugs: ['lisinopril', 'spironolactone'],
    severity: 'moderate' as InteractionSeverity,
    explanation: 'ACE inhibitors with potassium-sparing diuretics can increase hyperkalemia risk.',
  },
];

const contraindicationRules = [
  {
    medication: 'ibuprofen',
    condition: 'peptic ulcer',
    severity: 'high' as InteractionSeverity,
    explanation: 'NSAIDs may worsen active or historical peptic ulcer disease and increase bleeding risk.',
  },
  {
    medication: 'pseudoephedrine',
    condition: 'hypertension',
    severity: 'moderate' as InteractionSeverity,
    explanation: 'Sympathomimetics may elevate blood pressure in patients with hypertension.',
  },
  {
    medication: 'metformin',
    condition: 'renal failure',
    severity: 'critical' as InteractionSeverity,
    explanation: 'Metformin is contraindicated in severe renal impairment because of lactic acidosis risk.',
  },
];

export class ClinicalDecisionSupportService {
  evaluatePrescription(medications: MedicationInput[], context: PatientSafetyContext = {}): ClinicalAlert[] {
    const allMedications = [...(context.currentMedications || []), ...medications];
    const medicationNames = allMedications.map((medication) => normalize(`${medication.genericName || ''} ${medication.name}`));
    const alerts: ClinicalAlert[] = [];

    for (const rule of drugInteractionRules) {
      const matches = rule.drugs.filter((drug) => medicationNames.some((name) => name.includes(drug)));
      if (matches.length === rule.drugs.length) {
        alerts.push({
          type: 'drug-drug',
          severity: rule.severity,
          medications: rule.drugs,
          explanation: rule.explanation,
          suggestedAlternatives: rule.suggestedAlternatives,
          requiresOverride: ['high', 'critical'].includes(rule.severity),
        });
      }
    }

    for (const allergy of context.allergies || []) {
      const normalizedAllergy = normalize(allergy);
      const matchingMedication = allMedications.find((medication) => normalize(`${medication.genericName || ''} ${medication.name}`).includes(normalizedAllergy));
      if (matchingMedication) {
        alerts.push({
          type: 'allergy',
          severity: 'critical',
          medications: [matchingMedication.name],
          explanation: `Patient allergy conflict detected for ${allergy}. Do not dispense without pharmacist review.`,
          suggestedAlternatives: ['Select a medication outside the documented allergy class'],
          requiresOverride: true,
        });
      }
    }

    for (const rule of contraindicationRules) {
      const hasMedication = medicationNames.some((name) => name.includes(rule.medication));
      const hasCondition = (context.conditions || []).some((condition) => normalize(condition).includes(rule.condition));
      if (hasMedication && hasCondition) {
        alerts.push({
          type: 'contraindication',
          severity: rule.severity,
          medications: [rule.medication],
          explanation: rule.explanation,
          requiresOverride: ['high', 'critical'].includes(rule.severity),
        });
      }
    }

    if (alerts.length > 0) {
      logger.warn('Clinical safety alerts generated', { count: alerts.length, severities: alerts.map((alert) => alert.severity) });
    }

    return alerts;
  }
}

export const clinicalDecisionSupportService = new ClinicalDecisionSupportService();
