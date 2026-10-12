import { useEffect, useRef, useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import { getTasks, deleteTask, updateTaskTitle } from "./tasksApi";
import { loginUser, registerUser, restoreSession, logoutUser } from "./authApi";
import "./App.css";

function App() {
  const activeUserId = useRef(null);
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [activePage, setActivePage] = useState("home");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isLoggedIn = Boolean(user);
  const [loginError, setLoginError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");

  async function loadTasks(userId = activeUserId.current) {
    if (!userId) return;
    setTasksLoading(true);
    setTasksError("");
    try {
      const savedTasks = await getTasks(userId);
      if (activeUserId.current === userId) setTasks(savedTasks);
    } catch (error) {
      if (activeUserId.current === userId) setTasksError(`Nepavyko užkrauti užduočių. ${error.message}`);
    } finally {
      if (activeUserId.current === userId) setTasksLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    restoreSession().then(async (savedUser) => {
      if (cancelled) return;
      activeUserId.current = savedUser?.id ?? null;
      setUser(savedUser);
      if (savedUser) {
        setTasksLoading(true);
        try {
          const savedTasks = await getTasks(savedUser.id);
          if (!cancelled && activeUserId.current === savedUser.id) setTasks(savedTasks);
        } catch (error) {
          if (!cancelled) setTasksError("Nepavyko užkrauti užduočių. " + error.message);
        } finally {
          if (!cancelled) setTasksLoading(false);
        }
      }
    }).catch((error) => {
      if (!cancelled) setLoginError("Nepavyko atkurti prisijungimo. " + error.message);
    }).finally(() => {
      if (!cancelled) setSessionLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (authLoading) return;
    setLoginError("");
    setAuthMessage("");
    setAuthLoading(true);
    try {
      if (isRegistering) {
        if (password !== confirmPassword) throw new Error("Slaptažodžiai nesutampa.");
        await registerUser(username, password);
        setIsRegistering(false);
        setPassword("");
        setConfirmPassword("");
        setAuthMessage("Registracija sėkminga. Prisijunkite.");
      } else {
        const savedUser = await loginUser(username, password);
        activeUserId.current = savedUser.id;
        setTasks([]);
        setUser(savedUser);
        setPassword("");
        setActivePage("home");
        await loadTasks(savedUser.id);
      }
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    try {
      logoutUser();
    } catch {
      setLoginError("Nepavyko išvalyti prisijungimo. Patikrinkite naršyklės saugyklos nustatymus.");
      return;
    }
    activeUserId.current = null;
    setUser(null);
    setTasksLoading(false);
    setTasks([]);
    setTasksError("");
    setActivePage("home");
    setPassword("");
    setAuthMessage("");
    setLoginError("");
  }

  function handleAddTask(newTask) {
    if (newTask.userId === activeUserId.current) {
      setTasks((currentTasks) => [...currentTasks, newTask]);
    }
  }

  async function handleDeleteTask(taskId) {
    const ownerId = activeUserId.current;
    await deleteTask(taskId, ownerId);
    if (activeUserId.current !== ownerId) return;
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  async function handleTaskTitleChange(taskId, title) {
    const ownerId = activeUserId.current;
    const savedTitle = await updateTaskTitle(taskId, title, ownerId);
    if (activeUserId.current !== ownerId) return;
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, title: savedTitle } : task,
      ),
    );
  }

  function handleTaskStatusChange(taskId, status) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );
  }

  function handleTaskDeadlineChange(taskId, deadline) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, deadline } : task,
      ),
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedTaskCount = tasks.filter(
    (task) => task.status === "Atlikta",
  ).length;
  const overdueTaskCount = tasks.filter((task) => {
    if (task.status === "Atlikta" || !task.deadline) return false;

    const deadline = new Date(`${task.deadline}T00:00:00`);
    return deadline < today;
  }).length;

  return (
    <>
      <Navbar activePage={isLoggedIn ? activePage : "home"} onNavigate={(page) => setActivePage(isLoggedIn ? page : "home")} />

      {(!isLoggedIn || activePage === "home") && (
        <>
          {isLoggedIn && (
            <header className="welcome-message">
              <h1>Sveiki sugrįžę!</h1>
              <p>Prisijungėte kaip {user.username}.</p>
              <button type="button" className="auth-toggle" onClick={handleLogout}>Atsijungti</button>
            </header>
          )}

          <main className="login-page">
            {sessionLoading && <p role="status">Tikrinamas prisijungimas…</p>}
            {!sessionLoading && !isLoggedIn && (
              <div className="login-card">
                <>
                  <header className="login-card__header">
                    <h1>{isRegistering ? "Registruotis" : "Prisijungti"}</h1>
                    <p>Įveskite savo duomenis, kad tęstumėte</p>
                  </header>

                  <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-field">
                      <span>Vartotojo vardas</span>
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="Vartotojo vardas"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                      />
                    </label>

                    <label className="login-field">
                      <span>Slaptažodis</span>
                      <input
                        type="password"
                        name="password"
                        autoComplete={isRegistering ? "new-password" : "current-password"}
                        minLength={isRegistering ? 8 : undefined}
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </label>

                    {isRegistering && (
                      <label className="login-field">
                        <span>Pakartokite slaptažodį</span>
                        <input type="password" name="confirmPassword" autoComplete="new-password"
                          value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
                      </label>
                    )}
                    <button type="submit" className="login-submit" disabled={authLoading}>
                      {authLoading ? "Palaukite…" : isRegistering ? "Registruotis" : "Prisijungti"}
                    </button>
                    <button type="button" className="auth-toggle" disabled={authLoading} onClick={() => {
                      setIsRegistering(!isRegistering);
                      setLoginError("");
                      setAuthMessage("");
                      setPassword("");
                      setConfirmPassword("");
                    }}>
                      {isRegistering ? "Jau turite paskyrą? Prisijunkite" : "Neturite paskyros? Registruokitės"}
                    </button>
                    {authMessage && <p className="auth-message" role="status">{authMessage}</p>}

                    {loginError && (
                      <p className="login-error" role="alert">
                        {loginError}
                      </p>
                    )}
                  </form>
                </>
              </div>
            )}

            {isLoggedIn && (
              <>
                <section className="dashboard-summary" aria-label="Užduočių suvestinė">
                  <p>
                    <strong>{tasks.length} užduotys</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{completedTaskCount} atliktos</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{overdueTaskCount} vėluoja</strong>
                  </p>
                </section>

                {tasksError ? (
                  <section className="task-card">
                    <p className="login-error" role="alert">{tasksError}</p>
                    <button type="button" className="login-submit" onClick={() => loadTasks()}>
                      Bandyti dar kartą
                    </button>
                  </section>
                ) : (
                  <TaskList
                    tasks={tasks}
                    loading={tasksLoading}
                    onStatusChange={handleTaskStatusChange}
                    onDeadlineChange={handleTaskDeadlineChange}
                    onDelete={handleDeleteTask}
                    onTitleChange={handleTaskTitleChange}
                  />
                )}

                {!tasksLoading && !tasksError && (
                  <AddTaskForm key={user.id} userId={user.id} onAddTask={handleAddTask} />
                )}

                <ProgressBar initialProgress={50} />
              </>
            )}
          </main>
        </>
      )}

      {isLoggedIn && activePage === "profile" && (
        <>
          <Profile user={user} tasks={tasks} />
          <button type="button" className="auth-toggle" onClick={handleLogout}>Atsijungti</button>
        </>
      )}
    </>
  );
}

export default App;
