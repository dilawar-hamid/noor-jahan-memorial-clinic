import { ROLES } from "../config";
import { isToday } from "./date";
import { monthKeyOf } from "./lab";

export function voidBlockReason(record, { role, services, payments }) {
  if (record.void) return "This record is already voided.";
  if (role !== ROLES.OWNER && !isToday(record.createdAt)) return "Only today's records can be voided by the receptionist. Please ask the owner.";

  if (record.type === "lab") {
    const monthKey = monthKeyOf(record.createdAt);
    const remainingPayable = services.filter((service) => service.type === "lab" && monthKeyOf(service.createdAt) === monthKey && !service.void && service.id !== record.id).reduce((total, service) => total + (Number(service.labShare) || 0), 0);
    const paid = payments.filter((payment) => payment.monthKey === monthKey && !payment.void).reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
    if (paid > remainingPayable) return `This slip cannot be voided because it would create an overpayment of Rs. ${(paid - remainingPayable).toLocaleString("en-PK")}. First void the relevant lab payment entry, then try again.`;
  }
  return null;
}
