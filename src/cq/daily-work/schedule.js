function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function dayNumber(value) {
  const parts = value.split('-').map(Number);
  return Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000;
}

// A calendar-assigned week takes priority. An authored-but-unscheduled week is only safe to
// show when it is the single such week for this track.
export function currentWeek(content, track, todayIso) {
  const weeks = content && content[track] && content[track].weeks
    ? Object.keys(content[track].weeks).map((id) => content[track].weeks[id]) : [];
  if (!validDay(todayIso)) return null;
  const today = dayNumber(todayIso);
  const assigned = weeks.find((week) => week && validDay(week.assignedWeekOf)
    && today >= dayNumber(week.assignedWeekOf) && today <= dayNumber(week.assignedWeekOf) + 4);
  if (assigned) return assigned;
  const unscheduled = weeks.filter((week) => week && week.assignedWeekOf === null);
  return unscheduled.length === 1 ? unscheduled[0] : null;
}

export function weekdayKey(todayIso) {
  if (!validDay(todayIso)) return null;
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(`${todayIso}T12:00:00`).getDay()];
}
