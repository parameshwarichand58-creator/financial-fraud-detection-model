export const fmtNum = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString();

export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toFixed(3)}%`;

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString() : "—";
