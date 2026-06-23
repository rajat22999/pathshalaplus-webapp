"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import PhoneInput, { type Country, type Value } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { getCountryCallingCode, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";

// Country is fixed to India and not user-changeable.
const COUNTRY: Country = "IN";

interface PhoneNumberInputProps {
  id?: string;
  label?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
}

/** Count the national (significant) digits in an E.164 value for a country. */
function countNationalDigits(value: string | undefined, callingCode: string): number {
  if (!value) return 0;
  const digits = value.replace(/\D/g, "");
  return digits.startsWith(callingCode)
    ? digits.length - callingCode.length
    : digits.length;
}

export function PhoneNumberInput({
  id,
  label,
  value,
  onChange,
  invalid = false,
  disabled,
  autoFocus,
  onBlur,
}: PhoneNumberInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Tracks whether focus was initiated by a pointer, so a click still places
  // the caret where the user clicked (we only auto-move it on keyboard focus).
  const pointerFocus = useRef(false);

  // Max national digits for India = length of its example mobile number (10).
  const maxNationalDigits = useMemo(() => {
    const example = getExampleNumber(
      COUNTRY,
      examples as Parameters<typeof getExampleNumber>[1],
    );
    return example ? example.nationalNumber.length : undefined;
  }, []);

  const getInput = useCallback(
    () =>
      containerRef.current?.querySelector<HTMLInputElement>(
        "input.PhoneInputInput",
      ) ?? null,
    [],
  );

  // Put the caret after the non-editable "+91" prefix. Deferred to a later tick
  // because the browser finalizes the autofocus caret AFTER React's focus event.
  const moveCaretToEnd = useCallback(() => {
    const el = getInput();
    if (!el) return;
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, [getInput]);

  // Focus + correct caret on mount when requested.
  useEffect(() => {
    if (!autoFocus) return;
    const el = getInput();
    if (!el) return;
    el.focus();
    const t = window.setTimeout(moveCaretToEnd, 0);
    return () => window.clearTimeout(t);
  }, [autoFocus, getInput, moveCaretToEnd]);

  function handleChange(next: Value | undefined) {
    if (next && maxNationalDigits) {
      const callingCode = getCountryCallingCode(COUNTRY);
      const nextLen = countNationalDigits(next, callingCode);
      const currLen = countNationalDigits(value, callingCode);
      // Backstop (covers paste): block when ADDING digits past the limit.
      if (nextLen > maxNationalDigits && nextLen > currLen) {
        return;
      }
    }
    onChange(next);
  }

  // Primary guard: stop the keystroke before an over-the-limit digit is shown.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!maxNationalDigits) return;
    const isDigit = e.key.length === 1 && e.key >= "0" && e.key <= "9";
    if (!isDigit || e.ctrlKey || e.metaKey || e.altKey) return;
    const input = e.currentTarget;
    const hasSelection = input.selectionStart !== input.selectionEnd;
    if (hasSelection) return; // typing replaces the selection — allow it
    const current = countNationalDigits(value, getCountryCallingCode(COUNTRY));
    if (current >= maxNationalDigits) {
      e.preventDefault();
    }
  }

  function handleFocus() {
    if (pointerFocus.current) {
      pointerFocus.current = false;
      return; // a click sets its own caret position — leave it
    }
    window.setTimeout(moveCaretToEnd, 0);
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div ref={containerRef} className={`psp-phone ${invalid ? "is-invalid" : ""}`}>
        <PhoneInput
          id={id}
          international
          // Lock the country to India: only one option, no globe/international
          // entry, and the selector is made non-interactive via CSS.
          defaultCountry={COUNTRY}
          countries={[COUNTRY]}
          addInternationalOption={false}
          countryCallingCodeEditable={false}
          flags={flags}
          value={value as Value | undefined}
          onChange={handleChange}
          disabled={disabled}
          placeholder="98765 43210"
          numberInputProps={{
            autoComplete: "tel",
            onBlur,
            onKeyDown: handleKeyDown,
            onMouseDown: () => {
              pointerFocus.current = true;
            },
            onFocus: handleFocus,
          }}
        />
      </div>
    </div>
  );
}
