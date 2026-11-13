import { PDF_LAB_TESTS } from "./data/labTests";

export const CLINIC_NAME = "Noor Jahan Memorial";
export const CLINIC_ADDRESS = "Noor Jahan Shareef Hospital, Sector 11-D, North Karachi, Karachi";
export const CLINIC_PHONE = "0326 7083662";
export const STORAGE_KEY = "clinic_patients";
export const SHOW_FEE_ON_SLIP = true;
export const DEFAULT_FEE = 100;
export const AUTH_KEY = "clinic_auth";
export const CATALOG_VERSION = 2;

export const ROLES = { OWNER: "owner", RECEPTIONIST: "receptionist" };
export const DEMO_USERS = [
  { username: "owner", password: "owner123", role: ROLES.OWNER, name: "Owner" },
  { username: "reception", password: "reception123", role: ROLES.RECEPTIONIST, name: "Receptionist" },
];

export const SERVICES_KEY = "clinic_services";
export const CATALOG_KEY = "clinic_catalog";
export const LAB_PAYMENTS_KEY = "clinic_lab_payments";
export const LAST_BACKUP_KEY = "clinic_last_backup";
export const BACKUP_KEYS = [STORAGE_KEY, SERVICES_KEY, CATALOG_KEY, LAB_PAYMENTS_KEY];

export const SERVICE_TYPES = {
  consultation: {
    key: "consultation", title: "Consultation", slipTitle: "Consultation Slip",
    prefix: "CN", catalogKey: "specialties", itemLabel: "Specialty", doctor: "required", multi: false,
  },
  procedure: {
    key: "procedure", title: "Procedures", slipTitle: "Procedure Slip",
    prefix: "PR", catalogKey: "procedures", itemLabel: "Procedure", doctor: "none", multi: false,
  },
  ultrasound: {
    key: "ultrasound", title: "Ultrasound", slipTitle: "Ultrasound Slip",
    prefix: "US", catalogKey: "ultrasound", itemLabel: "Scan Type", doctor: "required", multi: false,
  },
  lab: {
    key: "lab", title: "Lab Tests", slipTitle: "Lab Slip",
    prefix: "LB", catalogKey: "labTests", itemLabel: "Tests", doctor: "none", multi: true,
  },
};

export const DEFAULT_SPECIALTIES = [
  { id: "skin", name: "Skin Specialist", fee: 400, prefix: "S", doctors: [{ name: "Dr Ziyad Furqan", active: true }, { name: "Dr Tahira Soomro", active: true }], active: true },
  { id: "child", name: "Child Specialist", fee: 400, prefix: "C", doctors: [{ name: "Dr Amir Hussain", active: true }, { name: "Dr Noman Haider", active: true }, { name: "Dr Razi ur Rehman", active: true }], active: true },
  { id: "cardio-diabetes", name: "Cardiologist & Diabetologist", fee: 400, prefix: "CD", doctors: [{ name: "Dr Naeem Saeed", active: true }, { name: "Dr Shahid Ghori", active: true }], active: true },
  { id: "gynaecologist", name: "Gynaecologist", fee: 200, prefix: "G", doctors: [{ name: "Dr Fahmida Shareef", active: true }, { name: "Dr Tooba", active: true }, { name: "Dr Fouzia", active: true }, { name: "Dr Farhat", active: true }], active: true },
  { id: "gynaecologist-surgeon", name: "Gynaecologist Surgeon", fee: 400, prefix: "GS", doctors: [{ name: "Dr Nazia Ibrahim", active: true }, { name: "Dr Sarwat Mateen", active: true }, { name: "Dr Huma Intezar", active: true }, { name: "Dr Rutaba Qadir", active: true }], active: true },
  { id: "general-surgeon", name: "General Surgeon", fee: 400, prefix: "GN", doctors: [{ name: "Dr Hafiz Zaheer", active: true }], active: true },
];

export const DEFAULT_CATALOG = {
  version: CATALOG_VERSION,
  registrationFee: DEFAULT_FEE,
  sugarTestFee: 50,
  generalOPDDoctors: [
    { name: "Dr Fahmida Shareef", active: true },
    { name: "Dr Farman Ullah", active: true },
    { name: "Dr Shafqat", active: true },
    { name: "Dr Sameer", active: true },
    { name: "Dr Agha Ali Adnan", active: true },
  ],
  specialties: DEFAULT_SPECIALTIES,
  ultrasoundDoctors: [
    { name: "Dr Urooj Shareef", active: true },
    { name: "Dr Waniya Waseem", active: true },
    { name: "Dr Unaiba Khan", active: true },
  ],
  labHospitalPercent: 30,
  procedureTimings: {
    oxygen: [
      { minutes: 5, price: 50 }, { minutes: 10, price: 100 }, { minutes: 15, price: 150 },
      { minutes: 20, price: 200 }, { minutes: 25, price: 250 }, { minutes: 30, price: 300 },
    ],
    nebulizer: [
      { minutes: 5, price: 50 }, { minutes: 10, price: 100 }, { minutes: 15, price: 150 },
      { minutes: 20, price: 200 }, { minutes: 25, price: 250 }, { minutes: 30, price: 300 },
    ],
  },
  procedures: [
    { name: "Sugar Test", price: 100 },
    { name: "BP Check", price: 50 },
    { name: "Nebulizer", price: 300 },
    { name: "Dressing", price: 300 },
    { name: "Oxygen", price: 500 },
  ],
  ultrasound: [
    { name: "U/S Pelvis", price: 1500 },
    { name: "U/S FWB", price: 1500 },
    { name: "U/S Upper Abdomen", price: 1500 },
    { name: "U/S Lower Abdomen", price: 1500 },
    { name: "U/S Whole Abdomen", price: 1500 },
    { name: "U/S Anomaly Scan", price: 1500 },
    { name: "U/S KUB", price: 1500 },
  ],
  labTests: PDF_LAB_TESTS,
};
