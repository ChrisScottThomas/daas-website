// src/utils/plans.ts
export const plans: Record<string, {
  name: string;
  description: string;
}> = {
  "clarity_base_monthly": {
    name: "Clarity. Base — Monthly",
    description: "Strategic clarity for a single product or priority. Move forward with confidence.",
  },
  "clarity_plus_quarterly": {
    name: "Clarity. Plus — Quarterly",
    description: "Cross-team clarity and joined-up strategy. Ideal for multi-team leadership.",
  },
  "clarity_partner_annually": {
    name: "Clarity. Partner — Annually",
    description: "Executive-level thinking partner. For high-stakes, high-ambiguity portfolios.",
  }
};
