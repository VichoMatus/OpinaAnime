import type { CSSProperties } from "react";

export type Tier = "S" | "A" | "B" | "C" | "D" | "E";

export interface TierConfig {
  name: Tier;
  subtitle: string;
  badgeClass: string;
  badgeStyle: CSSProperties;
}

export const TIER_CONFIGS: TierConfig[] = [
  {
    name: "S",
    subtitle: "Obra maestra",
    badgeClass: "bg-tier-s text-tier-fg border-tier-s",
    badgeStyle: { backgroundColor: "var(--tier-s)", color: "var(--tier-fg)" },
  },
  {
    name: "A",
    subtitle: "Excelente",
    badgeClass: "bg-tier-a text-tier-fg border-tier-a",
    badgeStyle: { backgroundColor: "var(--tier-a)", color: "var(--tier-fg)" },
  },
  {
    name: "B",
    subtitle: "Muy bueno",
    badgeClass: "bg-tier-b text-tier-fg border-tier-b",
    badgeStyle: { backgroundColor: "var(--tier-b)", color: "var(--tier-fg)" },
  },
  {
    name: "C",
    subtitle: "Entretenido",
    badgeClass: "bg-tier-c text-tier-fg border-tier-c",
    badgeStyle: { backgroundColor: "var(--tier-c)", color: "var(--tier-fg)" },
  },
  {
    name: "D",
    subtitle: "Regular",
    badgeClass: "bg-tier-d text-tier-fg border-tier-d",
    badgeStyle: { backgroundColor: "var(--tier-d)", color: "var(--tier-fg)" },
  },
  {
    name: "E",
    subtitle: "Flojo",
    badgeClass: "bg-tier-e text-tier-fg border-tier-e",
    badgeStyle: { backgroundColor: "var(--tier-e)", color: "var(--tier-fg)" },
  },
];

export function getTierBadgeClass(tier: string | null | undefined): string {
  switch (tier) {
    case "S":
      return "bg-tier-s text-tier-fg border-tier-s";
    case "A":
      return "bg-tier-a text-tier-fg border-tier-a";
    case "B":
      return "bg-tier-b text-tier-fg border-tier-b";
    case "C":
      return "bg-tier-c text-tier-fg border-tier-c";
    case "D":
      return "bg-tier-d text-tier-fg border-tier-d";
    case "E":
      return "bg-tier-e text-tier-fg border-tier-e";
    default:
      return "bg-surface-subtle text-fg-muted border-border-strong";
  }
}

export function getTierBadgeStyle(tier: string | null | undefined): CSSProperties | undefined {
  switch (tier) {
    case "S":
      return { backgroundColor: "var(--tier-s)", color: "var(--tier-fg)", borderColor: "var(--tier-s)" };
    case "A":
      return { backgroundColor: "var(--tier-a)", color: "var(--tier-fg)", borderColor: "var(--tier-a)" };
    case "B":
      return { backgroundColor: "var(--tier-b)", color: "var(--tier-fg)", borderColor: "var(--tier-b)" };
    case "C":
      return { backgroundColor: "var(--tier-c)", color: "var(--tier-fg)", borderColor: "var(--tier-c)" };
    case "D":
      return { backgroundColor: "var(--tier-d)", color: "var(--tier-fg)", borderColor: "var(--tier-d)" };
    case "E":
      return { backgroundColor: "var(--tier-e)", color: "var(--tier-fg)", borderColor: "var(--tier-e)" };
    default:
      return undefined;
  }
}
