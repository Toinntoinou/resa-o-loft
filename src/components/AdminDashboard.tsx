"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SLOT_LABELS, type Slot } from "@/lib/config";
import { formatLong, formatMedium, todayKey } from "@/lib/dates";

type Reservation = {
  id: string;
  reference: string;
  date: string;
  slot: Slot;
  status: "CONFIRMED" | "CANCELLED";
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
};

type Settings = {
  capacity: number;
  allowFullDay: boolean;
  allowHalfDay: boolean;
  openWeekends: boolean;
  maxAdvanceDays: number;
};

type Closure = { id: string; date: string; reason: string | null };

type Tab = "reservations" | "settings" | "closures";

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reservations");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">Gestion</h1>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" className="btn-ghost text-sm">
            Voir le site ↗
          </a>
          <button onClick={logout} className="btn-ghost text-sm">
            Se déconnecter
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1 text-sm">
        <TabButton active={tab === "reservations"} onClick={() => setTab("reservations")}>
          Réservations
        </TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
          Paramètres
        </TabButton>
        <TabButton active={tab === "closures"} onClick={() => setTab("closures")}>
          Fermetures
        </TabButton>
      </div>

      {tab === "reservations" && <ReservationsPanel />}
      {tab === "settings" && <SettingsPanel />}
      {tab === "closures" && <ClosuresPanel />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 rounded-lg px-4 py-2 font-medium transition-colors",
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Réservations ──────────────────────────────────────────────────
function ReservationsPanel() {
  const today = useMemo(() => todayKey(), []);
  const [period, setPeriod] = useState<"upcoming" | "past" | "all">("upcoming");
  const [status, setStatus] = useState<"CONFIRMED" | "CANCELLED" | "all">("CONFIRMED");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (period === "upcoming") p.set("from", today);
    if (period === "past") p.set("to", today);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [status, period, q, today]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations?${queryString}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setRows(Array.isArray(data.reservations) ? data.reservations : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function act(id: string, action: "cancel" | "restore") {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }
  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement cette réservation ?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    load();
  }

  const groups = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of rows) {
      const arr = map.get(r.date) ?? [];
      arr.push(r);
      map.set(r.date, arr);
    }
    return Array.from(map.entries());
  }, [rows]);

  const confirmedCount = rows.filter((r) => r.status === "CONFIRMED").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Segmented
          value={period}
          onChange={(v) => setPeriod(v as typeof period)}
          options={[
            { value: "upcoming", label: "À venir" },
            { value: "past", label: "Historique" },
            { value: "all", label: "Toutes" },
          ]}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="field-input max-w-[12rem]"
        >
          <option value="CONFIRMED">Confirmées</option>
          <option value="CANCELLED">Annulées</option>
          <option value="all">Tous statuts</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, email, société…)"
          className="field-input min-w-[14rem] flex-1"
        />
        <a
          href={`/api/admin/export?${queryString}`}
          className="btn-ghost text-sm"
        >
          Exporter CSV
        </a>
      </div>

      <p className="text-sm text-stone-500">
        {loading
          ? "Chargement…"
          : `${rows.length} réservation${rows.length > 1 ? "s" : ""}${
              status === "all" ? ` · ${confirmedCount} confirmée(s)` : ""
            }`}
      </p>

      {!loading && groups.length === 0 && (
        <div className="card text-center text-stone-500">
          Aucune réservation pour ce filtre.
        </div>
      )}

      {groups.map(([date, items]) => (
        <div key={date} className="card">
          <h3 className="mb-3 text-sm font-semibold capitalize text-stone-900">
            {formatLong(date)}
          </h3>
          <div className="divide-y divide-stone-100">
            {items.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <span className="badge bg-brand-50 text-brand-700">
                  {SLOT_LABELS[r.slot]}
                </span>
                <div className="min-w-[12rem] flex-1">
                  <div className="font-medium text-stone-900">
                    {r.firstName} {r.lastName}
                    {r.company ? (
                      <span className="font-normal text-stone-500">
                        {" "}· {r.company}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-stone-500">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </div>
                  {r.notes ? (
                    <div className="mt-0.5 text-sm italic text-stone-400">
                      “{r.notes}”
                    </div>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-stone-400">
                  {r.reference}
                </span>
                {r.status === "CANCELLED" ? (
                  <span className="badge bg-stone-100 text-stone-500">Annulée</span>
                ) : (
                  <span className="badge bg-emerald-50 text-emerald-700">
                    Confirmée
                  </span>
                )}
                <div className="flex gap-2">
                  {r.status === "CONFIRMED" ? (
                    <button
                      onClick={() => act(r.id, "cancel")}
                      className="text-sm text-stone-500 hover:text-red-600"
                    >
                      Annuler
                    </button>
                  ) : (
                    <button
                      onClick={() => act(r.id, "restore")}
                      className="text-sm text-stone-500 hover:text-emerald-600"
                    >
                      Rétablir
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    className="text-sm text-stone-400 hover:text-red-600"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Paramètres ────────────────────────────────────────────────────
function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => setError("Impossible de charger les paramètres."));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      setSettings(data.settings);
      setMessage("Paramètres enregistrés.");
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <div className="card text-stone-500">Chargement…</div>;
  }

  return (
    <form onSubmit={save} className="card max-w-lg space-y-5">
      <div>
        <label className="field-label">Nombre de postes (capacité)</label>
        <input
          type="number"
          min={1}
          max={500}
          value={settings.capacity}
          onChange={(e) =>
            setSettings({ ...settings, capacity: Number(e.target.value) })
          }
          className="field-input max-w-[8rem]"
        />
        <p className="mt-1 text-xs text-stone-500">
          Postes disponibles à la réservation dans l&apos;open space.
        </p>
      </div>

      <div>
        <label className="field-label">Types de créneau proposés</label>
        <div className="space-y-2">
          <Check
            label="Journée entière"
            checked={settings.allowFullDay}
            onChange={(v) => setSettings({ ...settings, allowFullDay: v })}
          />
          <Check
            label="Demi-journées (matin / après-midi)"
            checked={settings.allowHalfDay}
            onChange={(v) => setSettings({ ...settings, allowHalfDay: v })}
          />
        </div>
      </div>

      <div>
        <label className="field-label">Ouverture</label>
        <Check
          label="Ouvert le week-end"
          checked={settings.openWeekends}
          onChange={(v) => setSettings({ ...settings, openWeekends: v })}
        />
      </div>

      <div>
        <label className="field-label">
          Réservation possible jusqu&apos;à (jours à l&apos;avance)
        </label>
        <input
          type="number"
          min={1}
          max={365}
          value={settings.maxAdvanceDays}
          onChange={(e) =>
            setSettings({ ...settings, maxAdvanceDays: Number(e.target.value) })
          }
          className="field-input max-w-[8rem]"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
      />
      {label}
    </label>
  );
}

// ─── Fermetures ────────────────────────────────────────────────────
function ClosuresPanel() {
  const today = useMemo(() => todayKey(), []);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/closures", { cache: "no-store" });
      const data = await res.json();
      setClosures(Array.isArray(data.closures) ? data.closures : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/closures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Ajout impossible.");
      return;
    }
    setReason("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/closures/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form onSubmit={add} className="card space-y-4">
        <h3 className="font-semibold text-stone-900">Ajouter une fermeture</h3>
        <p className="text-sm text-stone-500">
          Un jour fermé n&apos;est pas réservable (férié, congés, privatisation…).
        </p>
        <div>
          <label className="field-label">Date</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="field-input max-w-[12rem]"
          />
        </div>
        <div>
          <label className="field-label">
            Motif <span className="text-stone-400">(optionnel)</span>
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={120}
            placeholder="Jour férié, congés…"
            className="field-input"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary">
          Ajouter
        </button>
      </form>

      <div className="card">
        <h3 className="mb-3 font-semibold text-stone-900">Fermetures à venir</h3>
        {loading ? (
          <p className="text-sm text-stone-500">Chargement…</p>
        ) : closures.length === 0 ? (
          <p className="text-sm text-stone-500">Aucune fermeture programmée.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-medium capitalize text-stone-900">
                    {formatMedium(c.date)}
                  </div>
                  {c.reason && (
                    <div className="text-sm text-stone-500">{c.reason}</div>
                  )}
                </div>
                <button
                  onClick={() => remove(c.id)}
                  className="text-sm text-stone-400 hover:text-red-600"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-stone-100 p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            "rounded-md px-3 py-1.5 font-medium transition-colors",
            value === o.value
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-800",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
