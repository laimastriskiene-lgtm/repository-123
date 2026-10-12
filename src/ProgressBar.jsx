import "./ProgressBar.css";

export default function ProgressBar({ title = "Progresas", done, total }) {
  const percent = total ? Math.round(done / total * 100) : null;
  return <section className="progress-card">
    <div className="progress-card__top"><div><h2>{title}</h2><p>{done} / {total} suplanuotos dienos</p></div>
      <span className="progress-card__percentage">{percent === null ? "Netaikoma" : percent + "%"}</span></div>
    {percent !== null && <div className="habit-progress" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <span style={{ width: percent + "%" }} /></div>}
  </section>;
}
