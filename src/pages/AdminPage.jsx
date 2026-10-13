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

// 2026-11-05 -> '11.05'
const shortDate = (date) => date.slice(5).replace('-', '.');

// 시작 시간 선택 범위: 지금 이후이면서 공연 기간(첫날 00:00 ~ 마지막 날 23:59) 안. 기간을 모르면 지금 이후만
// 같은 형식(YYYY-MM-DDTHH:mm)끼리는 문자열 비교가 곧 시간 비교라 더 늦은 쪽을 min으로 고름
function startTimeRange(performance) {
  const now = nowForInput();
  const periodStart = performance?.startDate && `${performance.startDate}T00:00`;
  return {
    min: periodStart && periodStart > now ? periodStart : now,
    max: performance?.endDate ? `${performance.endDate}T23:59` : undefined,
  };
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
  const range = startTimeRange(performance);

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
              {performance.startDate && performance.endDate && (
                <span className="admin-hint">
                  {shortDate(performance.startDate)} ~ {shortDate(performance.endDate)}
                </span>
              )}
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
                      <span className="admin-hint">
                        {' '}
                        {p.category}
                        {p.startDate && p.endDate && ` · ${shortDate(p.startDate)} ~ ${shortDate(p.endDate)}`}
                      </span>
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
            min={range.min}
            max={range.max}
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

function HallForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', address: '', totalSeats: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      await axiosInstance.post('/api/v1/halls', { ...form, totalSeats: Number(form.totalSeats) });
      setMessage(`${form.name} 공연장을 등록했습니다.`);
      setForm({ name: '', address: '', totalSeats: '' });
      onCreated();
    } catch (err) {
      setError(errorMessage(err, '공연장 등록에 실패했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-card">
      <h2>공연장 등록</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="hallName">이름</label>
          <input id="hallName" name="name" value={form.name} onChange={handleChange} maxLength={255} required />
        </div>
        <div>
          <label htmlFor="hallAddress">주소 (선택)</label>
          <input id="hallAddress" name="address" value={form.address} onChange={handleChange} maxLength={255} />
        </div>
        <div>
          <label htmlFor="hallSeats">정원</label>
          <input
            id="hallSeats"
            name="totalSeats"
            type="number"
            value={form.totalSeats}
            onChange={handleChange}
            min={1}
            max={100000}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}
        {message && <p role="status" className="admin-success">{message}</p>}

        <button type="submit" disabled={isSaving}>
          {isSaving ? '등록 중...' : '공연장 등록'}
        </button>
      </form>
    </section>
  );
}

const countPerformances = async () => {
  const response = await axiosInstance.get('/api/v1/performances', { params: { size: 1 } });
  return response.data.totalCount;
};

// 동기화 API는 KOPIS 호출이 실패해도 "완료"로 응답하므로, 전후 공연 수를 비교해서 실제 결과를 보여줌
function SyncPanel() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setError('');
    setResult('');
    setIsSyncing(true);
    try {
      const before = await countPerformances();
      await axiosInstance.post('/api/v1/performances/sync');
      const after = await countPerformances();
      setResult(
        after > before
          ? `공연 ${after - before}건을 새로 가져왔습니다. (전체 ${after}건)`
          : `새로 추가된 공연이 없습니다. (전체 ${after}건) 이미 받아온 공연이거나 KOPIS 응답이 실패했을 수 있어요.`
      );
    } catch (err) {
      setError(errorMessage(err, '동기화에 실패했습니다.'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="admin-card">
      <h2>공연 정보 동기화</h2>
      <p className="admin-hint">KOPIS에서 장르별 최신 공연을 받아와 아직 없는 공연만 추가합니다. 몇 초 걸릴 수 있어요.</p>
      {error && <p role="alert">{error}</p>}
      {result && <p role="status" className="admin-success">{result}</p>}
      <button type="button" onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? '가져오는 중...' : 'KOPIS에서 가져오기'}
      </button>
    </section>
  );
}

function AdminPage() {
  const [halls, setHalls] = useState([]);
  const [error, setError] = useState('');

  const loadHalls = () => {
    axiosInstance
      .get('/api/v1/halls')
      .then((response) => setHalls(response.data.data))
      .catch((err) => setError(errorMessage(err, '공연장 목록을 불러오지 못했습니다.')));
  };

  useEffect(loadHalls, []);

  return (
    <div className="admin">
      <h1>관리자</h1>
      {error && <p role="alert">{error}</p>}
      <ScheduleForm halls={halls} />
      <HallForm onCreated={loadHalls} />
      <SyncPanel />
    </div>
  );
}

export default AdminPage;
