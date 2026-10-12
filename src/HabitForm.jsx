import { useRef, useState } from "react";
import { localDate, validateHabit, WEEKDAYS } from "./habitLogic";
import "./HabitForm.css";

export default function HabitForm({ habit, hasLogs = false, onSave, onCancel }) {
  const [form, setForm] = useState(() => habit ? { ...habit, description: habit.description || "", unit: habit.unit || "", end_date: habit.end_date || "" } :
    { name: "", description: "", tracking_type: "boolean", target_value: 1, unit: "", weekdays: [1, 2, 3, 4, 5, 6, 7], start_date: localDate(), end_date: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  function field(name, value) { setForm((current) => ({ ...current, [name]: value })); }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await onSave(validateHabit(form), habit?.id); }
    catch (failure) { setError("Nepavyko išsaugoti. " + failure.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form className="habit-form panel" onSubmit={submit} aria-busy={busy}>
    <h2>{habit ? "Redaguoti įprotį" : "Naujas įprotis"}</h2>
    <fieldset disabled={busy}>
      <label>Pavadinimas<input required maxLength={200} value={form.name} onChange={(e) => field("name", e.target.value)} /></label>
      <label>Aprašymas<textarea value={form.description} onChange={(e) => field("description", e.target.value)} /></label>
      {hasLogs && <p className="hint">Įprotis turi atlikimo įrašų. Galite keisti tik pavadinimą ir aprašymą. Kitiems nustatymams archyvuokite įprotį ir sukurkite naują.</p>}
      <fieldset disabled={hasLogs}>
        <div className="form-grid">
          <label>Sekimo tipas<select value={form.tracking_type} onChange={(e) => setForm((current) => ({ ...current, tracking_type: e.target.value, target_value: e.target.value === "boolean" ? 1 : current.target_value }))}>
            <option value="boolean">Žymimas</option><option value="quantity">Kiekis</option>
          </select></label>
          <label>Tikslas<input type="number" min="0" step="any" required disabled={form.tracking_type === "boolean"} value={form.target_value} onChange={(e) => field("target_value", e.target.value)} /></label>
          <label>Matavimo vienetas<input value={form.unit} onChange={(e) => field("unit", e.target.value)} placeholder="Pvz. km" /></label>
        </div>
        <fieldset className="weekday-field"><legend>Savaitės dienos</legend><div className="weekdays">
          {WEEKDAYS.map((day, index) => <label key={day}><input type="checkbox" checked={form.weekdays.includes(index + 1)} onChange={(e) => field("weekdays", e.target.checked ? [...form.weekdays, index + 1] : form.weekdays.filter((value) => value !== index + 1))} />{day}</label>)}
        </div></fieldset>
        <div className="form-grid">
          <label>Pradžia<input type="date" required value={form.start_date} onChange={(e) => field("start_date", e.target.value)} /></label>
          <label>Pabaiga (neprivaloma)<input type="date" min={form.start_date} value={form.end_date} onChange={(e) => field("end_date", e.target.value)} /></label>
        </div>
      </fieldset>
      <div className="actions"><button type="submit" className="primary">{busy ? "Saugoma…" : "Išsaugoti"}</button><button type="button" onClick={onCancel}>Atšaukti</button></div>
    </fieldset>
    {error && <p className="error" role="alert">{error}</p>}
  </form>;
}
