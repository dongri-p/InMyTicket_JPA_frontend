// 공연 종료 판단용 오늘 날짜 'yyyy-MM-dd' (서버의 endDate와 같은 형식이라 문자열 비교로 충분)
// toISOString()은 UTC 기준이라 한국 시간 오전 9시 전엔 어제 날짜가 되므로 로컬 날짜로 직접 만듦
export function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 종료일이 오늘보다 이전이면 끝난 공연 (종료일을 모르면 끝나지 않은 것으로 봄)
export function isEnded(performance, today = todayString()) {
  return Boolean(performance.endDate) && performance.endDate < today;
}
