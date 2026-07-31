import { Badge } from "@/components/ui/badge";

type Tone = "neutral" | "signal" | "positive" | "negative";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  created: { label: "Created", tone: "neutral" },
  submitted: { label: "Submitted", tone: "signal" },
  processing: { label: "Processing", tone: "signal" },
  sent: { label: "Trade sent", tone: "signal" },
  finished: { label: "Delivered", tone: "positive" },
  failed: { label: "Failed", tone: "negative" },
  refunded: { label: "Refunded", tone: "negative" },
  rolled_back: { label: "Rolled back", tone: "negative" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
