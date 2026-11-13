import { useContext, useMemo, useState } from "react";
import { CatalogContext } from "../context/CatalogContext.js";
import { BACKUP_KEYS, DEFAULT_CATALOG, DEFAULT_SPECIALTIES } from "../config";
import { getLastBackup, markBackupDone, getStoredJSON, restoreStoredDatasets } from "../utils/storage";
import { getLocalDateKey } from "../utils/date";
import { createRecordId } from "../utils/id";
import { parseCatalogLines } from "../utils/catalogImport";

function downloadBackup() {
  const data = { version: 1, exportedAt: new Date().toISOString(), keys: {} };
  BACKUP_KEYS.forEach((key) => {
    const value = getStoredJSON(key, null);
    data.keys[key] = value === null ? null : JSON.stringify(value);
  });
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clinic-backup-${getLocalDateKey(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  markBackupDone();
}

function CatalogSection({ title, listKey, importable = false }) {
  const { catalog, setCatalog } = useContext(CatalogContext);
  const list = useMemo(() => catalog[listKey] || [], [catalog, listKey]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [bulk, setBulk] = useState("");
  const [replace, setReplace] = useState(false);
  const [message, setMessage] = useState("");
  const [focusUnpriced, setFocusUnpriced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [preview, setPreview] = useState(null);
  const unpricedCount = list.filter((item) => !(Number(item.price) > 0)).length;
  const rows = useMemo(() => list.map((item, index) => ({ item, index })).filter(({ item }) => {
    const matchesPrice = !focusUnpriced || !(Number(item.price) > 0);
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchesPrice && matchesSearch;
  }), [list, focusUnpriced, searchTerm]);

  function updateRow(index, patch) {
    if (patch.name !== undefined) {
      const candidate = String(patch.name);
      if (!candidate.trim()) { setMessage("Name cannot be empty."); return false; }
      if (list.some((item, i) => i !== index && item.name.trim().toLowerCase() === candidate.trim().toLowerCase())) { setMessage("Duplicate names are not allowed."); return false; }
      patch.name = candidate.trim();
    }
    if (patch.price !== undefined && patch.price !== "" && (!Number.isFinite(Number(patch.price)) || Number(patch.price) < 0)) { setMessage("Price must be zero or greater."); return false; }
    setMessage("");
    setCatalog((current) => ({ ...current, [listKey]: (current[listKey] || []).map((item, i) => i === index ? { ...item, ...patch } : item) }));
    return true;
  }

  function removeRow(index) {
    if (!window.confirm(`Delete ${list[index]?.name || "this item"} from the list? Existing slips will remain unchanged.`)) return;
    setCatalog((current) => ({ ...current, [listKey]: (current[listKey] || []).filter((_, i) => i !== index) }));
  }

  function addRow(event) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setMessage("Name is required."); return; }
    if (list.some((item) => item.name.trim().toLowerCase() === cleanName.toLowerCase())) { setMessage("This name already exists."); return; }
    const parsedPrice = price === "" ? 0 : Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { setMessage("Enter a valid price."); return; }
    setCatalog((current) => ({ ...current, [listKey]: [...(current[listKey] || []), { name: cleanName, price: parsedPrice }] }));
    setName("");
    setPrice("");
    setMessage("");
  }

  function prepareImport() {
    const parsed = parseCatalogLines(bulk);
    if (!parsed.length) { setMessage("Paste at least one item."); setPreview(null); return; }
    const names = new Set();
    for (const item of parsed) {
      const key = item.name.toLowerCase();
      if (names.has(key)) { setMessage(`Duplicate in import: ${item.name}`); setPreview(null); return; }
      names.add(key);
    }
    if (!replace) {
      const existing = new Set(list.map((item) => item.name.trim().toLowerCase()));
      const duplicate = parsed.find((item) => existing.has(item.name.toLowerCase()));
      if (duplicate) { setMessage(`Already exists: ${duplicate.name}. Choose Replace or remove it from the pasted list.`); setPreview(null); return; }
    }
    setMessage("");
    setPreview({ items: parsed, replace });
  }

  function confirmImport() {
    if (!preview) return;
    if (!preview.replace) {
      const existing = new Set(list.map((item) => item.name.trim().toLowerCase()));
      const duplicate = preview.items.find((item) => existing.has(item.name.toLowerCase()));
      if (duplicate) {
        setMessage(`${duplicate.name} was added to the list after preview. Review the import again.`);
        setPreview(null);
        return;
      }
    }
    setCatalog((current) => ({ ...current, [listKey]: preview.replace ? [...preview.items] : [...(current[listKey] || []), ...preview.items] }));
    setMessage(`${preview.items.length} items imported successfully.`);
    setBulk("");
    setPreview(null);
  }

  return (
    <div className="register-card settings-card">
      <div className="register-heading">
        <h2>{title}</h2>
        <p>{list.length} items. Changes save automatically.{listKey === "procedures" ? " Oxygen and Nebulizer use the time-based rate above." : ""}</p>
        {unpricedCount > 0 && <p className="catalog-warning">{unpricedCount} item(s) have no price. <button type="button" className="link-button" onClick={() => setFocusUnpriced((value) => !value)}>{focusUnpriced ? "Show all" : "Show only these"}</button></p>}
      </div>
      {message && <p className="settings-message" role="status">{message}</p>}
      <input className="catalog-search" type="search" placeholder={`Search ${title.toLowerCase()}...`} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label={`Search ${title}`} />
      <div className="catalog-list">
        {rows.map(({ item, index }) => (
          <div className="catalog-row" key={`${item.name}-${index}`}>
            <input
              type="text"
              defaultValue={item.name}
              aria-label={`${title} name`}
              onBlur={(event) => { if (!updateRow(index, { name: event.target.value })) event.target.value = item.name; else event.target.value = event.target.value.trim(); }}
            />
            {listKey === "procedures" && ["oxygen", "nebulizer"].includes(String(item.name).trim().toLowerCase()) ? (
              <input type="text" value="Time-based" aria-label={`${item.name} pricing method`} readOnly />
            ) : (
              <input
                type="number"
                min="0"
                className={Number(item.price) > 0 ? "" : "needs-price"}
                value={item.price ?? 0}
                aria-label={`${item.name} price`}
                onChange={(event) => updateRow(index, { price: event.target.value === "" ? "" : Number(event.target.value) })}
                onBlur={() => { if (item.price === "") updateRow(index, { price: 0 }); }}
              />
            )}
            <button type="button" className="row-button danger" onClick={() => removeRow(index)}>Delete</button>
          </div>
        ))}
        {rows.length === 0 && <p className="check-empty">No matching items.</p>}
      </div>
      <form className="catalog-row catalog-add" onSubmit={addRow}>
        <input type="text" placeholder="New name" value={name} onChange={(event) => setName(event.target.value)} />
        <input type="number" min="0" placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
        <button type="submit" className="row-button">Add</button>
      </form>
      {importable && (
        <div className="catalog-import">
          <label htmlFor={`bulk-${listKey}`}>Bulk import (one per line: <code>Test Name, Price</code>)</label>
          <textarea id={`bulk-${listKey}`} rows="5" placeholder={"CBC, 500\nVitamin D 25"} value={bulk} onChange={(event) => { setBulk(event.target.value); setPreview(null); }} />
          <label className="catalog-replace"><input type="checkbox" checked={replace} onChange={(event) => { setReplace(event.target.checked); setPreview(null); }} />Replace the existing list</label>
          <button type="button" className="print-button" onClick={prepareImport}>Preview Import</button>
          {preview && (
            <div className="import-preview">
              <div className="import-preview-heading"><b>Import preview</b><span>{preview.items.length} tests · {preview.replace ? "Replace list" : "Add to existing list"}</span></div>
              <div className="import-preview-list">
                {preview.items.slice(0, 8).map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name}</span><b>{item.price > 0 ? `Rs. ${item.price.toLocaleString("en-PK")}` : "Price not set"}</b></div>)}
              </div>
              {preview.items.length > 8 && <small>And {preview.items.length - 8} more tests…</small>}
              <div className="settlement-actions"><button type="button" className="row-button" onClick={() => setPreview(null)}>Cancel</button><button type="button" className="register-button" onClick={confirmImport}>Confirm Import</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DoctorListEditor({ title, catalogKey }) {
  const { catalog, setCatalog } = useContext(CatalogContext);
  const list = catalog[catalogKey] || [];
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");

  function updateName(index, candidate) {
    const clean = candidate.trim();
    if (!clean) { setMessage("Doctor name cannot be empty."); return false; }
    if (list.some((doctor, i) => i !== index && doctor.name.trim().toLowerCase() === clean.toLowerCase())) { setMessage("Duplicate doctor names are not allowed in this list."); return false; }
    setCatalog((current) => ({ ...current, [catalogKey]: (current[catalogKey] || []).map((doctor, i) => i === index ? { ...doctor, name: clean } : doctor) }));
    setMessage("");
    return true;
  }

  function patch(index, patch) {
    setCatalog((current) => ({ ...current, [catalogKey]: (current[catalogKey] || []).map((doctor, i) => i === index ? { ...doctor, ...patch } : doctor) }));
  }

  function add(event) {
    event.preventDefault();
    const clean = newName.trim();
    if (!clean) { setMessage("Doctor name is required."); return; }
    if (list.some((doctor) => doctor.name.trim().toLowerCase() === clean.toLowerCase())) { setMessage("This doctor already exists."); return; }
    setCatalog((current) => ({ ...current, [catalogKey]: [...(current[catalogKey] || []), { name: clean, active: true }] }));
    setNewName("");
    setMessage("");
  }

  return (
    <div className="register-card settings-card">
      <div className="register-heading"><h2>{title}</h2><p>Disabled doctors stay on old slips but are hidden from new forms.</p></div>
      {message && <p className="settings-message" role="status">{message}</p>}
      <div className="doctor-settings-list">
        {list.map((doctor, index) => (
          <div className={`doctor-settings-row ${doctor.active === false ? "doctor-disabled" : ""}`} key={`${doctor.name}-${index}`}>
            <input defaultValue={doctor.name} aria-label="Doctor name" onBlur={(event) => { if (!updateName(index, event.target.value)) event.target.value = doctor.name; else event.target.value = event.target.value.trim(); }} />
            <label><input type="checkbox" checked={doctor.active !== false} onChange={(event) => patch(index, { active: event.target.checked })} /> Active</label>
          </div>
        ))}
      </div>
      <form className="catalog-row catalog-add no-price" onSubmit={add}>
        <input placeholder="Add doctor name" value={newName} onChange={(event) => setNewName(event.target.value)} />
        <button className="row-button" type="submit">Add Doctor</button>
      </form>
    </div>
  );
}

function alphaCode(number) {
  let value = number + 1;
  let code = "";
  while (value > 0) {
    value -= 1;
    code = String.fromCharCode(65 + (value % 26)) + code;
    value = Math.floor(value / 26);
  }
  return code;
}

function SpecialtySettings() {
  const { catalog, setCatalog } = useContext(CatalogContext);
  const specialties = catalog.specialties || [];
  const [newSpecialty, setNewSpecialty] = useState("");
  const [message, setMessage] = useState("");

  function patchSpecialty(id, patch) {
    const currentItem = specialties.find((item) => item.id === id);
    if (!currentItem) return false;
    if (patch.name !== undefined) {
      const name = String(patch.name);
      if (!name.trim()) { setMessage("Specialty name cannot be empty."); return false; }
      if (specialties.some((item) => item.id !== id && item.name.trim().toLowerCase() === name.trim().toLowerCase())) { setMessage("Duplicate specialty names are not allowed."); return false; }
      patch.name = name.trim();
    }
    if (patch.active === true && (["OPD", "CN", "PR", "US", "LB"].includes(String(currentItem.prefix || "").toUpperCase()) || specialties.some((item) => item.id !== id && String(item.prefix || "").toUpperCase() === String(currentItem.prefix || "").toUpperCase()))) { setMessage("This specialty prefix is already in use. Change it before enabling this specialty."); return false; }
    if (patch.prefix !== undefined) {
      const prefix = String(patch.prefix).trim().toUpperCase();
      if (!/^[A-Z]{1,5}$/.test(prefix)) { setMessage("Token prefix must contain 1 to 5 letters."); return false; }
      if (["OPD", "CN", "PR", "US", "LB"].includes(prefix) || specialties.some((item) => item.id !== id && String(item.prefix || "").toUpperCase() === prefix)) { setMessage("Each specialty must have a unique token prefix, separate from OPD and service prefixes."); return false; }
      patch.prefix = prefix;
    }
    if (patch.fee !== undefined && patch.fee !== "" && (!Number.isFinite(Number(patch.fee)) || Number(patch.fee) < 0)) { setMessage("Fee must be zero or greater."); return false; }
    setCatalog((current) => ({ ...current, specialties: current.specialties.map((item) => item.id === id ? { ...item, ...patch } : item) }));
    setMessage("");
    return true;
  }

  function patchDoctor(specialtyId, index, patch) {
    const specialty = specialties.find((item) => item.id === specialtyId);
    if (patch.name !== undefined) {
      const clean = String(patch.name).trim();
      if (!clean) { setMessage("Doctor name cannot be empty."); return false; }
      if (specialty?.doctors.some((doctor, i) => i !== index && doctor.name.trim().toLowerCase() === clean.toLowerCase())) { setMessage("Duplicate doctor names within a specialty are not allowed."); return false; }
      patch.name = clean;
    }
    setCatalog((current) => ({ ...current, specialties: current.specialties.map((item) => item.id === specialtyId ? { ...item, doctors: item.doctors.map((doctor, i) => i === index ? { ...doctor, ...patch } : doctor) } : item) }));
    setMessage("");
    return true;
  }

  function addDoctor(specialtyId, name) {
    const clean = name.trim();
    if (!clean) { setMessage("Doctor name is required."); return false; }
    const item = specialties.find((entry) => entry.id === specialtyId);
    if (item?.doctors.some((doctor) => doctor.name.trim().toLowerCase() === clean.toLowerCase())) { setMessage("This doctor already exists in this specialty."); return false; }
    setCatalog((current) => ({ ...current, specialties: current.specialties.map((entry) => entry.id === specialtyId ? { ...entry, doctors: [...(entry.doctors || []), { name: clean, active: true }] } : entry) }));
    setMessage("");
    return true;
  }

  function addSpecialty(event) {
    event.preventDefault();
    const clean = newSpecialty.trim();
    if (!clean) { setMessage("Specialty name is required."); return; }
    if (specialties.some((item) => item.name.trim().toLowerCase() === clean.toLowerCase())) { setMessage("This specialty already exists."); return; }
    const used = new Set(["OPD", "CN", "PR", "US", "LB", ...specialties.map((item) => String(item.prefix || "").toUpperCase())]);
    let suffix = 0;
    let prefix = `X${alphaCode(suffix)}`;
    while (used.has(prefix)) { suffix += 1; prefix = `X${alphaCode(suffix)}`; }
    const id = `specialty-${createRecordId()}`;
    setCatalog((current) => ({ ...current, specialties: [...current.specialties, { id, name: clean, fee: 400, prefix, doctors: [], active: true }] }));
    setNewSpecialty("");
    setMessage("New specialty added. Add its doctors and review its fee and token prefix before using it.");
  }

  return (
    <div className="register-card settings-card">
      <div className="register-heading"><h2>Consultation Specialties & Doctors</h2><p>Each specialty has its own fee and daily token series. A doctor may be listed in more than one specialty.</p></div>
      {message && <p className="settings-message" role="status">{message}</p>}
      <div className="specialty-settings-list">
        {specialties.map((item) => (
          <div className="specialty-settings-card" key={item.id}>
            <div className="specialty-settings-fields">
              <div className="form-field">
                <label>Specialty</label>
                <input defaultValue={item.name} onBlur={(event) => { if (!patchSpecialty(item.id, { name: event.target.value })) event.target.value = item.name; else event.target.value = event.target.value.trim(); }} />
              </div>
              <div className="form-field">
                <label>Fee (Rs.)</label>
                <input type="number" min="0" value={item.fee} onChange={(event) => patchSpecialty(item.id, { fee: event.target.value === "" ? "" : Number(event.target.value) })} onBlur={() => { if (item.fee === "") patchSpecialty(item.id, { fee: DEFAULT_SPECIALTIES.find((specialty) => specialty.id === item.id)?.fee ?? 400 }); }} />
              </div>
              <div className="form-field">
                <label>Token Prefix</label>
                <input key={`${item.id}-${item.prefix}`} defaultValue={item.prefix} maxLength="5" onBlur={(event) => { const prefix = event.target.value.toUpperCase().replace(/[^A-Z]/g, ""); if (!patchSpecialty(item.id, { prefix })) event.target.value = item.prefix; else event.target.value = prefix; }} />
              </div>
              <label className="specialty-active"><input type="checkbox" checked={item.active !== false} onChange={(event) => patchSpecialty(item.id, { active: event.target.checked })} /> Active</label>
            </div>
            <div className="doctor-settings-list">
              {(item.doctors || []).map((doctor, index) => (
                <div className={`doctor-settings-row ${doctor.active === false ? "doctor-disabled" : ""}`} key={`${doctor.name}-${index}`}>
                  <input defaultValue={doctor.name} aria-label="Doctor name" onBlur={(event) => { if (!patchDoctor(item.id, index, { name: event.target.value })) event.target.value = doctor.name; else event.target.value = event.target.value.trim(); }} />
                  <label><input type="checkbox" checked={doctor.active !== false} onChange={(event) => patchDoctor(item.id, index, { active: event.target.checked })} /> Active</label>
                </div>
              ))}
            </div>
            <form className="catalog-row catalog-add no-price" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.doctorName; if (addDoctor(item.id, input.value)) input.value = ""; }}>
              <input name="doctorName" placeholder="Add doctor to this specialty" />
              <button className="row-button" type="submit">Add Doctor</button>
            </form>
          </div>
        ))}
      </div>
      <form className="catalog-row catalog-add no-price" onSubmit={addSpecialty}>
        <input placeholder="New specialty name" value={newSpecialty} onChange={(event) => setNewSpecialty(event.target.value)} />
        <button type="submit" className="row-button">Add Specialty</button>
      </form>
    </div>
  );
}

function BackupCard() {
  const [message, setMessage] = useState("");
  const last = getLastBackup();

  function exportData() {
    try {
      downloadBackup();
      setMessage("Backup downloaded. Keep the file somewhere safe (USB or another drive).");
    } catch {
      setMessage("Backup could not be created. Check browser storage and try again.");
    }
  }

  function importData(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || parsed.version !== 1 || !parsed.keys || typeof parsed.keys !== "object" || Array.isArray(parsed.keys)) throw new Error("Invalid backup");
        BACKUP_KEYS.forEach((key) => { if (typeof parsed.keys[key] === "string") JSON.parse(parsed.keys[key]); });
        if (!window.confirm("This will REPLACE all current data with the backup. Continue?")) return;
        await restoreStoredDatasets(parsed.keys);
        window.location.reload();
      } catch {
        setMessage("This file is not a valid clinic backup, or browser storage could not be updated.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="register-card settings-card">
      <div className="register-heading"><h2>Backup & Restore</h2><p>Records are stored locally on this device; there is no cloud copy. Clearing browser data, deleting the browser profile, or losing this device can permanently remove records. Keep regular backups in a secure location. {last ? `Last backup: ${new Date(last).toLocaleString("en-PK")}.` : "No backup taken yet."}</p></div>
      <div className="settlement-actions">
        <button type="button" className="register-button" onClick={exportData}>Download Backup</button>
        <label className="print-button file-button">Restore from Backup<input type="file" accept="application/json,.json" onChange={importData} hidden /></label>
      </div>
      {message && <p className="backup-message" role="status">{message}</p>}
    </div>
  );
}

function ProcedureTimingEditor({ title, timingKey }) {
  const { catalog, setCatalog } = useContext(CatalogContext);
  const options = catalog.procedureTimings?.[timingKey] || [];
  const [message, setMessage] = useState("");

  function updateOption(index, field, rawValue) {
    const value = rawValue === "" ? "" : Number(rawValue);
    if (value !== "" && (!Number.isFinite(value) || value < (field === "minutes" ? 1 : 0))) return;
    const next = options.map((option, optionIndex) => optionIndex === index ? { ...option, [field]: value } : option);
    if (field === "minutes" && value !== "" && next.some((option, optionIndex) => optionIndex !== index && Number(option.minutes) === value)) {
      setMessage("Each duration must be unique.");
      return;
    }
    setMessage("");
    setCatalog((current) => ({
      ...current,
      procedureTimings: { ...(current.procedureTimings || {}), [timingKey]: next },
    }));
  }

  function addOption() {
    const maxMinutes = options.reduce((max, option) => Math.max(max, Number(option.minutes) || 0), 0);
    setCatalog((current) => ({
      ...current,
      procedureTimings: {
        ...(current.procedureTimings || {}),
        [timingKey]: [...(current.procedureTimings?.[timingKey] || []), { minutes: maxMinutes + 5, price: 0 }],
      },
    }));
    setMessage("");
  }

  function removeOption(index) {
    if (options.length <= 1) { setMessage("At least one duration option is required."); return; }
    setCatalog((current) => ({
      ...current,
      procedureTimings: {
        ...(current.procedureTimings || {}),
        [timingKey]: (current.procedureTimings?.[timingKey] || []).filter((_, optionIndex) => optionIndex !== index),
      },
    }));
    setMessage("");
  }

  return (
    <div className="register-card settings-card">
      <div className="register-heading">
        <h2>{title}</h2>
        <p>Manage the exact duration choices and fee shown to Reception.</p>
      </div>
      <div className="catalog-list">
        {options.map((option, index) => (
          <div className="catalog-row" key={`${timingKey}-${index}`}>
            <input
              type="number" min="1" step="1" value={option.minutes ?? ""}
              aria-label={`${title} duration in minutes`}
              onChange={(event) => updateOption(index, "minutes", event.target.value)}
              onBlur={() => { if (!Number.isInteger(Number(option.minutes)) || Number(option.minutes) < 1) updateOption(index, "minutes", 5); }}
            />
            <input
              type="number" min="0" step="1" value={option.price ?? ""}
              aria-label={`${title} amount in rupees`}
              onChange={(event) => updateOption(index, "price", event.target.value)}
              onBlur={() => { if (option.price === "") updateOption(index, "price", 0); }}
            />
            <button type="button" className="row-button danger" onClick={() => removeOption(index)}>Delete</button>
          </div>
        ))}
      </div>
      {message && <p className="settings-message" role="status">{message}</p>}
      <button type="button" className="print-button" onClick={addOption}>Add duration</button>
    </div>
  );
}

function Settings() {
  const { catalog, setCatalog } = useContext(CatalogContext);

  function resetCatalog() {
    try {
      downloadBackup();
    } catch {
      window.alert("Backup could not be downloaded. Reset has been cancelled to protect your data.");
      return;
    }
    const confirmation = window.prompt("A backup has been downloaded. Type RESET to restore default prices and lists:");
    if (confirmation !== "RESET") return;
    setCatalog(JSON.parse(JSON.stringify(DEFAULT_CATALOG)));
    window.alert("Catalog defaults restored. Existing patient and service records were not deleted.");
  }

  function updateNumber(key, value, min, max = Infinity) {
    if (value === "") { setCatalog((current) => ({ ...current, [key]: "" })); return; }
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) return;
    setCatalog((current) => ({ ...current, [key]: number }));
  }

  return (
    <div className="settings-page">
      <div className="dashboard-heading">
        <div className="dashboard-header-row"><h1>Settings</h1><button type="button" className="reset-demo-button" onClick={resetCatalog}>Backup & Reset Catalog</button></div>
        <p>Only the Owner can change fees, prices, specialties and doctor lists. Receptionists see locked prices.</p>
      </div>
      <div className="settings-grid">
        <div className="register-card settings-card">
          <div className="register-heading"><h2>General OPD Fees</h2><p>These prices are fixed on the reception form and can only be changed here.</p></div>
          <div className="form-row">
            <div className="form-field"><label htmlFor="opd-fee">General OPD Fee (Rs.)</label><input id="opd-fee" type="number" min="0" value={catalog.registrationFee} onChange={(event) => updateNumber("registrationFee", event.target.value, 0)} onBlur={() => { if (catalog.registrationFee === "") setCatalog((current) => ({ ...current, registrationFee: DEFAULT_CATALOG.registrationFee })); }} /></div>
            <div className="form-field"><label htmlFor="sugar-fee">RBS / FBS Fee (Rs.)</label><input id="sugar-fee" type="number" min="0" value={catalog.sugarTestFee} onChange={(event) => updateNumber("sugarTestFee", event.target.value, 0)} onBlur={() => { if (catalog.sugarTestFee === "") setCatalog((current) => ({ ...current, sugarTestFee: DEFAULT_CATALOG.sugarTestFee })); }} /></div>
          </div>
        </div>
        <div className="register-card settings-card">
          <div className="register-heading"><h2>Lab Distribution</h2><p>The hospital keeps this percentage; the remaining amount is payable to the lab.</p></div>
          <div className="form-field settings-percent"><label htmlFor="lab-percent">Hospital income percentage (%)</label><input id="lab-percent" type="number" min="0" max="100" value={catalog.labHospitalPercent} onChange={(event) => updateNumber("labHospitalPercent", event.target.value, 0, 100)} onBlur={() => { if (catalog.labHospitalPercent === "") setCatalog((current) => ({ ...current, labHospitalPercent: DEFAULT_CATALOG.labHospitalPercent })); }} /></div>
        </div>
      </div>
      <DoctorListEditor title="General OPD Doctors" catalogKey="generalOPDDoctors" />
      <SpecialtySettings />
      <DoctorListEditor title="Ultrasound Doctors" catalogKey="ultrasoundDoctors" />
      <div className="settings-grid procedure-timing-settings">
        <ProcedureTimingEditor title="Oxygen Duration & Amounts" timingKey="oxygen" />
        <ProcedureTimingEditor title="Nebulizer Duration & Amounts" timingKey="nebulizer" />
      </div>
      <div className="settings-grid"><CatalogSection title="Procedures & Prices" listKey="procedures" /><CatalogSection title="Ultrasound Scan Types & Prices" listKey="ultrasound" /></div>
      <CatalogSection title="Lab Tests & Prices" listKey="labTests" importable />
      <BackupCard />
    </div>
  );
}

export default Settings;
