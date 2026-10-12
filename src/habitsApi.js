import { supabase } from "./supabaseClient";
import { canLog, localDate, scheduleChanged, validateHabit } from "./habitLogic";

async function ownedSession(userId) {
  if (!supabase) throw new Error("Trūksta Supabase konfigūracijos.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!userId || data.session?.user.id !== userId) throw new Error("Sesija pasikeitė. Prisijunkite iš naujo.");
}
async function result(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
async function allRows(query) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const page = await result(query().range(offset, offset + 499));
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}
export async function loadHabitData(userId) {
  await ownedSession(userId);
  const habits = await allRows(() => supabase.from("habits").select("*").eq("user_id", userId).order("id"));
  const logs = await allRows(() => supabase.from("habit_logs").select("id,habit_id,local_date,value,note,created_at,habits!inner(user_id)").eq("habits.user_id", userId).order("id"));
  return { habits, logs };
}
async function getHabit(id, userId) {
  await ownedSession(userId);
  return result(supabase.from("habits").select("*").eq("id", id).eq("user_id", userId).single());
}
export async function saveHabit(form, id, userId) {
  const fields = validateHabit(form);
  await ownedSession(userId);
  if (!id) return result(supabase.from("habits").insert({ ...fields, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() }).select().single());
  const current = await getHabit(id, userId);
  const existing = await result(supabase.from("habit_logs").select("id").eq("habit_id", id).limit(1));
  if (existing.length && scheduleChanged(current, fields)) {
    throw new Error("Įprotis jau turi įrašų. Sekimo nustatymų keisti negalima: archyvuokite jį ir sukurkite naują.");
  }
  await ownedSession(userId);
  return result(supabase.from("habits").update(fields).eq("id", id).eq("user_id", userId).select().single());
}
export async function setArchived(id, archived, userId) {
  await ownedSession(userId);
  return result(supabase.from("habits").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id).eq("user_id", userId).select().single());
}
export async function deleteHabit(id, userId) {
  await getHabit(id, userId);
  // Nepriklauso nuo nepateiktos FK ON DELETE CASCADE konfigūracijos.
  await result(supabase.from("habit_logs").delete().eq("habit_id", id));
  await ownedSession(userId);
  return result(supabase.from("habits").delete().eq("id", id).eq("user_id", userId).select("id").single());
}
export async function saveLog(habitId, date, value, note, userId) {
  const habit = await getHabit(habitId, userId);
  if (!canLog(habit, date, localDate())) throw new Error("Šios dienos žymėti negalima: ji būsima, nesuplanuota, už laikotarpio ribų arba įprotis archyvuotas.");
  const numeric = Number(value);
  if (value === "" || !Number.isFinite(numeric) || numeric < 0 || (habit.tracking_type === "boolean" && ![0, 1].includes(numeric))) {
    throw new Error("Įveskite neneigiamą kiekį; žymimam įpročiui leidžiama tik 0 arba 1.");
  }
  await ownedSession(userId);
  const existing = await result(supabase.from("habit_logs").select("id,created_at").eq("habit_id", habitId).eq("local_date", date).maybeSingle());
  await ownedSession(userId);
  return result(supabase.from("habit_logs").upsert({ id: existing?.id || crypto.randomUUID(), created_at: existing?.created_at || new Date().toISOString(), habit_id: habitId, local_date: date, value: numeric, note: note.trim() || null },
    { onConflict: "habit_id,local_date" }).select().single());
}
export async function deleteLog(habitId, date, userId) {
  const habit = await getHabit(habitId, userId);
  if (!canLog(habit, date)) throw new Error("Šios dienos įrašo keisti negalima.");
  await result(supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("local_date", date));
}
