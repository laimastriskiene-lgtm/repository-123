import { useState } from "react";
import { canLog, currentStreak, WEEKDAYS } from "./habitLogic";
import LogForm from "./LogForm";
import "./HabitCard.css";

export default function HabitCard({ habit, logs, date, today, busy, onEdit, onArchive, onDelete, onSaveLog, onDeleteLog }) {
  const [error, setError] = useState("");
  const log = logs.find((item) => item.habit_id === habit.id && item.local_date === date);
  async function run(callback) {
    setError("");
    try { await callback(); }
    catch (failure) { setError("Nepavyko. " + failure.message); }
  }
  const status = log ? Number(log.value) >= Number(habit.target_value) ? "Atlikta" : "Neatlikta" : "Nepažymėta";
  return <article className="habit-card panel" aria-busy={busy}>
    <div className="habit-heading"><h2>{habit.name}</h2><span className={"badge " + (status === "Atlikta" ? "complete" : "")}>{habit.archived_at ? "Archyvuotas" : status}</span></div>
    {habit.description && <p>{habit.description}</p>}
    <p className="hint">Tikslas: {habit.target_value} {habit.unit} · {habit.weekdays.map((day) => WEEKDAYS[day - 1].slice(0, 3)).join(", ")}</p>
    <p className="hint">{habit.start_date} – {habit.end_date || "be pabaigos"} · Serija: {currentStreak(habit, logs, today)} suplanuotos dienos</p>
    <div className="actions">
      <button disabled={busy} onClick={() => onEdit(habit)}>Redaguoti</button>
      <button disabled={busy} onClick={() => { void run(() => onArchive(habit.id, !habit.archived_at)); }}>{habit.archived_at ? "Atkurti" : "Archyvuoti"}</button>
      <button className="danger" disabled={busy} onClick={() => {
        if (window.confirm("Galutinai ištrinti įprotį „" + habit.name + "“ ir visus jo atlikimo įrašus?")) void run(() => onDelete(habit.id));
      }}>Galutinai ištrinti</button>
    </div>
    {log && <p className="hint">Įrašyta: {log.value} {habit.unit}{log.note ? " · " + log.note : ""}</p>}
    <LogForm key={habit.id + ":" + date + ":" + (log ? log.id + ":" + log.value + ":" + log.note : "empty")} habit={habit} date={date} log={log} allowed={canLog(habit, date, today)}
      onSave={onSaveLog} onDelete={onDeleteLog} busy={busy} />
    {error && <p role="alert" className="error">{error}</p>}
  </article>;
}
