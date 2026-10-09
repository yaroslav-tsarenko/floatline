"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Surface } from "@/components/ui/surface";

export default function CheckoutReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const pmt = searchParams.get("pmt");

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ref && !pmt) {
      setStatus("failed");
      setErrorMessage("No payment reference found in URL.");
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 15;

    const verify = async () => {
      try {
        const query = new URLSearchParams();
        if (pmt) query.set("pmt", pmt);
        if (ref) query.set("ref", ref);

        const res = await fetch(`/api/wallet/topup/verify?${query.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.ok && data.status === "paid") {
          setStatus("success");
          if (data.orderId) {
            router.replace(`/orders/${data.orderId}`);
          } else {
            router.replace("/account?status=return");
          }
          return;
        }

        if (data.status === "failed") {
          setStatus("failed");
          setErrorMessage("Payment was declined or cancelled.");
          return;
        }

        // Still pending/processing, retry up to maxAttempts
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(verify, 1500);
        } else {
          // Timeout: redirect to account where banner is shown
          router.replace("/account?status=return");
        }
      } catch (err: any) {
        if (!isMounted) return;
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(verify, 2000);
        } else {
          setStatus("failed");
          setErrorMessage("Could not confirm payment status. Check your account wallet.");
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [ref, pmt, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Surface className="space-y-6 p-8 text-center border border-border shadow-xl">
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="mx-auto size-12 animate-spin rounded-full border-3 border-signal border-r-transparent" />
            <h1 className="font-display text-xl font-semibold">
              Confirming your payment
            </h1>
            <p className="text-sm text-muted">
              We're verifying your transaction and setting up delivery. This takes only a few seconds...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-positive/10 text-positive">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-semibold text-positive">
              Payment Confirmed!
            </h1>
            <p className="text-sm text-muted">Redirecting to your order...</p>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-5">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-negative/10 text-negative">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-semibold">
              Payment Incomplete
            </h1>
            <p className="text-sm text-muted">
              {errorMessage || "The payment could not be completed."}
            </p>
            <div className="pt-2">
              <Link
                href="/catalog"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-signal px-4 text-sm font-medium text-white hover:brightness-110"
              >
                Back to Catalog
              </Link>
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}
