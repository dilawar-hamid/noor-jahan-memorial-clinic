export function formatAge(value, unit = "years") {
  if (value === "" || value === null || value === undefined) return "—";
  const age = Number(value);
  if (!Number.isFinite(age)) return String(value);
  if (unit === "months") return age === 0 ? "Under 1 Month" : `${age} ${age === 1 ? "Month" : "Months"}`;
  return `${age} ${age === 1 ? "Year" : "Years"}`;
}

export function validateAge(value, unit) {
  if (value === "" || value === null || value === undefined) return "Age is required";
  const age = Number(value);
  if (!Number.isInteger(age)) return "Age must be a whole number";
  if (unit === "months" && (age < 0 || age > 11)) return "Months must be between 0 and 11";
  if (unit === "years" && (age < 0 || age > 120)) return "Years must be between 0 and 120";
  return "";
}
