import * as Yup from "yup";
import {
  patientNameSchema,
  ageSchema,
  ageUnitSchema,
  genderSchema,
  phoneSchema,
} from "./sharedPatientFields";

export function createServiceValidation(type, priceOf) {
  return Yup.object({
    patientName: patientNameSchema,
    age: ageSchema,
    ageUnit: ageUnitSchema,
    gender: genderSchema,
    phone: phoneSchema,
    doctor: ["consultation", "ultrasound"].includes(type)
      ? Yup.string().required("Please select a doctor")
      : Yup.string(),
    specialty: type === "consultation"
      ? Yup.string()
          .required("Please select a specialty")
          .test("specialty-price", "Price is not set. Please ask the owner.", (value) => !value || priceOf(value) > 0)
      : Yup.string(),
    itemName: ["procedure", "ultrasound"].includes(type)
      ? Yup.string()
          .required("Please select an item")
          .test("item-price", "Price is not set. Please ask the owner.", (value) => !value || priceOf(value) > 0)
      : Yup.string(),
    selectedTests: type === "lab"
      ? Yup.array()
          .of(Yup.string())
          .min(1, "Select at least one priced test")
          .test("priced-tests", "A selected test has no price. Ask the owner to set it.", (values = []) => values.every((name) => priceOf(name) > 0))
      : Yup.array().of(Yup.string()),
  });
}
