import * as Yup from "yup";
import {
  patientNameSchema,
  ageSchema,
  ageUnitSchema,
  genderSchema,
  phoneSchema,
} from "./sharedPatientFields";

const PatientValidation = Yup.object({
  name: patientNameSchema,
  age: ageSchema,
  ageUnit: ageUnitSchema,
  gender: genderSchema,
  doctor: Yup.string().required("Please select a doctor"),
  phone: phoneSchema,
  sugarTest: Yup.string().oneOf(["none", "RBS", "FBS"]).required(),
});

export default PatientValidation;
