import { TimePeriod } from '../types';

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTimePeriod(date: Date = new Date()): TimePeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 16) return 'daytime';
  return 'evening';
}

export function getTargetDate(date: Date = new Date()): string {
  const period = getTimePeriod(date);
  if (period === 'morning') {
    // Morning → yesterday's diary
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return toDateString(yesterday);
  }
  // Evening or daytime → today's diary
  return toDateString(date);
}

export function formatDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sun, 1=Mon, ..., 6=Sat
  return new Date(year, month - 1, 1).getDay();
}

export function formatMonthJa(year: number, month: number): string {
  return `${year}年${month}月`;
}

// "6月27日" — compact, no year. Used alongside a relative label.
export function formatMonthDayJa(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}月${parseInt(d)}日`;
}

// Returns a friendly diary title and an optional sub-date string.
//   today     → { title: '今日の日記',    sub: '6月27日' }
//   yesterday → { title: '昨日の日記',    sub: '6月26日' }
//   other     → { title: '6月25日の日記', sub: null }
export function getDiaryDateInfo(
  targetDate: string,
): { title: string; sub: string | null } {
  const today = toDateString(new Date());
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = toDateString(yd);
  const md = formatMonthDayJa(targetDate);

  if (targetDate === today) return { title: '今日の日記', sub: md };
  if (targetDate === yesterday) return { title: '昨日の日記', sub: md };
  return { title: `${md}の日記`, sub: null };
}
