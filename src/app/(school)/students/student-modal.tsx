"use client";

import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { Toggle } from "@/components/ui/toggle";
import { isValidEmail } from "@/lib/format";
import { createStudent, updateStudent } from "@/lib/api/students";
import type {
  StudentCreatePayload,
  StudentRecord,
  StudentUpdatePayload,
} from "@/types/student";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

interface StudentModalProps {
  /** The student to edit/view, or null to add a new one. */
  student: StudentRecord | null;
  /** When true, all fields are read-only (viewers without manage rights). */
  readOnly?: boolean;
  onClose: () => void;
  onSaved: (student: StudentRecord, wasAdd: boolean) => void;
}

/** Normalize a possibly-null gender into one of the select's option values. */
function initialGender(value: string | null | undefined): string {
  const v = (value ?? "").toLowerCase();
  return v === "male" || v === "female" || v === "other" ? v : "";
}

export function StudentModal({
  student,
  readOnly = false,
  onClose,
  onSaved,
}: StudentModalProps) {
  const { t } = useTranslation();
  const isEdit = student !== null;
  const disabled = readOnly;

  const [name, setName] = useState(student?.name ?? "");
  const [admissionNumber, setAdmissionNumber] = useState(
    student?.admission_number ?? "",
  );
  const [rollNumber, setRollNumber] = useState(student?.roll_number ?? "");
  const [grade, setGrade] = useState(student?.grade ?? "");
  const [section, setSection] = useState(student?.section ?? "");
  const [gender, setGender] = useState(initialGender(student?.gender));
  const [dob, setDob] = useState(student?.date_of_birth ?? "");
  const [guardianName, setGuardianName] = useState(
    student?.guardian_name ?? "",
  );
  const [guardianPhone, setGuardianPhone] = useState<string | undefined>(
    student?.guardian_phone ?? undefined,
  );
  const [mobile, setMobile] = useState<string | undefined>(
    student?.mobile ?? undefined,
  );
  const [email, setEmail] = useState(student?.email ?? "");
  const [address, setAddress] = useState(student?.address ?? "");
  const [isActive, setIsActive] = useState(student?.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const mobileValid = !mobile || isValidPhoneNumber(mobile);
  const guardianPhoneValid = !guardianPhone || isValidPhoneNumber(guardianPhone);
  const emailValid = !trimmedEmail || isValidEmail(trimmedEmail);

  const canSubmit =
    trimmedName.length > 0 &&
    mobileValid &&
    guardianPhoneValid &&
    emailValid &&
    !saving;

  /** The optional fields, included only when they carry a value. */
  function optionalFields() {
    return {
      ...(mobile ? { mobile } : {}),
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
      ...(grade.trim() ? { grade: grade.trim() } : {}),
      ...(section.trim() ? { section: section.trim() } : {}),
      ...(rollNumber.trim() ? { roll_number: rollNumber.trim() } : {}),
      ...(admissionNumber.trim()
        ? { admission_number: admissionNumber.trim() }
        : {}),
      ...(dob ? { date_of_birth: dob } : {}),
      ...(gender ? { gender } : {}),
      ...(guardianName.trim() ? { guardian_name: guardianName.trim() } : {}),
      ...(guardianPhone ? { guardian_phone: guardianPhone } : {}),
      ...(address.trim() ? { address: address.trim() } : {}),
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    if (!trimmedName) {
      setError(t("student.form_name_required"));
      return;
    }
    if (!mobileValid) {
      setError(t("student.form_invalid_mobile"));
      return;
    }
    if (!guardianPhoneValid) {
      setError(t("student.form_invalid_guardian_phone"));
      return;
    }
    if (!emailValid) {
      setError(t("student.form_invalid_email"));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (isEdit && student) {
        const payload: StudentUpdatePayload = {
          name: trimmedName,
          is_active: isActive,
          ...optionalFields(),
        };
        const updated = await updateStudent(student.id, payload);
        onSaved(updated, false);
      } else {
        const payload: StudentCreatePayload = {
          name: trimmedName,
          ...optionalFields(),
        };
        const created = await createStudent(payload);
        onSaved(created, true);
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError(extractError(err, t("student.form_duplicate")));
      } else {
        setError(
          extractError(
            err,
            isEdit ? t("student.update_error") : t("student.create_error"),
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const title = readOnly
    ? t("student.form_view_title")
    : isEdit
      ? t("student.form_edit_title")
      : t("student.form_add_title");

  const textFieldClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("student.form_subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="student-name"
            label={t("student.form_name_label")}
            placeholder={t("student.form_name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled || saving}
            autoComplete="name"
            autoFocus={!readOnly}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="student-admission"
              label={t("student.form_admission_label")}
              placeholder={t("student.form_admission_placeholder")}
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              disabled={disabled || saving}
            />
            <Input
              id="student-roll"
              label={t("student.form_roll_label")}
              placeholder={t("student.form_roll_placeholder")}
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              disabled={disabled || saving}
            />
            <Input
              id="student-grade"
              label={t("student.form_grade_label")}
              placeholder={t("student.form_grade_placeholder")}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={disabled || saving}
            />
            <Input
              id="student-section"
              label={t("student.form_section_label")}
              placeholder={t("student.form_section_placeholder")}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={disabled || saving}
            />
            <div className="w-full">
              <label
                htmlFor="student-gender"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {t("student.form_gender_label")}
              </label>
              <select
                id="student-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={disabled || saving}
                className={textFieldClass}
              >
                <option value="">{t("student.form_gender_placeholder")}</option>
                <option value="male">{t("student.gender_male")}</option>
                <option value="female">{t("student.gender_female")}</option>
                <option value="other">{t("student.gender_other")}</option>
              </select>
            </div>
            <div className="w-full">
              <label
                htmlFor="student-dob"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {t("student.form_dob_label")}
              </label>
              <input
                id="student-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={disabled || saving}
                className={textFieldClass}
              />
            </div>
          </div>

          <Input
            id="student-guardian-name"
            label={t("student.form_guardian_name_label")}
            placeholder={t("student.form_guardian_name_placeholder")}
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            disabled={disabled || saving}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <PhoneNumberInput
              id="student-guardian-phone"
              label={t("student.form_guardian_phone_label")}
              value={guardianPhone}
              onChange={setGuardianPhone}
              disabled={disabled || saving}
              invalid={!guardianPhoneValid}
            />
            <PhoneNumberInput
              id="student-mobile"
              label={t("student.form_mobile_label")}
              value={mobile}
              onChange={setMobile}
              disabled={disabled || saving}
              invalid={!mobileValid}
            />
          </div>

          <Input
            id="student-email"
            type="email"
            label={t("student.form_email_label")}
            placeholder={t("student.form_email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled || saving}
            autoComplete="email"
          />

          <div className="w-full">
            <label
              htmlFor="student-address"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {t("student.form_address_label")}
            </label>
            <textarea
              id="student-address"
              rows={2}
              placeholder={t("student.form_address_placeholder")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={disabled || saving}
              className={`resize-none ${textFieldClass}`}
            />
          </div>

          {isEdit && !readOnly && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {t("student.form_active_label")}
                </p>
                <p className="text-xs text-slate-500">
                  {t("student.form_active_hint")}
                </p>
              </div>
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                disabled={saving}
                ariaLabel={t("student.form_active_label")}
              />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              {readOnly ? t("student.form_close") : t("student.form_cancel")}
            </Button>
            {!readOnly && (
              <Button type="submit" loading={saving} disabled={!canSubmit}>
                {saving
                  ? t("student.form_saving")
                  : isEdit
                    ? t("student.form_save")
                    : t("student.form_create")}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
