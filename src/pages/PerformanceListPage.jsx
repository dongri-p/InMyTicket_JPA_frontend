import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

function PerformanceListPage() {
  const [performances, setPerformances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get('/api/v1/performances', { params: { page: 0, size: 20 } })
      .then((response) => {
        setPerformances(response.data.data);
      })
      .catch(() => {
        setError('공연 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>공연 목록</h1>
      {performances.length === 0 && <p>등록된 공연이 없습니다.</p>}
      <ul className="poster-grid">
        {performances.map((p) => (
          <li key={p.id} className="poster-card">
            <Link to={`/performances/${p.id}`}>
              <div className="poster-thumb">
                {p.posterUrl ? (
                  <img src={p.posterUrl} alt="" loading="lazy" className="poster-image" />
                ) : (
                  <div className="poster-image poster-empty">포스터 준비 중</div>
                )}
                {p.upcomingScheduleCount > 0 ? (
                  <span className="booking-badge booking-badge-open">예매중</span>
                ) : (
                  <span className="booking-badge">오픈예정</span>
                )}
              </div>
              <strong className="poster-title">{p.title}</strong>
            </Link>
            <p className="poster-meta">
              {p.category}
              <span className="poster-status">{p.status}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PerformanceListPage;