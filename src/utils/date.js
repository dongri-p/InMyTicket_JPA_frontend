// 2026-11-05, 2026-11-08 -> '2026.11.05 ~ 2026.11.08' (하루짜리 공연은 날짜 하나만, 기간을 모르면 null)
export function formatPeriod(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const dot = (date) => date.replaceAll('-', '.');
  return startDate === endDate ? dot(startDate) : `${dot(startDate)} ~ ${dot(endDate)}`;
}
