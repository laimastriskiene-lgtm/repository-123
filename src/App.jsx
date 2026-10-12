import { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import AuthForm from "./AuthForm";
import HabitTracker from "./HabitTracker";
import { restoreSession, logoutUser } from "./authApi";
import { supabase, supabaseConfigError } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [auth, setAuth] = useState({ user: null, epoch: 0 });
  const [sessionLoading, setSessionLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");
  const [page, setPage] = useState("habits");
  const [loggingOut, setLoggingOut] = useState(false);
  const identity = useRef({ id: null, epoch: 0 });
  const logoutLock = useRef(false);
  useEffect(() => {
    if (!supabase) return;
    let disposed = false;
    let events = 0;
    function accept(session) {
      if (disposed) return;
      const id = session?.user.id || null;
      if (id !== identity.current.id) {
        identity.current = { id, epoch: identity.current.epoch + 1 };
        setPage("habits"); setError("");
      }
      setAuth({ user: session?.user || null, epoch: identity.current.epoch });
      setSessionLoading(false);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      events++;
      accept(session);
    });
    const snapshot = events;
    restoreSession().then((session) => { if (events === snapshot) accept(session); }).catch((failure) => {
      if (!disposed && events === snapshot) { setError("Nepavyko atkurti sesijos. " + failure.message); setSessionLoading(false); }
    });
    return () => { disposed = true; subscription.unsubscribe(); };
  }, []);
  async function logout() {
    if (logoutLock.current) return;
    logoutLock.current = true; setLoggingOut(true); setError("");
    try { await logoutUser(); }
    catch (failure) { setError("Nepavyko atsijungti. " + failure.message); }
    finally { logoutLock.current = false; setLoggingOut(false); }
  }
  return <>
    <Navbar activePage={page} onNavigate={setPage} isLoggedIn={Boolean(auth.user)} />
    {supabaseConfigError ? <main className="login-page"><section className="login-card"><h1>Supabase konfigūracija</h1><p role="alert">{supabaseConfigError}</p></section></main> : <>
      {error && <p className="login-error app-message" role="alert">{error}</p>}
      {sessionLoading ? <p className="app-message" role="status">Tikrinama sesija…</p> :
        auth.user ? <>
          <header className="welcome-message"><p>{auth.user.email}</p><button className="auth-toggle" disabled={loggingOut} onClick={logout}>{loggingOut ? "Atsijungiama…" : "Atsijungti"}</button></header>
          <HabitTracker key={auth.user.id + ":" + auth.epoch} userId={auth.user.id} epoch={auth.epoch} identity={identity} page={page} />
        </> : <main className="login-page"><AuthForm /></main>}
    </>}
  </>;
}
