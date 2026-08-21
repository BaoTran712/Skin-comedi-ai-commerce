import ingredientRules from "../../../rules_data/ingredient_rules.json";
import ingredientConflicts from "../../../rules_data/ingredient_conflicts.json";

export interface IngredientRuleData {
  ingredient_name: string;
  description: string;
  benefits: string[];
  recommended_diseases: string[];
  forbidden_diseases: string[];
  compatible_ingredients: string[];
  incompatible_ingredients: string[];
  pregnancy_safe: boolean;
  children_safe: boolean;
  morning_use: boolean;
  night_use: boolean;
  need_sunscreen: boolean;
  irritation_risk: string;
}

export interface IngredientConflictData {
  ingredient_a: string;
  ingredient_b: string;
  conflict_severity: string;
  reason: string;
  recommendation: string;
}

export class IngredientRuleService {
  private ingredientsMap: Map<string, IngredientRuleData> = new Map();
  private conflicts: IngredientConflictData[] = [];

  constructor() {
    this.loadRules();
  }

  private loadRules(): void {
    (ingredientRules as IngredientRuleData[]).forEach((ing) => {
      this.ingredientsMap.set(ing.ingredient_name.toLowerCase(), ing);
    });
    this.conflicts = ingredientConflicts as IngredientConflictData[];
  }

  public getIngredientRule(name: string): IngredientRuleData | null {
    return this.ingredientsMap.get(name.trim().toLowerCase()) || null;
  }

  public isIngredientForbiddenForDisease(ingredientName: string, diseaseName: string): boolean {
    const ing = this.getIngredientRule(ingredientName);
    if (!ing) return false;
    return ing.forbidden_diseases.some((d) => d.toLowerCase().includes(diseaseName.toLowerCase()));
  }

  public checkRoutineConflicts(ingredients: string[]): IngredientConflictData[] {
    const detectedConflicts: IngredientConflictData[] = [];
    const lowerIngs = ingredients.map((i) => i.trim().toLowerCase());

    for (const conflict of this.conflicts) {
      const a = conflict.ingredient_a.toLowerCase();
      const b = conflict.ingredient_b.toLowerCase();

      if (lowerIngs.some((i) => i.includes(a)) && lowerIngs.some((i) => i.includes(b))) {
        detectedConflicts.push(conflict);
      }
    }

    return detectedConflicts;
  }
}

export const ingredientRuleService = new IngredientRuleService();
