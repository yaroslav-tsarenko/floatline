"use client";

import { useState, useTransition } from "react";
import { createTopUpSession } from "@/app/actions/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";

const PRESET_AMOUNTS = [10, 25, 50, 100];

export function TopUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(25);
  const [customVal, setCustomVal] = useState<string>("25");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomVal(val.toString());
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomVal(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
    setError(null);
  };

  const handleTopUp = () => {
    if (isNaN(amount) || amount < 5) {
      setError("Minimum top-up amount is $5.00");
      return;
    }
    if (amount > 2000) {
      setError("Maximum top-up amount is $2,000.00");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await createTopUpSession(amount, "USD");
        if (!res.ok) {
          setError(res.error);
          return;
        }
        window.location.href = res.redirectUrl;
      } catch (err: any) {
        setError(err.message || "Failed to initiate payment. Please try again.");
      }
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto"
      >
        Top up balance
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <Surface className="w-full max-w-md space-y-5 p-6 shadow-2xl border border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Add Funds to Wallet
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-muted hover:text-text p-1 text-sm rounded-md transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-muted">
          Instant deposit powered by Transfermit (Visa, MasterCard, 3DSecure, Open Banking).
        </p>

        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-muted">
            Select Amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => {
              const isSelected = amount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex h-11 items-center justify-center rounded-md border text-sm font-semibold transition-all ${
                    isSelected
                      ? "border-signal bg-signal/10 text-signal shadow-xs"
                      : "border-border bg-surface hover:bg-surface-2 text-text"
                  }`}
                >
                  ${preset}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <label className="mb-1 block text-xs font-medium text-muted">
              Custom Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <Input
                type="number"
                min="5"
                max="2000"
                step="1"
                value={customVal}
                onChange={handleCustomChange}
                placeholder="25.00"
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-negative/10 border border-negative/20 px-3 py-2 text-xs text-negative">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={isPending}
            onClick={handleTopUp}
          >
            Pay ${amount > 0 ? amount.toFixed(2) : "0.00"}
          </Button>
        </div>
      </Surface>
    </div>
  );
}
