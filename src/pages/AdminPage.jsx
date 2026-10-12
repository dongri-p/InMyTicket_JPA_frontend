import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

// datetime-local 입력값(2026-11-01T19:30) → 서버 형식(2026-11-01 19:30:00)
const toServerDateTime = (value) => `${value.replace('T', ' ')}:00`;

// datetime-local의 min 값. toISOString()은 UTC라 한국 시간과 9시간 어긋나서 직접 만듦
function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleForm({ halls }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [hallId, setHallId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [seatCount, setSeatCount] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const hall = halls.find((h) => String(h.hallId) === hallId);

  const searchPerformances = async () => {
    setError('');
    try {
      const response = await axiosInstance.get('/api/v1/performances', {
        params: { keyword: keyword.trim() || undefined, size: 10 },
      });
      setResults(response.data.data);
    } catch (err) {
      setError(errorMessage(err, '공연 검색에 실패했습니다.'));
    }
  };

  // 검색창에서 Enter를 누르면 회차 등록이 아니라 검색이 되도록
  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchPerformances();
    }
  };

  // 공연장을 고르면 좌석 수 기본값을 그 공연장 정원으로
  const handleHallChange = (e) => {
    const selected = halls.find((h) => String(h.hallId) === e.target.value);
    setHallId(e.target.value);
    setSeatCount(selected ? String(selected.totalSeats) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!performance) {
      setError('공연을 먼저 선택하세요.');
      return;
    }
    setError('');
    setCreated(null);
    setIsSaving(true);
    try {
      await axiosInstance.post('/api/v1/schedules', {
        performanceId: performance.id,
        hallId: Number(hallId),
        startTime: toServerDateTime(startTime),
        totalSeatCount: Number(seatCount),
      });
      setCreated({ performance, startTime: toServerDateTime(startTime).slice(0, 16) });
      setStartTime('');
    } catch (err) {
      setError(errorMessage(err, '회차 등록에 실패했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-card">
      <h2>회차 등록</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="performanceKeyword">공연</label>
          {performance ? (
            <div className="admin-selected">
              <span>{performance.title}</span>
              <button type="button" className="link-button" onClick={() => setPerformance(null)}>변경</button>
            </div>
          ) : (
            <>
              <div className="admin-search">
                <input
                  id="performanceKeyword"
                  placeholder="공연 제목 (비우면 전체)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  maxLength={50}
                />
                <button type="button" onClick={searchPerformances}>검색</button>
              </div>
              {results && results.length === 0 && <p className="admin-hint">검색 결과가 없습니다.</p>}
              {results && results.length > 0 && (
                <ul className="admin-results">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="link-button" onClick={() => setPerformance(p)}>
                        {p.title}
                      </button>
                      <span className="admin-hint"> {p.category} · {p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="hallId">공연장</label>
          {halls.length === 0 ? (
            <p className="admin-hint">등록된 공연장이 없습니다. 아래에서 먼저 공연장을 등록하세요.</p>
          ) : (
            <select id="hallId" value={hallId} onChange={handleHallChange} required>
              <option value="">선택하세요</option>
              {halls.map((h) => (
                <option key={h.hallId} value={h.hallId}>
                  {h.name} (정원 {h.totalSeats}석)
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="startTime">시작 시간</label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            min={nowForInput()}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="seatCount">좌석 수{hall && ` (최대 ${hall.totalSeats}석)`}</label>
          <input
            id="seatCount"
            type="number"
            value={seatCount}
            min={1}
            max={hall?.totalSeats}
            onChange={(e) => setSeatCount(e.target.value)}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}
        {created && (
          <p role="status" className="admin-success">
            {created.performance.title} {created.startTime} 회차를 등록했습니다.{' '}
            <Link to={`/performances/${created.performance.id}`}>공연 화면에서 보기</Link>
          </p>
        )}

        <button type="submit" disabled={isSaving}>
          {isSaving ? '등록 중...' : '회차 등록'}
        </button>
      </form>
    </section>
  );
}

function AdminPage() {
  const [halls, setHalls] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get('/api/v1/halls')
      .then((response) => setHalls(response.data.data))
      .catch((err) => setError(errorMessage(err, '공연장 목록을 불러오지 못했습니다.')));
  }, []);

  return (
    <div className="admin">
      <h1>관리자</h1>
      {error && <p role="alert">{error}</p>}
      <ScheduleForm halls={halls} />
    </div>
  );
}

export default AdminPage;
