"use client";

import { useState, useTransition } from "react";

import { saveTradeUrl } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TradeUrlForm({ initial }: { initial: string | null }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(formData) => {
        setMsg(null);
        startTransition(async () => {
          const res = await saveTradeUrl(formData);
          setMsg(
            res.ok
              ? { ok: true, text: "Trade link saved." }
              : { ok: false, text: res.error },
          );
        });
      }}
      className="space-y-2"
    >
      <Input
        name="tradeUrl"
        defaultValue={initial ?? ""}
        placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…"
        aria-label="Steam trade URL"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          Save trade link
        </Button>
        {msg && (
          <span className={msg.ok ? "text-xs text-positive" : "text-xs text-negative"}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
