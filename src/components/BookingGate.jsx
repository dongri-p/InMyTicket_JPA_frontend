import { useEffect, useState } from 'react';

// 남은 시간(ms) -> "1일 02:03:04" / "02:03"
function formatRemaining(ms, withHours = true) {
  const total = Math.max(Math.ceil(ms / 1000), 0);
  const days = Math.floor(total / 86400);
  const pad = (n) => String(n).padStart(2, '0');
  const h = pad(Math.floor((total % 86400) / 3600));
  const m = pad(Math.floor((total % 3600) / 60));
  const s = pad(total % 60);
  const clock = withHours ? `${h}:${m}:${s}` : `${m}:${s}`;
  return days > 0 ? `${days}일 ${clock}` : clock;
}

// 예매 오픈 전 - 오픈 시각까지 남은 시간. 0이 되면 1초마다 다시 확인 (서버 시계와 조금 어긋나도 열리면 넘어감)
export function OpenCountdown({ bookingOpenAt, onOpen }) {
  const openAt = new Date(bookingOpenAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= openAt) onOpen();
    }, 1000);
    return () => clearInterval(timer);
  }, [openAt, onOpen]);

  return (
    <div className="queue-box">
      <h1>예매 오픈 전</h1>
      <p className="queue-open-at">
        {new Date(bookingOpenAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        에 열려요
      </p>
      <p className="queue-big">{formatRemaining(openAt - now)}</p>
      <p className="queue-hint">오픈 직후에는 대기열 순서대로 좌석 선택 화면에 들어갑니다. 이 화면을 열어 두면 시간이 되면 자동으로 넘어가요.</p>
    </div>
  );
}

// 줄 서는 중 - 내 앞 인원과 대략적인 대기 시간
export function QueueWaiting({ position, estimatedWaitSeconds }) {
  return (
    <div className="queue-box" role="status">
      <h1>예매 대기 중</h1>
      <p>내 앞에</p>
      <p className="queue-big">{Math.max(position - 1, 0).toLocaleString()}명</p>
      <p>예상 대기 약 {formatRemaining(estimatedWaitSeconds * 1000, false)}</p>
      <p className="queue-hint">새로고침하거나 다시 들어와도 순서는 그대로예요. 차례가 되면 좌석 선택 화면으로 자동으로 넘어갑니다.</p>
    </div>
  );
}

// 입장한 뒤 - 이 시간 안에 예매해야 함 (지나면 다시 줄을 섬)
export function AdmissionBanner({ admissionExpiresInSeconds }) {
  const [deadline] = useState(() => Date.now() + admissionExpiresInSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="queue-banner" role="status">
      입장했어요. <strong>{formatRemaining(deadline - now, false)}</strong> 안에 예매해 주세요.
    </p>
  );
}
