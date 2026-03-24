export function Header() {
  const userName = 'Tiffany';
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const itemCount = 4;

  return (
    <div className="animate-fade-up stagger-1">
      <h1 className="font-display italic text-3xl font-light text-text mb-2 leading-tight">
        {dayName} looks manageable, {userName}.
      </h1>
      <p className="font-ui text-sm text-muted font-light">
        {formattedDate} · {itemCount} things on today
      </p>
    </div>
  );
}
