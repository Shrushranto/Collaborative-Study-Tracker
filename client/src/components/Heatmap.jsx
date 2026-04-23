function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function intensityClass(seconds) {
  if (!seconds) return '';
  const hours = seconds / 3600;
  if (hours < 1) return 'l1';
  if (hours < 2) return 'l2';
  if (hours < 4) return 'l3';
  return 'l4';
}

export default function Heatmap({ data }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 53 weeks × 7 days, ending on today, grouped by week (column = week, row = weekday)
  const days = [];
  const totalDays = 53 * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  // Align start to Sunday so weeks line up
  const startDow = start.getDay();
  start.setDate(start.getDate() - startDow);

  const cursor = new Date(start);
  while (cursor <= today) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Group into weeks (columns)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Group weeks into month blocks so we can render each month with spacing.
  // A week belongs to the month of its earliest in-range day (start-of-week alignment).
  const monthBlocks = [];
  weeks.forEach((week) => {
    const m = week[0].getMonth();
    const y = week[0].getFullYear();
    const last = monthBlocks[monthBlocks.length - 1];
    if (last && last.month === m && last.year === y) {
      last.weeks.push(week);
    } else {
      monthBlocks.push({
        month: m,
        year: y,
        label: week[0].toLocaleString('default', { month: 'short' }),
        weeks: [week],
      });
    }
  });

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {monthBlocks.map((block, bIdx) => (
          <div key={bIdx} className="heatmap-month-block">
            <div className="heatmap-month-label">{block.label}</div>
            <div className="heatmap-month-weeks">
              {block.weeks.map((week, wIdx) => (
                <div key={wIdx} className="heatmap-week">
                  {week.map((d, dIdx) => {
                    if (d > today) return <div key={dIdx} className="heatmap-cell empty" />;
                    const key = dateKey(d);
                    const seconds = data[key] || 0;
                    const cls = intensityClass(seconds);
                    const hours = (seconds / 3600).toFixed(2);
                    return (
                      <div
                        key={dIdx}
                        className={`heatmap-cell ${cls}`}
                        title={`${key}: ${hours} hrs`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="muted text-sm">Less</span>
        <div className="heatmap-cell" />
        <div className="heatmap-cell l1" />
        <div className="heatmap-cell l2" />
        <div className="heatmap-cell l3" />
        <div className="heatmap-cell l4" />
        <span className="muted text-sm">More</span>
      </div>
    </div>
  );
}
