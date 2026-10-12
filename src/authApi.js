import { supabase, supabaseConfigError } from "./supabaseClient";

function client() {
  if (!supabase) throw new Error(supabaseConfigError);
  return supabase;
}
export async function loginUser(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}
export async function registerUser(email, password) {
  const { data, error } = await client().auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return data;
}
export async function restoreSession() {
  const { data, error } = await client().auth.getSession();
  if (error) throw error;
  return data.session;
}
export async function logoutUser() {
  const { error } = await client().auth.signOut();
  if (error) throw error;
}
