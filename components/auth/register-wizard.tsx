"use client";

import { useMemo, useState, useTransition } from "react";

import { signUp, type SignUpInput } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { COUNTRIES, DEFAULT_COUNTRY, dialForCountry } from "@/lib/countries";

type Fields = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  country: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const EMPTY: Fields = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  country: DEFAULT_COUNTRY,
  postalCode: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

const STEP_TITLES = [
  "Personal info",
  "Contact details",
  "Address",
  "Password",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ageFrom(dob: string): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

type Strength = { score: number; label: "Weak" | "Fair" | "Good" | "Strong" };

function passwordStrength(pw: string): Strength {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return { score: Math.min(score, 4), label };
}

const STRENGTH_COLOR: Record<Strength["label"], string> = {
  Weak: "bg-negative",
  Fair: "bg-signal",
  Good: "bg-signal",
  Strong: "bg-positive",
};

/** Validates one step; returns an error message or null. */
function validateStep(step: number, f: Fields): string | null {
  if (step === 0) {
    if (!f.firstName.trim()) return "Enter your first name.";
    if (!f.lastName.trim()) return "Enter your last name.";
    if (!f.dateOfBirth) return "Enter your date of birth.";
    const age = ageFrom(f.dateOfBirth);
    if (Number.isNaN(age)) return "Enter a valid date of birth.";
    if (age < 18) return "You must be at least 18 years old to register.";
    return null;
  }
  if (step === 1) {
    if (!EMAIL_RE.test(f.email.trim())) return "Enter a valid email address.";
    if (f.phone.trim().length < 3) return "Enter your phone number.";
    return null;
  }
  if (step === 2) {
    if (!f.streetAddress.trim()) return "Enter your street address.";
    if (!f.city.trim()) return "Enter your city.";
    if (!f.country) return "Select your country.";
    if (!f.postalCode.trim()) return "Enter your postal code.";
    return null;
  }
  if (!f.password || f.password.length < 6)
    return "Password must be at least 6 characters.";
  if (f.password !== f.confirmPassword) return "Passwords don’t match.";
  if (!f.terms) return "You must accept the Terms and Privacy Policy.";
  return null;
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs text-muted">
        {label} <span className="text-negative">*</span>
      </label>
      {children}
    </div>
  );
}

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:border-signal";

export function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Fields>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const dial = useMemo(() => dialForCountry(f.country), [f.country]);
  const strength = useMemo(() => passwordStrength(f.password), [f.password]);

  const next = () => {
    const err = validateStep(step, f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = () => {
    const err = validateStep(3, f);
    if (err) {
      setError(err);
      return;
    }
    const payload: SignUpInput = {
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      dateOfBirth: f.dateOfBirth,
      email: f.email.trim(),
      phone: `${dial} ${f.phone.trim()}`,
      streetAddress: f.streetAddress.trim(),
      city: f.city.trim(),
      country: f.country,
      postalCode: f.postalCode.trim(),
      password: f.password,
      confirmPassword: f.confirmPassword,
      terms: f.terms,
    };
    startTransition(async () => {
      const result = await signUp(payload);
      // On success signUp redirects; only an error returns here.
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-5">
      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEP_TITLES.map((title, i) => (
          <div key={title} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-signal" : "bg-border",
              )}
            />
            <p
              className={cn(
                "mt-1.5 hidden text-[11px] sm:block",
                i === step ? "text-text" : "text-muted",
              )}
            >
              {i + 1}. {title}
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-text sm:hidden">
        Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
      </p>

      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                autoComplete="given-name"
                value={f.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Alex"
              />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input
                id="lastName"
                autoComplete="family-name"
                value={f.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Doe"
              />
            </Field>
          </div>
          <Field label="Date of birth" htmlFor="dateOfBirth">
            <Input
              id="dateOfBirth"
              type="date"
              autoComplete="bday"
              max={new Date().toISOString().slice(0, 10)}
              value={f.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <div className="flex items-center gap-2">
              <span className="num grid h-10 shrink-0 place-items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-muted">
                {dial}
              </span>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="7123 456789"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Country code follows the country you pick in the next step.
            </p>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Field label="Street address" htmlFor="streetAddress">
            <Input
              id="streetAddress"
              autoComplete="address-line1"
              value={f.streetAddress}
              onChange={(e) => set("streetAddress", e.target.value)}
              placeholder="221B Baker Street"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" htmlFor="city">
              <Input
                id="city"
                autoComplete="address-level2"
                value={f.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="London"
              />
            </Field>
            <Field label="Postal code" htmlFor="postalCode">
              <Input
                id="postalCode"
                autoComplete="postal-code"
                value={f.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                placeholder="NW1 6XE"
              />
            </Field>
          </div>
          <Field label="Country" htmlFor="country">
            <select
              id="country"
              autoComplete="country"
              className={selectClass}
              value={f.country}
              onChange={(e) => set("country", e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="At least 6 characters"
            />
            {f.password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-full transition-colors",
                        i < strength.score
                          ? STRENGTH_COLOR[strength.label]
                          : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <span className="w-12 shrink-0 text-right text-[11px] text-muted">
                  {strength.label}
                </span>
              </div>
            )}
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={f.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
            />
          </Field>
          <label className="flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={f.terms}
              onChange={(e) => set("terms", e.target.checked)}
              className="mt-0.5 size-4 accent-signal"
            />
            <span>
              I agree to the{" "}
              <a href="/terms" className="text-signal hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-signal hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={pending}
            className="flex-1"
          >
            Back
          </Button>
        )}
        {step < STEP_TITLES.length - 1 ? (
          <Button type="button" onClick={next} className="flex-1">
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            loading={pending}
            className="flex-1"
          >
            Create account
          </Button>
        )}
      </div>
    </div>
  );
}
