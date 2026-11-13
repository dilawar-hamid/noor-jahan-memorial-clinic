import { getLocalDateKey } from "./date";
const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0);
export const monthKeyOf = (value) => getLocalDateKey(value).slice(0, 7);

export function labSummaryForMonth(services, payments, monthKey) {
  const slips = services.filter((s) => s.type === "lab" && monthKeyOf(s.createdAt) === monthKey);
  const valid = slips.filter((s) => !s.void);
  const monthPayments = payments.filter((p) => p.monthKey === monthKey);
  const activePayments = monthPayments.filter((p) => !p.void);
  const collected = sum(valid, (s) => s.amount);
  const hospital = sum(valid, (s) => s.hospitalShare);
  const payable = sum(valid, (s) => s.labShare);
  const paid = sum(activePayments, (p) => p.amount);
  const balance = payable - paid;
  const overpaid = Math.max(0, paid - payable);
  let status = "none";
  if (payable > 0 || paid > 0) status = overpaid > 0 ? "overpaid" : balance === 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  return { slips, valid, monthPayments, collected, hospital, payable, paid, balance, overpaid, status };
}
