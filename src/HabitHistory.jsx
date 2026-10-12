import { plannedDates } from "./habitLogic";
import "./HabitHistory.css";

export default function HabitHistory({ habits, logs, from, to, today }) {
  if (!habits.length) return <p className="panel">Pasirinktoje grupėje įpročių nėra.</p>;
  return <section className="history-list" aria-label="Atlikimo istorija">{habits.map((habit) => {
    const dates = plannedDates(habit, from, to, today);
    const records = new Map(logs.filter((log) => log.habit_id === habit.id).map((log) => [log.local_date, log]));
    const extra = logs.filter((log) => log.habit_id === habit.id && log.local_date >= from && log.local_date <= to && !dates.includes(log.local_date));
    return <article className="panel" key={habit.id}><h2>{habit.name}</h2>
      {!dates.length && <p>Nėra suplanuotų dienų.</p>}
      <ul className="history-rows">{dates.map((date) => {
        const log = records.get(date);
        return <li key={date}><time>{date}</time><strong>{!log ? "Nepažymėta" : Number(log.value) >= Number(habit.target_value) ? "Atlikta" : "Neatlikta"}</strong>
          {log && <span>{log.value} {habit.unit}</span>}{log?.note && <p>{log.note}</p>}</li>;
      })}</ul>
      {extra.length > 0 && <details><summary>Kiti įrašai (neįtraukti į progresą)</summary><ul className="history-rows">{extra.map((log) => <li key={log.id}>{log.local_date}: {log.value} {habit.unit} {log.note}</li>)}</ul></details>}
    </article>;
  })}</section>;
}
