export const WEEKDAYS = ["Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis", "Sekmadienis"];

export function localDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(value + "T12:00:00");
  return Number.isFinite(date.getTime()) && localDate(date) === value;
}
export function validateHabit(form) {
  const name = form.name.trim();
  if (!name || name.length > 200) throw new Error("Pavadinimas turi būti nuo 1 iki 200 simbolių.");
  if (!["boolean", "quantity"].includes(form.tracking_type)) throw new Error("Netinkamas sekimo tipas.");
  const weekdays = [...form.weekdays].sort((a, b) => a - b);
  if (!weekdays.length || new Set(weekdays).size !== weekdays.length || weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    throw new Error("Pasirinkite bent vieną savaitės dieną be pasikartojimų.");
  }
  const target = Number(form.target_value);
  if (!Number.isFinite(target) || target <= 0) throw new Error("Tikslas turi būti teigiamas skaičius.");
  if (form.tracking_type === "boolean" && target !== 1) throw new Error("Žymimo įpročio tikslas turi būti 1.");
  if (!validDate(form.start_date) || (form.end_date && !validDate(form.end_date))) throw new Error("Pasirinkite tinkamas datas.");
  if (form.end_date && form.end_date < form.start_date) throw new Error("Pabaiga negali būti ankstesnė už pradžią.");
  return { name, description: form.description?.trim() || null, tracking_type: form.tracking_type,
    target_value: target, unit: form.unit?.trim() || null, weekdays,
    start_date: form.start_date, end_date: form.end_date || null };
}
export function scheduleChanged(previous, next) {
  return ["tracking_type", "unit", "start_date", "end_date"].some((field) => (previous[field] || null) !== (next[field] || null)) ||
    Number(previous.target_value) !== Number(next.target_value) ||
    [...previous.weekdays].sort().join(",") !== [...next.weekdays].sort().join(",");
}
export function isScheduled(habit, date) {
  if (!validDate(date) || date < habit.start_date || (habit.end_date && date > habit.end_date)) return false;
  const weekday = new Date(date + "T12:00:00").getDay() || 7;
  return habit.weekdays.includes(weekday);
}
export function canLog(habit, date, today = localDate()) {
  return !habit.archived_at && date <= today && isScheduled(habit, date);
}
export function plannedDates(habit, from, to, today = localDate()) {
  if (!validDate(from) || !validDate(to) || from > to) return [];
  const start = [from, habit.start_date].sort().at(-1);
  const end = [to, today, habit.end_date || "9999-12-31"].sort()[0];
  const dates = [];
  const cursor = new Date(start + "T12:00:00");
  for (let date = localDate(cursor); date <= end; cursor.setDate(cursor.getDate() + 1), date = localDate(cursor)) {
    if (isScheduled(habit, date)) dates.push(date);
  }
  return dates;
}
export function progressFor(habit, logs, from, to, today = localDate()) {
  const dates = plannedDates(habit, from, to, today);
  const completed = new Set(logs.filter((log) => log.habit_id === habit.id && Number(log.value) >= Number(habit.target_value)).map((log) => log.local_date));
  const done = dates.filter((date) => completed.has(date)).length;
  return { done, total: dates.length, percent: dates.length ? Math.round(done / dates.length * 100) : null };
}
export function currentStreak(habit, logs, today = localDate()) {
  const dates = plannedDates(habit, habit.start_date, today, today).reverse();
  const completed = new Set(logs.filter((log) => log.habit_id === habit.id && Number(log.value) >= Number(habit.target_value)).map((log) => log.local_date));
  let count = 0;
  for (const date of dates) {
    if (date === today && !completed.has(date)) continue;
    if (!completed.has(date)) break;
    count++;
  }
  return count;
}
