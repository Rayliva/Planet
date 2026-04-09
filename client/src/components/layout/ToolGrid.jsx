import ToolCard from './ToolCard.jsx';

export default function ToolGrid({ title, subtitle, tools }) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-ink-muted mt-1">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} {...tool} />
        ))}
      </div>
    </section>
  );
}
