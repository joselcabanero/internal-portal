import { compactUsd, inWorkspace, type WorkspaceSummary } from "@/lib/workspace";

/**
 * The one quiet line a home card shows in the ecosystem edition: the active workspace's combined
 * (distinct) totals that matter to that app, and which workspace they count. Null: the card shows nothing extra.
 *
 *   Jarvis 2        "4,120 organisations in Agriculture & AgTech + Food Production"
 *   Scout           "1,830 startups, 96 corporate investors in …"
 *   DataLab         "$12.4B funding across 2,310 rounds in …"
 *
 * `label` is `workspaceLabel(…)`; "" (all markets) reads "in all markets".
 */
export function homeCardFigure(appId: string, summary: WorkspaceSummary, label: string): string | null {
  const where = label || "all markets";
  const c = summary.counts;
  switch (appId) {
    case "jarvis":
      return inWorkspace(c.organizations, "organisation", "organisations", where);
    case "scout": {
      if (c.corporateInvestors == null) return inWorkspace(c.startups, "startup", "startups", where);
      const startups = `${c.startups.toLocaleString("en-GB")} ${c.startups === 1 ? "startup" : "startups"}`;
      return `${startups}, ${inWorkspace(c.corporateInvestors, "corporate investor", "corporate investors", where)}`;
    }
    case "navigator":
      return `${compactUsd(c.fundingUsd)} funding across ${inWorkspace(c.rounds, "round", "rounds", where)}`;
    default:
      return null;
  }
}
