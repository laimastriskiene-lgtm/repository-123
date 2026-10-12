import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
let configError = "";
if (!url || !key) {
  configError = "Trūksta Supabase konfigūracijos. Užpildykite VITE_SUPABASE_URL ir VITE_SUPABASE_ANON_KEY faile .env.local ir paleiskite serverį iš naujo.";
} else {
  try {
    if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error();
    if (key.startsWith("sb_secret_")) throw new Error();
    const payload = key.split(".")[1];
    if (payload) {
      const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      if (claims.role === "service_role") throw new Error();
    }
  } catch {
    configError = "Netinkama Supabase konfigūracija. Naudokite projekto URL ir tik viešą publishable arba anon raktą.";
  }
}
export const supabaseConfigError = configError;
export const supabase = configError ? null : createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
