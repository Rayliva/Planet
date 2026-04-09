import { Link } from 'react-router-dom';

export default function ToolCard({ id, name, description, icon, color }) {
  return (
    <Link
      to={`/tool/${id}`}
      className="group block rounded-card p-6 no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ backgroundColor: `${color}15`, borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform duration-200">{icon}</span>
        <div>
          <h3 className="font-semibold text-ink text-base mb-1">{name}</h3>
          <p className="text-ink-muted text-sm leading-relaxed m-0">{description}</p>
        </div>
      </div>
    </Link>
  );
}
