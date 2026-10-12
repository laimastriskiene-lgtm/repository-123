import { useRef, useState } from "react";
import TaskActions from "./TaskActions";
import "./TaskCard.css";

const STATUS_STYLES = {
  Suplanuota: "planned",
  Vykdoma: "in-progress",
  Atlikta: "completed",
};

function TaskCard({ task, onStatusChange, onDeadlineChange, onDelete, onTitleChange }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const status = Object.hasOwn(STATUS_STYLES, task.status) ? task.status : "Suplanuota";

  async function handleStatusChange(event) {
    const nextStatus = event.target.value;
    if (savingRef.current || nextStatus === status || !onStatusChange) return;
    savingRef.current = true;
    setIsSaving(true);
    setError("");
    try {
      await onStatusChange(task.id, nextStatus);
    } catch (saveError) {
      setError(`Nepavyko išsaugoti būsenos. ${saveError.message}`);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <article className={`task-item-card task-item-card--${STATUS_STYLES[status]}`} aria-busy={isSaving}>
      <div className="task-item-card__top">
        <h3>{task.title}</h3>
        <label className="task-item-card__status-field">
          <span className="task-item-card__label">Būsena</span>
          <select className="task-item-card__status" value={status} onChange={handleStatusChange}
            disabled={isSaving || !onStatusChange} aria-label={`Keisti užduoties „${task.title}“ būseną`}>
            <option value="Suplanuota">Suplanuota</option>
            <option value="Vykdoma">Vykdoma</option>
            <option value="Atlikta">Atlikta</option>
          </select>
        </label>
      </div>

      <fieldset className="task-item-card__details" disabled={isSaving}>
        <legend className="visually-hidden">Užduoties veiksmai</legend>
        <label className="task-item-card__deadline">
          <span>Terminas:</span>
          <input type="date" value={task.deadline || ""}
            onChange={(event) => onDeadlineChange?.(task.id, event.target.value)}
            disabled={!onDeadlineChange} aria-label={`Keisti užduoties „${task.title}“ terminą`} />
        </label>
        <TaskActions task={task} onDelete={onDelete} onTitleChange={onTitleChange} />
      </fieldset>
      {isSaving && <p className="task-item-card__message" role="status">Saugoma būsena…</p>}
      {error && <p className="task-item-card__error" role="alert">{error}</p>}
    </article>
  );
}

export default TaskCard;
