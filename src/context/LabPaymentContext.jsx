import { useEffect, useState } from "react";
import { LabPaymentContext } from "./LabPaymentContext.js";
import { LAB_PAYMENTS_KEY } from "../config";
import { getStoredJSON, updateStoredJSON, STORAGE_DATA_EVENT } from "../utils/storage";

function readPayments() {
  const saved = getStoredJSON(LAB_PAYMENTS_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

export function LabPaymentProvider({ children }) {
  const [payments, setPayments] = useState(readPayments);
  useEffect(() => {
    const onData = (event) => { if (event.detail?.key === LAB_PAYMENTS_KEY && Array.isArray(event.detail.value)) setPayments(event.detail.value); };
    window.addEventListener(STORAGE_DATA_EVENT, onData);
    return () => window.removeEventListener(STORAGE_DATA_EVENT, onData);
  }, []);



  async function addLabPayment(payment) {
    const updated = await updateStoredJSON(LAB_PAYMENTS_KEY, (current) => [payment, ...(Array.isArray(current) ? current : [])], []);
    setPayments(updated);
  }

  // Payments are never deleted: a wrong entry is voided with a reason.
  async function voidLabPayment(id, info) {
    const updated = await updateStoredJSON(LAB_PAYMENTS_KEY, (current) =>
      current.map((payment) =>
        payment.id === id && !payment.void ? { ...payment, void: info } : payment,
      ), []);
    setPayments(updated);
  }

  return (
    <LabPaymentContext.Provider
      value={{ payments, addLabPayment, voidLabPayment }}
    >
      {children}
    </LabPaymentContext.Provider>
  );
}
