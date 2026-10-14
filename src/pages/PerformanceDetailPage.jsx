import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { formatPeriod, isEnded } from '../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 2026-11-21T19:00:00 -> { date: '11.21(토)', time: '19:00' }
function formatSchedule(startTime) {
  const d = new Date(startTime);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getMonth() + 1}.${pad(d.getDate())}(${WEEKDAYS[d.getDay()]})`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function PerformanceDetailPage() {
  const { performanceId } = useParams();
  const location = useLocation();
  const [performance, setPerformance] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 공연 정보와 회차 목록은 서로 의존하지 않으므로 동시에 요청
    Promise.all([
      axiosInstance.get(`/api/v1/performances/${performanceId}`),
      axiosInstance.get(`/api/v1/performances/${performanceId}/schedules`),
    ])
      .then(([performanceResponse, schedulesResponse]) => {
        setPerformance(performanceResponse.data);
        setSchedules(schedulesResponse.data.data);
      })
      .catch(() => {
        setError('공연 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [performanceId]);

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  const period = formatPeriod(performance.startDate, performance.endDate);
  const ended = isEnded(performance);
  const now = new Date();
  // 목록에서 들어왔으면 그 목록(장르·검색어 유지)으로, 주소로 바로 들어왔으면 전체 목록으로
  const listPath = `/${location.state?.listSearch ?? ''}`;

  return (
    <div className="detail">
      <div className="detail-poster">
        {performance.posterUrl ? (
          <img src={performance.posterUrl} alt={`${performance.title} 포스터`} className="poster-image" />
        ) : (
          <div className="poster-image poster-empty">포스터 준비 중</div>
        )}
      </div>

      <div className="detail-body">
        <p className="detail-tags">
          <span className="detail-category">{performance.category}</span>
          <span className="poster-status">{performance.status}</span>
        </p>
        <h1 className="detail-title">{performance.title}</h1>

        {(period || performance.venueName) && (
          <dl className="detail-info">
            {period && (
              <>
                <dt>기간</dt>
                <dd>{period}</dd>
              </>
            )}
            {performance.venueName && (
              <>
                <dt>장소</dt>
                <dd>
                  {performance.venueName}
                  {/* KOPIS는 공연장 이름만 줘서 정확한 주소 대신 네이버 지도 검색으로 연결 (API 키 불필요)
                      '소극장 마당 [대전]'의 지역 표기는 검색에 도움이 되므로 괄호만 뺌 */}
                  <a
                    href={`https://map.naver.com/p/search/${encodeURIComponent(performance.venueName.replace(/[[\]]/g, ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-map-link"
                  >
                    지도 보기
                  </a>
                </dd>
              </>
            )}
          </dl>
        )}

        <section className="booking-box" aria-labelledby="booking-heading">
          <h2 id="booking-heading">예매</h2>

          {schedules.length === 0 ? (
            <div className="booking-empty">
              <span className="booking-empty-icon" aria-hidden="true">🎫</span>
              {ended ? (
                <>
                  <p className="booking-empty-title">공연이 종료됐어요</p>
                  <p className="booking-empty-desc">{performance.endDate.replaceAll('-', '.')}에 끝난 공연이에요.</p>
                  <button type="button" disabled>공연 종료</button>
                </>
              ) : (
                <>
                  <p className="booking-empty-title">아직 예매 가능한 회차가 없어요</p>
                  <p className="booking-empty-desc">회차가 오픈되면 여기서 바로 예매할 수 있어요.</p>
                  <button type="button" disabled>예매 오픈 예정</button>
                </>
              )}
              <Link to={listPath} className="booking-empty-link">다른 공연 둘러보기 →</Link>
            </div>
          ) : (
            <ul className="schedule-list">
              {schedules.map((s) => {
                const { date, time } = formatSchedule(s.startTime);
                // 이미 시작한 회차는 서버가 예약을 거절하므로, 좌석 선택까지 들어가지 않도록 여기서 막음
                const started = new Date(s.startTime) <= now;
                const soldOut = s.availableSeatCount === 0;
                return (
                  <li key={s.scheduleId} className="schedule-item">
                    <div>
                      <strong>{date}</strong> <span className="schedule-time">{time}</span>
                      <p className="schedule-seats">
                        잔여 {s.availableSeatCount}/{s.totalSeatCount}석
                      </p>
                    </div>
                    {started ? (
                      <span className="schedule-soldout">마감</span>
                    ) : soldOut ? (
                      <span className="schedule-soldout">매진</span>
                    ) : (
                      <Link to={`/seats/${s.scheduleId}`} className="schedule-select">
                        선택
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default PerformanceDetailPage;
