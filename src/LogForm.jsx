import { useRef, useState } from "react";
import "./LogForm.css";

export default function LogForm({ habit, date, log, allowed, onSave, onDelete, busy: parentBusy }) {
  const [value, setValue] = useState(log ? String(log.value) : habit.tracking_type === "boolean" ? "1" : "");
  const [note, setNote] = useState(log?.note || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  async function run(callback) {
    if (lock.current || parentBusy || !allowed) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try { await callback(); setMessage("Išsaugota."); }
    catch (failure) { setError("Nepavyko. " + failure.message); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!allowed) return <p className="hint">Ši diena nežymima: būsima, nesuplanuota, už laikotarpio ribų arba įprotis archyvuotas.</p>;
  return <form className="log-form" onSubmit={(event) => { event.preventDefault(); void run(() => onSave(habit.id, date, value, note)); }} aria-busy={busy}>
    <fieldset disabled={busy || parentBusy}>
      {habit.tracking_type === "boolean" ?
        <label>Atlikimas<select value={value} onChange={(e) => setValue(e.target.value)}><option value="1">Atlikta</option><option value="0">Neatlikta</option></select></label> :
        <label>Faktinis kiekis {habit.unit && "(" + habit.unit + ")"}<input type="number" min="0" step="any" required value={value} onChange={(e) => setValue(e.target.value)} /></label>}
      <label>Pastaba<textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="actions"><button type="submit" className="primary">{busy ? "Saugoma…" : log ? "Atnaujinti įrašą" : "Pažymėti"}</button>
        {log && <button type="button" onClick={() => { void run(() => onDelete(habit.id, date)); }}>Ištrinti dienos įrašą</button>}
      </div>
    </fieldset>
    {error && <p role="alert" className="error">{error}</p>}
    {message && <p role="status">{message}</p>}
  </form>;
}
