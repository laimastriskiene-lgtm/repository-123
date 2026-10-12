import TaskCard from "./TaskCard";
import "./TaskList.css";

function TaskList({ tasks = [], loading = false, onStatusChange, onDeadlineChange, onDelete, onTitleChange }) {
  if (loading) {
    return (
      <section className="task-card">
        <p className="task-state">Kraunamos užduotys...</p>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="task-card">
        <p className="task-state">Užduočių kol kas nėra.</p>
      </section>
    );
  }

  return (
    <section className="task-card">
      <header className="task-card__header">
        <h2>Užduotys</h2>
        <p>Artimiausi darbai ir jų būsena</p>
      </header>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task}
            onStatusChange={onStatusChange} onDeadlineChange={onDeadlineChange}
            onDelete={onDelete} onTitleChange={onTitleChange} />
        ))}
      </div>
    </section>
  );
}

export default TaskList;
