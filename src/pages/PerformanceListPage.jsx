import { useEffect, useState } from 'react';
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
      <ul>
        {performances.map((p) => (
          <li key={p.id}>
            <strong>{p.title}</strong> ({p.category}) - {p.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PerformanceListPage;