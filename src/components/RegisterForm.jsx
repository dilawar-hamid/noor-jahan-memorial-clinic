import { useContext, useRef } from "react";
import { useFormik } from "formik";
import { CatalogContext } from "../context/CatalogContext.js";
import { AuthContext } from "../context/AuthContext.js";
import { PatientContext } from "../context/PatientContext.js";
import PatientValidation from "../validations/PatientValidation";
import { createRecordId } from "../utils/id";

function RegisterForm({ onPatientCreated }) {
  const { addPatient } = useContext(PatientContext);
  const { catalog } = useContext(CatalogContext);
  const { user } = useContext(AuthContext);
  const nameInputRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const sugarFee = Number(catalog.sugarTestFee) || 0;
  const registrationFee = Number(catalog.registrationFee) || 0;

  const formik = useFormik({
    initialValues: { name: "", age: "", ageUnit: "years", gender: "", doctor: "", phone: "", sugarTest: "none" },
    validationSchema: PatientValidation,
    validate: (values) => {
      const errors = {};
      if (registrationFee <= 0) errors.fee = "General OPD fee is not set. Please ask the owner.";
      if (values.sugarTest !== "none" && sugarFee <= 0) errors.sugarTest = "Sugar test price is not set. Please ask the owner.";
      return errors;
    },
    onSubmit: async (values, { resetForm }) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      const selectedSugarFee = values.sugarTest === "none" ? 0 : sugarFee;
      const newPatient = {
        name: values.name.trim(),
        age: Number(values.age),
        ageUnit: values.ageUnit,
        gender: values.gender,
        doctor: values.doctor,
        phone: values.phone.trim(),
        sugarTest: values.sugarTest,
        baseFee: registrationFee,
        sugarTestFee: selectedSugarFee,
        fee: registrationFee + selectedSugarFee,
        id: createRecordId(),
        createdAt: new Date().toISOString(),
        status: "Registered",
        createdBy: user?.username || "",
        void: null,
      };
      try {
        await addPatient(newPatient);
        onPatientCreated?.(newPatient.id);
        resetForm();
        nameInputRef.current?.focus();
      } catch {
        formik.setStatus("Patient record could not be saved. Please retry before closing this page.");
      } finally {
        isSubmittingRef.current = false;
      }
    },
  });

  const total = registrationFee + (formik.values.sugarTest === "none" ? 0 : sugarFee);
  const activeDoctors = (catalog.generalOPDDoctors || []).filter((doctor) => doctor.active !== false);

  return (
    <div className="register-card">
      <div className="register-heading">
        <h2>General OPD</h2>
        <p>Register a patient and generate a daily OPD token.</p>
      </div>

      {formik.status && <p className="backup-message" role="alert">{formik.status}</p>}
      <form className="register-form" onSubmit={formik.handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="name">Patient Name <span>*</span></label>
          <input id="name" ref={nameInputRef} type="text" placeholder="Enter patient name" name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          {formik.touched.name && formik.errors.name && <small>{formik.errors.name}</small>}
        </div>

        <div className="form-field">
          <label htmlFor="doctor">General Physician <span>*</span></label>
          <select id="doctor" name="doctor" value={formik.values.doctor} onChange={formik.handleChange} onBlur={formik.handleBlur}>
            <option value="">Select doctor</option>
            {activeDoctors.map((doctor) => <option key={doctor.name} value={doctor.name}>{doctor.name}</option>)}
          </select>
          {formik.touched.doctor && formik.errors.doctor && <small>{formik.errors.doctor}</small>}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="age">Age <span>*</span></label>
            <div className="age-input-group">
              <input id="age" type="number" min="0" max={formik.values.ageUnit === "months" ? 11 : 120} placeholder="Age" name="age" value={formik.values.age} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              <select aria-label="Age unit" name="ageUnit" value={formik.values.ageUnit} onChange={formik.handleChange}>
                <option value="years">Years</option>
                <option value="months">Months</option>
              </select>
            </div>
            {formik.touched.age && formik.errors.age && <small>{formik.errors.age}</small>}
          </div>
          <div className="form-field">
            <label>Gender <span>*</span></label>
            <div className="gender-buttons" role="group" aria-label="Select gender">
              {(["Male", "Female"]).map((gender) => <button key={gender} type="button" aria-pressed={formik.values.gender === gender} className={formik.values.gender === gender ? "selected" : ""} onClick={() => { formik.setFieldValue("gender", gender); formik.setFieldTouched("gender", true, false); }}>{gender}</button>)}
            </div>
            {formik.touched.gender && formik.errors.gender && <small>{formik.errors.gender}</small>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" placeholder="Optional" name="phone" value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.phone && formik.errors.phone && <small>{formik.errors.phone}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="sugarTest">Optional Sugar Test</label>
            <select id="sugarTest" name="sugarTest" value={formik.values.sugarTest} onChange={formik.handleChange}>
              <option value="none">No Sugar Test</option>
              <option value="RBS" disabled={sugarFee <= 0}>RBS — Rs. {sugarFee}{sugarFee <= 0 ? " (Price not set)" : ""}</option>
              <option value="FBS" disabled={sugarFee <= 0}>FBS — Rs. {sugarFee}{sugarFee <= 0 ? " (Price not set)" : ""}</option>
            </select>
            {formik.errors.sugarTest && <small>{formik.errors.sugarTest}</small>}
          </div>
        </div>

        <div className="locked-fee-row">
          <span>General OPD Fee</span><b>Rs. {registrationFee.toLocaleString("en-PK")}</b>
        </div>
        {registrationFee <= 0 && <small role="alert">General OPD fee is not set. Please ask the owner.</small>}
        {formik.values.sugarTest !== "none" && <div className="locked-fee-row"><span>{formik.values.sugarTest} Sugar Test</span><b>Rs. {sugarFee.toLocaleString("en-PK")}</b></div>}
        <div className="locked-fee-row total"><span>Total Payable</span><b>Rs. {total.toLocaleString("en-PK")}</b></div>

        <button className="register-button" type="submit" disabled={formik.isSubmitting || registrationFee <= 0}>Generate OPD Token</button>
      </form>
    </div>
  );
}

export default RegisterForm;
