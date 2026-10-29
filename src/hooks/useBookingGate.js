import { useCallback, useEffect, useState } from 'react';
import { fetchBookingGate } from '../api/bookingQueue';

// 대기 중일 때 순번을 다시 물어보는 주기
const POLL_MS = 2000;

// 좌석 선택 화면의 예매 관문: 오픈 전 / 대기 중 / 입장 / 바로 예매. 대기 중이면 2초마다 다시 확인
export function useBookingGate(scheduleId) {
  const [status, setStatus] = useState({ state: 'LOADING' });

  const refresh = useCallback(() => fetchBookingGate(scheduleId).then(setStatus), [scheduleId]);

  useEffect(() => {
    let active = true;
    fetchBookingGate(scheduleId).then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, [scheduleId]);

  useEffect(() => {
    if (status.state !== 'WAITING') return undefined;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [status.state, refresh]);

  return { ...status, refresh };
}
