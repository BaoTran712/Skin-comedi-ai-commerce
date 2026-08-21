import warningRules from "../../../rules_data/warning_rules.json";

export interface WarningRuleData {
  disease_id: string;
  warning_code: string;
  warning_title: string;
  warning_message: string;
  action_required: string;
  is_blocking: boolean;
}

export class WarningService {
  private warningMap: Map<string, WarningRuleData> = new Map();

  constructor() {
    this.loadWarnings();
  }

  private loadWarnings(): void {
    (warningRules as WarningRuleData[]).forEach((w) => {
      this.warningMap.set(w.disease_id.toLowerCase(), w);
    });
  }

  public getWarningForDisease(diseaseIdOrName: string): WarningRuleData | null {
    if (!diseaseIdOrName) return null;
    const key = diseaseIdOrName.trim().toLowerCase();

    for (const [dKey, warning] of this.warningMap.entries()) {
      if (key.includes(dKey) || dKey.includes(key)) {
        return warning;
      }
    }

    return null;
  }

  public getStandardAIDisclaimer(): string {
    return "💡 LƯU Ý Y TẾ CHUNG: Kết quả nhận diện AI chỉ mang tính chất tham khảo sơ bộ, KHÔNG CÓ GIÁ TRỊ THAY THẾ Chẩn đoán hay Đơn thuốc trực tiếp từ Bác sĩ Da liễu. Bạn nên thăm khám chuyên khoa khi có dấu hiệu bất thường.";
  }
}

export const warningService = new WarningService();
