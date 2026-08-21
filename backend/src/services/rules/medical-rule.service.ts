import medicalRules from "../../../rules_data/medical_rules.json";

export interface MedicalRuleData {
  disease_id: string;
  disease_name: string;
  severity: string;
  emergency_level: string;
  need_doctor: boolean;
  need_emergency: boolean;
  need_medical_warning: boolean;
  allow_product_recommendation: boolean;
  allow_chatbot_advice: boolean;
  allow_skincare_routine: boolean;
  allow_ingredient_recommendation: boolean;
  need_ai_disclaimer: boolean;
  recommended_ingredients: string[];
  forbidden_ingredients: string[];
  recommended_product_types: string[];
  forbidden_product_types: string[];
  morning_routine: string;
  night_routine: string;
  medical_warning: string;
  emergency_message: string;
  lifestyle_advice: string[];
  food_advice: string[];
  sun_protection_requirement: string;
  pregnancy_warning: string;
  children_warning: string;
}

export class MedicalRuleService {
  private rules: Map<string, MedicalRuleData> = new Map();

  constructor() {
    this.loadRules();
  }

  private loadRules(): void {
    (medicalRules as MedicalRuleData[]).forEach((rule) => {
      this.rules.set(rule.disease_id.toLowerCase(), rule);
      this.rules.set(rule.disease_name.toLowerCase(), rule);
    });
  }

  public getRuleForDisease(diseaseNameOrId: string): MedicalRuleData | null {
    if (!diseaseNameOrId) return null;
    const key = diseaseNameOrId.trim().toLowerCase();
    
    // Exact match or partial match
    if (this.rules.has(key)) {
      return this.rules.get(key)!;
    }

    for (const [ruleKey, rule] of this.rules.entries()) {
      if (key.includes(ruleKey) || ruleKey.includes(key)) {
        return rule;
      }
    }

    return null;
  }

  public isMalignantOrEmergency(diseaseNameOrId: string): boolean {
    const rule = this.getRuleForDisease(diseaseNameOrId);
    if (!rule) return false;
    return rule.severity === "EMERGENCY" || rule.emergency_level === "CRITICAL" || rule.emergency_level === "HIGH";
  }

  public canRecommendProducts(diseaseNameOrId: string): boolean {
    const rule = this.getRuleForDisease(diseaseNameOrId);
    return rule ? rule.allow_product_recommendation : false;
  }

  public canProvideChatbotAdvice(diseaseNameOrId: string): boolean {
    const rule = this.getRuleForDisease(diseaseNameOrId);
    return rule ? rule.allow_chatbot_advice : false;
  }
}

export const medicalRuleService = new MedicalRuleService();
