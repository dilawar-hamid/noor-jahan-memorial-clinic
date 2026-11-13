import { SERVICE_TYPES } from "../config";

const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0);

export function summarizeIncome(patients, services) {
  const livePatients = patients.filter((p) => !p.void);
  const liveServices = services.filter((s) => !s.void);
  const voidedPatients = patients.filter((p) => p.void);
  const voidedServices = services.filter((s) => s.void);

  const opdFee = sum(livePatients, (p) => p.baseFee ?? (Number(p.fee) - Number(p.sugarTestFee || 0)));
  const sugarPatients = livePatients.filter((p) => p.sugarTest && p.sugarTest !== "none" && Number(p.sugarTestFee) > 0);
  const rows = [
    { key: "registration", label: "General OPD", count: livePatients.length, collected: opdFee, hospital: opdFee, lab: 0 },
    { key: "sugar", label: "Sugar Test (RBS / FBS)", count: sugarPatients.length, collected: sum(sugarPatients, (p) => p.sugarTestFee), hospital: sum(sugarPatients, (p) => p.sugarTestFee), lab: 0 },
  ];

  Object.values(SERVICE_TYPES).forEach((type) => {
    const list = liveServices.filter((s) => s.type === type.key);
    rows.push({ key: type.key, label: type.title, count: list.length, collected: sum(list, (s) => s.amount), hospital: sum(list, (s) => s.hospitalShare), lab: sum(list, (s) => s.labShare) });
  });

  const totals = rows.reduce((t, row) => ({
    count: t.count + (row.key === "sugar" ? 0 : row.count),
    collected: t.collected + row.collected,
    hospital: t.hospital + row.hospital,
    lab: t.lab + row.lab,
  }), { count: 0, collected: 0, hospital: 0, lab: 0 });
  const voided = { count: voidedPatients.length + voidedServices.length, amount: sum(voidedPatients, (p) => p.fee) + sum(voidedServices, (s) => s.amount) };
  const discounted = liveServices.filter((s) => Number(s.discount?.amount) > 0);
  const discounts = { count: discounted.length, amount: sum(discounted, (s) => s.discount.amount) };
  return { rows, totals, voided, discounts };
}

export const rowOf = (summary, key) => summary.rows.find((row) => row.key === key) || { count: 0, collected: 0, hospital: 0, lab: 0 };
export const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
