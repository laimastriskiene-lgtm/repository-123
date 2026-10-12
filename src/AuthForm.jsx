import { useRef, useState } from "react";
import { loginUser, registerUser } from "./authApi";
import "./AuthForm.css";

export default function AuthForm() {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      if (registering && password !== confirmation) throw new Error("Slaptažodžiai nesutampa.");
      const data = await (registering ? registerUser(email, password) : loginUser(email, password));
      if (registering && !data.session) {
        setMessage("Patikrinkite el. paštą ir patvirtinkite registraciją. Tada prisijunkite.");
        setRegistering(false);
      }
      setPassword(""); setConfirmation("");
    } catch (failure) { setError("Nepavyko. " + failure.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="login-card auth-form">
    <h1>{registering ? "Registruotis" : "Prisijungti"}</h1>
    <p>Stebėkite savo įpročius su Flowly</p>
    <form className="login-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label className="login-field">El. paštas<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="login-field">Slaptažodis<input type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {registering && <label className="login-field">Pakartokite slaptažodį<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>}
        <button className="login-submit" type="submit">{busy ? "Palaukite…" : registering ? "Registruotis" : "Prisijungti"}</button>
        <button className="auth-toggle" type="button" onClick={() => { setRegistering(!registering); setError(""); setMessage(""); }}>{registering ? "Jau turite paskyrą? Prisijunkite" : "Neturite paskyros? Registruokitės"}</button>
      </fieldset>
    </form>
    {error && <p className="login-error" role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
