"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { listStudents } from "@/lib/api/students";
import { canManageStudents, canViewStudents } from "@/lib/roles";
import type { ListStudentsParams, StudentRecord } from "@/types/student";
import { ActiveBadge } from "@/app/superadmin/badges";
import { StudentModal } from "@/app/(school)/students/student-modal";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "inactive";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** Format "grade - section" for the Class column, tolerating missing parts. */
function formatClass(student: StudentRecord): string {
  const parts = [student.grade, student.section].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  return parts.length > 0 ? parts.join(" - ") : "—";
}

export default function StudentsPage() {
  const { user, status } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const manage = canManageStudents(user?.role);
  const view = canViewStudents(user?.role);

  const [query, setQuery] = useState("");
  const [gradeInput, setGradeInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debouncedGrade, setDebouncedGrade] = useState("");
  const [debouncedSection, setDebouncedSection] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<StudentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state: null = closed; { student: null } = add; { student } = edit/view.
  const [modal, setModal] = useState<{ student: StudentRecord | null } | null>(
    null,
  );

  // ----- access guards -----
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (
      status === "authenticated" &&
      user &&
      !user.onboarding_completed
    ) {
      router.replace("/onboarding");
    } else if (status === "authenticated" && user && !view) {
      router.replace("/dashboard");
    }
  }, [status, user, view, router]);

  // ----- debounce the search + filter inputs (setState runs in a timer) -----
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setDebouncedGrade(gradeInput.trim());
      setDebouncedSection(sectionInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, gradeInput, sectionInput]);

  const fetchStudents = useCallback(async () => {
    if (status !== "authenticated" || !view) return;
    setLoading(true);
    setError(null);
    try {
      const params: ListStudentsParams = {
        page,
        page_size: PAGE_SIZE,
        status: statusFilter,
        ...(debouncedQuery ? { q: debouncedQuery } : {}),
        ...(debouncedGrade ? { grade: debouncedGrade } : {}),
        ...(debouncedSection ? { section: debouncedSection } : {}),
      };
      const res = await listStudents(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractError(err, t("student.load_error")));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    status,
    view,
    page,
    statusFilter,
    debouncedQuery,
    debouncedGrade,
    debouncedSection,
    t,
  ]);

  useEffect(() => {
    // fetchStudents flips `loading` before its first await; that synchronous
    // setState inside the effect is intentional (loading the list on mount and
    // whenever the page/filters change), mirroring the users page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStudents();
  }, [fetchStudents]);

  // auto-dismiss the success toast (setState runs in a timer, not inline)
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleRowClick(student: StudentRecord) {
    setModal({ student });
  }

  function handleSaved(saved: StudentRecord, wasAdd: boolean) {
    setModal(null);
    setToast(wasAdd ? t("student.create_success") : t("student.update_success"));
    if (wasAdd) {
      void fetchStudents();
    } else {
      // Patch the row in place so the roster reflects the edit immediately.
      setItems((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    }
  }

  // Block render until guards have resolved.
  if (
    status !== "authenticated" ||
    !user ||
    !user.onboarding_completed ||
    !view
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("student.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("student.subtitle")}
            </p>
          </div>
          {manage && (
            <div className="w-auto">
              <Button
                type="button"
                onClick={() => setModal({ student: null })}
                className="w-auto px-5"
              >
                {t("student.add")}
              </Button>
            </div>
          )}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            id="students-search"
            type="search"
            placeholder={t("student.search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("student.search_placeholder")}
          />
          <Input
            id="students-grade"
            placeholder={t("student.filter_grade")}
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            aria-label={t("student.filter_grade")}
          />
          <Input
            id="students-section"
            placeholder={t("student.filter_section")}
            value={sectionInput}
            onChange={(e) => setSectionInput(e.target.value)}
            aria-label={t("student.filter_section")}
          />
          <select
            id="students-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label={t("student.filter_status")}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="all">{t("student.status_all")}</option>
            <option value="active">{t("student.status_active")}</option>
            <option value="inactive">{t("student.status_inactive")}</option>
          </select>
        </div>

        {toast && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("student.col_name")}</th>
                  <th className="px-4 py-3">{t("student.col_admission")}</th>
                  <th className="px-4 py-3">{t("student.col_class")}</th>
                  <th className="px-4 py-3">{t("student.col_roll")}</th>
                  <th className="px-4 py-3">{t("student.col_guardian_phone")}</th>
                  <th className="px-4 py-3">{t("student.col_status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Spinner className="mx-auto h-6 w-6 text-indigo-600" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      {t("student.empty")}
                    </td>
                  </tr>
                ) : (
                  items.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => handleRowClick(s)}
                      className="cursor-pointer bg-white transition hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.admission_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatClass(s)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.roll_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.guardian_phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ActiveBadge active={s.is_active} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {t("student.page_of", { page, pages: totalPages })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("student.prev")}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("student.next")}
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <StudentModal
          student={modal.student}
          readOnly={!manage}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
