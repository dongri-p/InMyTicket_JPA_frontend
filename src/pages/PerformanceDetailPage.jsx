import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

function PerformanceDetailPage() {
  const { performanceId } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get(`/api/v1/performances/${performanceId}/schedules`)
      .then((response) => {
        setSchedules(response.data.data);
      })
      .catch(() => {
        setError('회차 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [performanceId]);

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>회차 선택</h1>
      {schedules.length === 0 && <p>등록된 회차가 없습니다.</p>}
      <ul>
        {schedules.map((s) => (
          <li key={s.scheduleId}>
            <Link to={`/seats/${s.scheduleId}`}>
              {new Date(s.startTime).toLocaleString()} (잔여 {s.availableSeatCount}/{s.totalSeatCount})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PerformanceDetailPage;