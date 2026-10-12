import { useRef, useState } from "react";
import "./TaskActions.css";

function TaskActions({ task, onDelete, onTitleChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const isBusy = pendingAction !== "";

  async function runAction(action, callback) {
    if (busyRef.current) return;
    busyRef.current = true;
    setPendingAction(action);
    setError("");
    try {
      await callback();
      if (action === "save") setIsEditing(false);
    } catch (actionError) {
      const message = action === "delete"
        ? "Nepavyko ištrinti užduoties."
        : "Nepavyko išsaugoti pavadinimo.";
      setError(`${message} ${actionError.message}`);
    } finally {
      busyRef.current = false;
      setPendingAction("");
    }
  }

  function handleSave(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Įveskite užduoties pavadinimą.");
      return;
    }
    void runAction("save", () => onTitleChange(task.id, title.trim()));
  }

  return (
    <div className="task-actions" aria-busy={isBusy}>
      {isEditing ? (
        <form className="task-actions__form" onSubmit={handleSave}>
          <label className="task-actions__field">
            <span>Pavadinimas</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isBusy}
              required
              autoFocus
            />
          </label>
          <div className="task-actions__buttons">
            <button type="submit" disabled={isBusy}>
              {pendingAction === "save" ? "Saugoma..." : "Išsaugoti"}
            </button>
            <button type="button" disabled={isBusy} onClick={() => {
              setIsEditing(false);
              setError("");
            }}>
              Atšaukti
            </button>
          </div>
        </form>
      ) : (
        <div className="task-actions__buttons">
          {onTitleChange && (
            <button type="button" disabled={isBusy} onClick={() => {
              setTitle(task.title);
              setError("");
              setIsEditing(true);
            }} aria-label={`Redaguoti užduoties „${task.title}“ pavadinimą`}>
              Redaguoti
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="task-actions__delete"
              disabled={isBusy}
              onClick={() => { void runAction("delete", () => onDelete(task.id)); }}
              aria-label={`Ištrinti užduotį „${task.title}“`}
            >
              {pendingAction === "delete" ? "Trinama..." : "Ištrinti"}
            </button>
          )}
        </div>
      )}
      {error && <p className="task-actions__error" role="alert">{error}</p>}
    </div>
  );
}

export default TaskActions;
