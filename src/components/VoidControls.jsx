import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext.js";
import { ServiceContext } from "../context/ServiceContext.js";
import { LabPaymentContext } from "../context/LabPaymentContext.js";
import { voidBlockReason } from "../utils/void";

const QUICK_REASONS = ["Wrong name", "Duplicate", "Patient cancelled", "Other"];

export function VoidButton({ record, summary, onVoid }) {
  const { user, role } = useContext(AuthContext);
  const { services } = useContext(ServiceContext);
  const { payments } = useContext(LabPaymentContext);
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const triggerRef = useRef(null);
  const detailsRef = useRef(null);
  const blocked = voidBlockReason(record, { role, services, payments });

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setBlockedReason("");
        window.setTimeout(() => triggerRef.current?.focus(), 0);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    if (selectedReason === "Other") detailsRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedReason]);

  if (record.void) return null;

  function handleOpen() {
    setSelectedReason("");
    setDetails("");
    setError("");
    setBlockedReason(blocked || "");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setBlockedReason("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function handleConfirm() {
    const reason = selectedReason === "Other" ? details.trim() : selectedReason;
    if (!reason) {
      setError("Select a reason before confirming.");
      return;
    }
    if (selectedReason === "Other" && reason.length < 5) {
      setError("Please enter a clear reason (at least 5 characters).");
      return;
    }
    onVoid({
      at: new Date().toISOString(),
      by: user?.username || "",
      byName: user?.name || "",
      reason,
    });
    closeModal();
  }

  return (
    <>
      <button ref={triggerRef} type="button" className="row-button danger" onClick={handleOpen} title={blocked || "Void this record"}>
        Void
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className="modal-card void-modal" role="dialog" aria-modal="true" aria-labelledby="void-title" aria-describedby="void-description">
            <div className="void-modal-top">
              <span className="void-modal-icon" aria-hidden="true">!</span>
              <div>
                <h3 id="void-title">{blockedReason ? "Unable to void this record" : "Confirm record void"}</h3>
                <p id="void-description">{blockedReason ? "This action is blocked to protect the lab settlement." : "This record will remain in history for audit purposes."}</p>
              </div>
            </div>
            <div className="void-record-summary">
              <span>Selected record</span>
              <strong>{summary}</strong>
            </div>
            {blockedReason ? (
              <div className="void-blocked-message" role="alert">{blockedReason}</div>
            ) : (
              <>
                <div className="void-warning-copy">After voiding, this record will be excluded from income totals. This action cannot be undone.</div>
                <div className="form-field">
                  <label>Reason for voiding <span>*</span></label>
                  <div className="void-reason-options" role="group" aria-label="Reason for voiding">
                    {QUICK_REASONS.map((reason) => (
                      <button key={reason} type="button" className={`void-reason-chip ${selectedReason === reason ? "selected" : ""}`} aria-pressed={selectedReason === reason} onClick={() => { setSelectedReason(reason); setError(""); }}>
                        {reason}
                      </button>
                    ))}
                  </div>
                  {selectedReason === "Other" && (
                    <textarea ref={detailsRef} id="void-reason-details" rows="3" value={details} onChange={(event) => { setDetails(event.target.value); setError(""); }} placeholder="Write the reason..." />
                  )}
                </div>
                {error && <small className="modal-error" role="alert">{error}</small>}
              </>
            )}
            <div className="modal-actions">
              <button type="button" className="row-button" onClick={closeModal}>{blockedReason ? "Close" : "Cancel"}</button>
              {!blockedReason && <button type="button" className="row-button danger solid" onClick={handleConfirm}>Confirm Void</button>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function VoidNote({ record }) {
  if (!record.void) return null;
  const when = new Date(record.void.at).toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return <span className="void-note"><span className="void-badge">VOID</span> {record.void.reason}<br /><small>{record.void.byName || record.void.by} · {when}</small></span>;
}
