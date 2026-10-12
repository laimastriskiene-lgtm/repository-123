import { useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import { getTasks, deleteTask, updateTaskTitle } from "./tasksApi";
import "./App.css";

function App() {
  const user = {
    name: "Jonas Jonaitis",
    email: "jonas@flowly.lt",
  };

  const [activePage, setActivePage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");

  async function loadTasks() {
    setTasksLoading(true);
    setTasksError("");
    try {
      const savedTasks = await getTasks();
      setTasks(savedTasks);
    } catch (error) {
      setTasksError(`Nepavyko užkrauti užduočių. ${error.message}`);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (email === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setLoginError("");
      await loadTasks();
      return;
    }

    setLoginError("Neteisingas vartotojo vardas arba slaptažodis.");
  }

  function handleAddTask(newTask) {
    setTasks((currentTasks) => [...currentTasks, newTask]);
  }

  async function handleDeleteTask(taskId) {
    await deleteTask(taskId);
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  async function handleTaskTitleChange(taskId, title) {
    const savedTitle = await updateTaskTitle(taskId, title);
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
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      {activePage === "home" && (
        <>
          {isLoggedIn && (
            <header className="welcome-message">
              <h1>Sveiki sugrįžę!</h1>
              <p>Prisijungėte kaip admin.</p>
            </header>
          )}

          <main className="login-page">
            {!isLoggedIn && (
              <div className="login-card">
                <>
                  <header className="login-card__header">
                    <h1>Prisijungti</h1>
                    <p>Įveskite savo duomenis, kad tęstumėte</p>
                  </header>

                  <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-field">
                      <span>Vartotojo vardas</span>
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="admin"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>

                    <label className="login-field">
                      <span>Slaptažodis</span>
                      <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </label>

                    <button type="submit" className="login-submit">
                      Prisijungti
                    </button>

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
                    <button type="button" className="login-submit" onClick={loadTasks}>
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
                  <AddTaskForm onAddTask={handleAddTask} />
                )}

                <ProgressBar initialProgress={50} />
              </>
            )}
          </main>
        </>
      )}

      {activePage === "profile" && <Profile user={user} tasks={tasks} />}
    </>
  );
}

export default App;
