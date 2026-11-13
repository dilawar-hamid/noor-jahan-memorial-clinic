import { useContext, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import { CatalogContext } from "../context/CatalogContext.js";
import { ServiceContext } from "../context/ServiceContext.js";
import { AuthContext } from "../context/AuthContext.js";
import ServiceSlip from "../components/ServiceSlip";
import { VoidButton, VoidNote } from "../components/VoidControls";
import { SERVICE_TYPES } from "../config";
import { isToday } from "../utils/date";
import { printSlip } from "../utils/print";
import { money } from "../utils/income";
import { createRecordId } from "../utils/id";
import { createServiceValidation } from "../validations/ServiceValidation";
import ShowMore from "../components/ShowMore";
import { usePaged } from "../utils/usePaged";

const EMPTY_FORM = {
  patientName: "",
  age: "",
  ageUnit: "years",
  gender: "",
  phone: "",
  doctor: "",
  specialty: "",
  itemName: "",
  durationMinutes: "5",
  selectedTests: [],
};

function ServicePage({ type }) {
  const meta = SERVICE_TYPES[type];
  const { catalog } = useContext(CatalogContext);
  const { services, addService, voidService } = useContext(ServiceContext);
  const { user } = useContext(AuthContext);
  const items = catalog[meta.catalogKey] || [];
  const specialties = (catalog.specialties || []).filter((item) => item.active !== false);
  const activeUltrasoundDoctors = (catalog.ultrasoundDoctors || []).filter((item) => item.active !== false);

  const [testSearch, setTestSearch] = useState("");
  const [shownId, setShownId] = useState(null);
  const slipRef = useRef(null);
  const testDropdownRef = useRef(null);
  const submittingRef = useRef(false);

  const todayRecords = services
    .filter((record) => record.type === type && isToday(record.createdAt))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const selectedRecord = services.find((record) => record.id === shownId && record.type === type);
  const shown = selectedRecord && isToday(selectedRecord.createdAt)
    ? selectedRecord
    : todayRecords[0] || null;
  const { shown: shownRecords, remaining, showMore } = usePaged(todayRecords);

  const priceOf = (name) => {
    if (type === "consultation") return Number(specialties.find((item) => item.name === name)?.fee) || 0;
    return Number(items.find((item) => item.name === name)?.price) || 0;
  };
  const validationSchema = useMemo(
    () => createServiceValidation(type, (name) => {
      if (type === "consultation") {
        return Number((catalog.specialties || []).find((item) => item.name === name)?.fee) || 0;
      }
      return Number((catalog[meta.catalogKey] || []).find((item) => item.name === name)?.price) || 0;
    }),
    [type, catalog, meta.catalogKey],
  );

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,
    onSubmit: async (values, helpers) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        const selectedSpecialty = specialties.find((item) => item.name === values.specialty) || null;
        const selectedName = type === "consultation" ? values.specialty : values.itemName;
        const isTimedProcedure = type === "procedure" && ["oxygen", "nebulizer"].includes(String(selectedName).trim().toLowerCase());
        const procedureKey = String(selectedName).trim().toLowerCase();
        const timingOptions = isTimedProcedure ? (catalog.procedureTimings?.[procedureKey] || []) : [];
        const selectedTiming = timingOptions.find((option) => Number(option.minutes) === Number(values.durationMinutes));
        if (isTimedProcedure && !selectedTiming) {
          helpers.setFieldError("durationMinutes", "Please select a duration configured in Settings.");
          return;
        }
        const minutes = Number(selectedTiming?.minutes || 0);
        const timedPrice = Number(selectedTiming?.price || 0);
        const lines = type === "lab"
          ? values.selectedTests.map((name) => ({ name, price: priceOf(name) }))
          : [isTimedProcedure
            ? { name: `${selectedName} (${minutes} min)`, price: timedPrice, durationMinutes: minutes }
            : { name: selectedName, price: priceOf(selectedName) }];
        const amount = lines.reduce((total, item) => total + (Number(item.price) || 0), 0);
        const labPercent = Number(catalog.labHospitalPercent) || 0;
        const hospitalShare = type === "lab" ? Math.round((amount * labPercent) / 100) : amount;
        const record = {
          id: createRecordId(),
          type,
          patientName: values.patientName.trim(),
          age: Number(values.age),
          ageUnit: values.ageUnit,
          gender: values.gender,
          phone: values.phone.trim(),
          doctor: values.doctor,
          doctorRole: type === "ultrasound" ? "performedBy" : type === "consultation" ? "consulting" : "",
          specialty: type === "consultation" ? selectedSpecialty?.name || "" : "",
          tokenPrefix: type === "consultation" ? selectedSpecialty?.prefix || meta.prefix : meta.prefix,
          items: lines,
          amount,
          listTotal: amount,
          discount: null,
          manualPrice: false,
          labPercent: type === "lab" ? labPercent : null,
          hospitalShare,
          labShare: amount - hospitalShare,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || "",
          void: null,
        };
        await addService(record);
        setShownId(record.id);
        setTestSearch("");
        testDropdownRef.current?.removeAttribute("open");
        helpers.resetForm();
      } catch {
        helpers.setStatus("This slip could not be saved. Please retry before leaving this page.");
      } finally {
        submittingRef.current = false;
      }
    },
  });

  const selectedSpecialtyItem = specialties.find((item) => item.name === formik.values.specialty) || null;
  const doctorOptions = type === "consultation"
    ? (selectedSpecialtyItem?.doctors || []).filter((doctor) => doctor.active !== false)
    : activeUltrasoundDoctors;
  const currentItems = type === "consultation" ? specialties : items;
  const selectedName = type === "consultation" ? formik.values.specialty : formik.values.itemName;
  const selectedTests = formik.values.selectedTests;
  const labTotal = selectedTests.reduce((total, name) => total + priceOf(name), 0);
  const timedProcedure = type === "procedure" && ["oxygen", "nebulizer"].includes(String(selectedName).trim().toLowerCase());
  const procedureKey = String(selectedName).trim().toLowerCase();
  const timingOptions = timedProcedure ? (catalog.procedureTimings?.[procedureKey] || []) : [];
  const selectedTiming = timingOptions.find((option) => Number(option.minutes) === Number(formik.values.durationMinutes));
  const amountValue = type === "lab" ? labTotal : timedProcedure
    ? Number(selectedTiming?.price || 0)
    : priceOf(selectedName);
  const visibleTests = items.filter((item) => item.name.toLowerCase().includes(testSearch.trim().toLowerCase()));
  const setField = (name, value) => formik.setFieldValue(name, value);
  const toggleTest = (name) => {
    if (priceOf(name) <= 0) return;
    const next = selectedTests.includes(name)
      ? selectedTests.filter((test) => test !== name)
      : [...selectedTests, name];
    setField("selectedTests", next);
  };

  return (
    <div className="registration-page">
      <div className="registration-workspace">
        <div className="register-card">
          <div className="register-heading">
            <h2>{meta.title}</h2>
            <p>Enter patient details and generate a slip.</p>
          </div>
          {formik.status && <p className="backup-message" role="alert">{formik.status}</p>}
        <form className="register-form" onSubmit={formik.handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="svc-name">Patient Name <span>*</span></label>
              <input id="svc-name" name="patientName" type="text" placeholder="Enter patient name" value={formik.values.patientName} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              {formik.touched.patientName && formik.errors.patientName && <small>{formik.errors.patientName}</small>}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="svc-age">Age <span>*</span></label>
                <div className="age-input-group">
                  <input id="svc-age" name="age" type="number" min="0" max={formik.values.ageUnit === "months" ? 11 : 120} placeholder="Age" value={formik.values.age} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  <select name="ageUnit" aria-label="Age unit" value={formik.values.ageUnit} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                {formik.touched.age && formik.errors.age && <small>{formik.errors.age}</small>}
              </div>
              <div className="form-field">
                <label>Gender <span>*</span></label>
                <div className="gender-buttons" role="group" aria-label="Select gender">
                  {["Male", "Female"].map((option) => (
                    <button key={option} type="button" aria-pressed={formik.values.gender === option} className={formik.values.gender === option ? "selected" : ""} onClick={() => { setField("gender", option); formik.setFieldTouched("gender", true, false); }}>
                      {option}
                    </button>
                  ))}
                </div>
                {formik.touched.gender && formik.errors.gender && <small>{formik.errors.gender}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="svc-phone">Phone Number</label>
                <input id="svc-phone" name="phone" type="tel" placeholder="Optional" value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                {formik.touched.phone && formik.errors.phone && <small>{formik.errors.phone}</small>}
              </div>
              {type === "ultrasound" && (
                <div className="form-field">
                  <label htmlFor="svc-doctor">Scan performed by <span>*</span></label>
                  <select id="svc-doctor" name="doctor" value={formik.values.doctor} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    <option value="">Select doctor</option>
                    {doctorOptions.map((doctor) => <option key={doctor.name} value={doctor.name}>{doctor.name}</option>)}
                  </select>
                  {formik.touched.doctor && formik.errors.doctor && <small>{formik.errors.doctor}</small>}
                </div>
              )}
            </div>

            {type === "lab" ? (
              <div className="form-field">
                <label htmlFor="svc-test-search">{meta.itemLabel} <span>*</span></label>
                <details className="lab-test-dropdown" ref={testDropdownRef}>
                  <summary>{selectedTests.length ? `${selectedTests.length} test(s) selected` : "Select one or more lab tests"}</summary>
                  <div className="lab-test-dropdown-panel">
                    <input id="svc-test-search" type="search" placeholder="Search test by name..." value={testSearch} onChange={(event) => setTestSearch(event.target.value)} />
                    <div className="check-list">
                      {items.length === 0 && <p className="check-empty">No tests added yet. <Link to="/settings">Add tests in Settings</Link></p>}
                      {items.length > 0 && visibleTests.length === 0 && <p className="check-empty">No matching test.</p>}
                      {visibleTests.map((item, index) => {
                        const priced = Number(item.price) > 0;
                        return (
                          <label className={`check-row ${!priced ? "check-row-disabled" : ""}`} key={`${item.name}-${index}`}>
                            <input type="checkbox" checked={selectedTests.includes(item.name)} disabled={!priced} onChange={() => toggleTest(item.name)} />
                            <span>{item.name}</span>
                            <b className={priced ? "" : "no-price-tag"}>{priced ? money(item.price) : "Price not set"}</b>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </details>
                {selectedTests.length > 0 && <div className="selected-test-tags">{selectedTests.map((name) => <button key={name} type="button" onClick={() => toggleTest(name)} title={`Remove ${name}`}>{name} <span aria-hidden="true">×</span></button>)}</div>}
                <div className="check-summary">{selectedTests.length} selected · Total {money(labTotal)}</div>
                {formik.submitCount > 0 && formik.errors.selectedTests && <small>{formik.errors.selectedTests}</small>}
              </div>
            ) : type === "consultation" ? (
              <>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="svc-item">Specialty <span>*</span></label>
                    <select id="svc-item" name="specialty" value={formik.values.specialty} onChange={(event) => { formik.handleChange(event); setField("doctor", ""); }} onBlur={formik.handleBlur}>
                      <option value="">Select specialty</option>
                      {currentItems.map((item) => {
                        const price = Number(item.fee) || 0;
                        return <option key={item.id || item.name} value={item.name} disabled={price <= 0}>{`${item.name}${price > 0 ? ` — Rs. ${price}` : " — Price not set"}`}</option>;
                      })}
                    </select>
                    {formik.touched.specialty && formik.errors.specialty && <small>{formik.errors.specialty}</small>}
                  </div>
                  <div className="form-field">
                    <label htmlFor="svc-doctor">Doctor <span>*</span></label>
                    <select id="svc-doctor" name="doctor" value={formik.values.doctor} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={!selectedSpecialtyItem}>
                      <option value="">{selectedSpecialtyItem ? "Select doctor" : "Select specialty first"}</option>
                      {doctorOptions.map((doctor) => <option key={doctor.name} value={doctor.name}>{doctor.name}</option>)}
                    </select>
                    {formik.touched.doctor && formik.errors.doctor && <small>{formik.errors.doctor}</small>}
                  </div>
                </div>
                <div className="locked-fee-row total"><span>Consultation Fee</span><b>{amountValue > 0 ? money(amountValue) : "Price not set"}</b></div>
              </>
            ) : (
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="svc-item">{meta.itemLabel} <span>*</span></label>
                  <select id="svc-item" name="itemName" value={formik.values.itemName} onChange={(event) => {
                    formik.handleChange(event);
                    if (type === "procedure") {
                      const key = String(event.target.value).trim().toLowerCase();
                      const choices = catalog.procedureTimings?.[key] || [];
                      if (["oxygen", "nebulizer"].includes(key)) setField("durationMinutes", String(choices[0]?.minutes || ""));
                    }
                  }} onBlur={formik.handleBlur}>
                    <option value="">Select item</option>
                    {currentItems.map((item, index) => {
                      const isTimed = type === "procedure" && ["oxygen", "nebulizer"].includes(String(item.name).trim().toLowerCase());
                      const price = Number(item.price) || 0;
                      return <option key={`${item.name}-${index}`} value={item.name} disabled={!isTimed && price <= 0}>{`${item.name}${isTimed ? " — Time-based" : price > 0 ? ` — Rs. ${price}` : " — Price not set"}`}</option>;
                    })}
                  </select>
                  {formik.touched.itemName && formik.errors.itemName && <small>{formik.errors.itemName}</small>}
                </div>
                <div className="form-field">
                  <label>Amount (Rs.)</label>
                  <input type="text" value={amountValue > 0 ? amountValue : ""} readOnly aria-readonly="true" placeholder="Calculated from selected item" />
                  <small className="hint">Price is fixed by the owner in Settings.</small>
                </div>
                {timedProcedure && (
                  <div className="form-field">
                    <label htmlFor="svc-duration">Duration <span>*</span></label>
                    <select id="svc-duration" name="durationMinutes" value={formik.values.durationMinutes} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={timingOptions.length === 0}>
                      {timingOptions.length === 0 && <option value="">No durations configured</option>}
                      {timingOptions.map((option) => (
                        <option key={option.minutes} value={option.minutes}>{option.minutes} min — {money(option.price)}</option>
                      ))}
                    </select>
                    {formik.touched.durationMinutes && formik.errors.durationMinutes && <small>{formik.errors.durationMinutes}</small>}
                    <small className="hint">Duration and fee are controlled separately in Owner Settings.</small>
                  </div>
                )}
              </div>
            )}

            {type === "lab" && <div className="locked-fee-row total"><span>Lab Total</span><b>{money(labTotal)}</b></div>}
            <button className="register-button" type="submit" disabled={formik.isSubmitting}>Generate Slip</button>
          </form>
        </div>

        <div className="token-slip-card">
          <div className="token-slip-heading">
            <h2>{meta.slipTitle}</h2>
            <button type="button" className="print-button" onClick={() => printSlip(slipRef.current)} disabled={!shown || Boolean(shown.void)}>Print Slip</button>
          </div>
          {shown ? <ServiceSlip record={shown} slipRef={slipRef} /> : <p className="no-token">No slip generated yet.</p>}
        </div>
      </div>

      <div className="registration-patients">
        <div className="recent-patients-card">
          <div className="table-heading"><h2>Today&apos;s {meta.title}</h2><span>{todayRecords.filter((record) => !record.void).length} Slips</span></div>
          <div className="table-wrapper">
            <table className="patients-table">
              <thead><tr><th>Slip</th><th>Patient</th><th>{meta.itemLabel}</th>{(type === "consultation" || type === "ultrasound") && <th>Doctor</th>}<th>Time</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {shownRecords.map((record) => (
                  <tr key={record.id} className={`${record.void ? "row-void" : ""} selectable-row`} onClick={() => setShownId(record.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setShownId(record.id); }}>
                    <td className="patient-token">{record.slipNo}</td>
                    <td>{record.patientName}</td>
                    <td>{record.items.map((item) => item.name).join(", ")}</td>
                    {(type === "consultation" || type === "ultrasound") && <td>{record.doctor || "—"}</td>}
                    <td>{new Date(record.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{money(record.amount)}</td>
                    <td className="actions-cell" onClick={(event) => event.stopPropagation()}>
                      <div className="row-actions"><VoidButton record={record} summary={`${record.slipNo} — ${record.patientName} — ${money(record.amount)}`} onVoid={(info) => voidService(record.id, info)} /><VoidNote record={record} /></div>
                    </td>
                  </tr>
                ))}
                {todayRecords.length === 0 && <tr><td colSpan={type === "consultation" || type === "ultrasound" ? 7 : 6} className="empty-table">No slips today</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="table-hint">Select a slip row to display and reprint it.</p>
          <ShowMore remaining={remaining} onClick={showMore} />
        </div>
      </div>
    </div>
  );
}

export default ServicePage;
