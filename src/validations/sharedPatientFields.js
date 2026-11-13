import * as Yup from "yup";

export const patientNameSchema = Yup.string()
  .trim()
  .max(80, "Name cannot exceed 80 characters")
  .required("Patient name is required");

export const ageSchema = Yup.number()
  .transform((value, originalValue) =>
    typeof originalValue === "string" && originalValue.trim() === "" ? undefined : value,
  )
  .typeError("Age must be a number")
  .integer("Age must be a whole number")
  .min(0, "Age cannot be negative")
  .max(120, "Age cannot exceed 120")
  .test("age-unit-range", "Months must be between 0 and 11", function (value) {
    return this.parent.ageUnit !== "months" || (Number(value) >= 0 && Number(value) <= 11);
  })
  .required("Age is required");

export const ageUnitSchema = Yup.string()
  .oneOf(["years", "months"], "Select age unit")
  .required("Select age unit");

export const genderSchema = Yup.string()
  .oneOf(["Male", "Female"], "Please select a valid gender")
  .required("Please select gender");

export const phoneSchema = Yup.string()
  .trim()
  .matches(/^03[0-9]{9}$/, {
    message: "Enter a valid 11-digit mobile number",
    excludeEmptyString: true,
  });
