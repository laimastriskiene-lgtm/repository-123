import { useCallback, useEffect, useRef, useState } from "react";
import HabitForm from "./HabitForm";
import HabitCard from "./HabitCard";
import HabitHistory from "./HabitHistory";
import ProgressBar from "./ProgressBar";
import { loadHabitData, saveHabit, setArchived, deleteHabit, saveLog, deleteLog } from "./habitsApi";
import { localDate, progressFor, validDate } from "./habitLogic";
import "./HabitTracker.css";

export default function HabitTracker({ userId, epoch, identity, page }) {
  const [data, setData] = useState({ habits: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [archived, setArchivedView] = useState(false);
  const [editor, setEditor] = useState(null);
  const [today, setToday] = useState(localDate);
  const [date, setDate] = useState(localDate);
  const [from, setFrom] = useState(() => localDate().slice(0, 8) + "01");
  const [to, setTo] = useState(localDate);
  const alive = useRef(false);
  const sequence = useRef(0);
  const lock = useRef(false);
  const current = useCallback(() => alive.current && identity.current.id === userId && identity.current.epoch === epoch, [identity, userId, epoch]);
  const load = useCallback(() => {
    if (lock.current) return;
    const request = ++sequence.current;
    return loadHabitData(userId).then((saved) => {
      if (current() && request === sequence.current) setData(saved);
    }).catch((failure) => {
      if (current() && request === sequence.current) setError("Nepavyko įkelti duomenų. " + failure.message);
    }).finally(() => {
      if (current() && request === sequence.current) setLoading(false);
    });
  }, [userId, current]);
  useEffect(() => {
    alive.current = true;
    void load();
    const timer = setInterval(() => setToday(localDate()), 30000);
    return () => { alive.current = false; clearInterval(timer); };
  }, [load]);

  async function perform(action, apply, reloadOnFailure = false) {
    if (lock.current) throw new Error("Palaukite, kol baigsis ankstesnis veiksmas.");
    if (!current()) throw new Error("Sesija pasikeitė.");
    lock.current = true; sequence.current++; setBusy(true);
    try {
      const saved = await action();
      if (!current()) throw new Error("Sesija pasikeitė.");
      setData((previous) => apply(previous, saved));
      return saved;
    } catch (failure) {
      // Šalinimas gali būti kelių API veiksmų seka: perkrauname, kad rodinys atitiktų serverį.
      if (reloadOnFailure && current()) {
        try {
          const fresh = await loadHabitData(userId);
          if (current()) setData(fresh);
        } catch { if (current()) setNotice("Nepavyko atnaujinti duomenų po klaidos. Perkraukite puslapį, kad patikrintumėte serverio būseną."); }
      }
      throw failure;
    } finally { lock.current = false; if (current()) setBusy(false); }
  }
  async function save(form, id) {
    await perform(() => saveHabit(form, id, userId), (previous, saved) => ({
      ...previous, habits: id ? previous.habits.map((habit) => habit.id === id ? saved : habit) : [...previous.habits, saved],
    }));
    if (current()) setEditor(null);
  }
  function archive(id, value) {
    return perform(() => setArchived(id, value, userId), (previous, saved) => ({
      ...previous, habits: previous.habits.map((habit) => habit.id === id ? saved : habit),
    }));
  }
  function remove(id) {
    return perform(() => deleteHabit(id, userId), (previous) => ({
      habits: previous.habits.filter((habit) => habit.id !== id), logs: previous.logs.filter((log) => log.habit_id !== id),
    }), true);
  }
  function saveDay(id, day, value, note) {
    return perform(() => saveLog(id, day, value, note, userId), (previous, saved) => ({
      ...previous, logs: [...previous.logs.filter((log) => !(log.habit_id === id && log.local_date === day)), saved],
    }));
  }
  function removeDay(id, day) {
    return perform(() => deleteLog(id, day, userId), (previous) => ({
      ...previous, logs: previous.logs.filter((log) => !(log.habit_id === id && log.local_date === day)),
    }));
  }
  const habits = data.habits.filter((habit) => Boolean(habit.archived_at) === archived);
  const validRange = validDate(from) && validDate(to) && from <= to;
  const stats = validRange ? habits.map((habit) => ({ habit, ...progressFor(habit, data.logs, from, to, today) })) : [];
  return <main className="habit-tracker">
    <header className="tracker-heading"><div><h1>{page === "history" ? "Istorija" : page === "progress" ? "Progresas" : "Mano įpročiai"}</h1><p>Maži žingsniai kiekvieną dieną</p></div>
      <label>Įpročiai<select disabled={busy} value={archived ? "archive" : "active"} onChange={(event) => setArchivedView(event.target.value === "archive")}><option value="active">Aktyvūs</option><option value="archive">Archyvuoti</option></select></label>
    </header>
    {notice && <p className="error" role="alert">{notice}</p>}
    {loading && <p className="panel" role="status">Kraunami įpročiai ir atlikimo įrašai…</p>}
    {error && <section className="panel"><p className="error" role="alert">{error}</p><button disabled={loading || busy} onClick={() => { setLoading(true); setError(""); void load(); }}>Bandyti dar kartą</button></section>}
    {!loading && !error && <>
      {page === "habits" ? <>
        <div className="tracker-toolbar"><label>Žymima diena<input type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button className="primary" disabled={busy || editor !== null} onClick={() => setEditor({})}>+ Naujas įprotis</button>
        </div>
        {editor && <HabitForm key={editor.id || "new"} habit={editor.id ? editor : null} hasLogs={data.logs.some((log) => log.habit_id === editor.id)} onSave={save} onCancel={() => setEditor(null)} />}
        {!habits.length && <p className="panel">{archived ? "Archyvuotų įpročių nėra." : "Įpročių kol kas nėra. Sukurkite pirmąjį."}</p>}
        <div className="habit-grid">{habits.map((habit) => <HabitCard key={habit.id} habit={habit} logs={data.logs} date={date} today={today} busy={busy || editor !== null}
          onEdit={setEditor} onArchive={archive} onDelete={remove} onSaveLog={saveDay} onDeleteLog={removeDay} />)}</div>
      </> : <>
        <div className="tracker-toolbar"><label>Nuo<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Iki<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div>
        {!validRange ? <p className="error" role="alert">Pasirinkite tinkamą laikotarpį: pradžia negali būti vėlesnė už pabaigą.</p> :
          page === "history" ? <HabitHistory habits={habits} logs={data.logs} from={from} to={to} today={today} /> :
            <div className="progress-list">
              <ProgressBar title="Bendras progresas" done={stats.reduce((sum, stat) => sum + stat.done, 0)} total={stats.reduce((sum, stat) => sum + stat.total, 0)} />
              {stats.map((stat) => <ProgressBar key={stat.habit.id} title={stat.habit.name} done={stat.done} total={stat.total} />)}
            </div>}
      </>}
    </>}
  </main>;
}

