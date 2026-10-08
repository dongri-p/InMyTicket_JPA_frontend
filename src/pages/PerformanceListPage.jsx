import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { genreLabel } from '../constants/genres';

const PAGE_SIZE = 20;

function PerformanceListPage() {
  const [searchParams] = useSearchParams();
  const genre = searchParams.get('genre') || '';
  const [performances, setPerformances] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = (pageToLoad) =>
    axiosInstance.get('/api/v1/performances', {
      params: { page: pageToLoad, size: PAGE_SIZE, genre: genre || undefined },
    });

  // 장르가 바뀌면 첫 페이지부터 다시 조회
  useEffect(() => {
    // 장르를 빠르게 바꿨을 때 늦게 도착한 이전 장르 응답이 화면을 덮어쓰지 않도록 무시
    let ignore = false;
    setIsLoading(true);
    setError('');

    fetchPage(0)
      .then((response) => {
        if (ignore) return;
        setPerformances(response.data.data);
        setTotalCount(response.data.totalCount);
        setPage(0);
      })
      .catch(() => {
        if (!ignore) setError('공연 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre]);

  const loadMore = () => {
    setIsLoadingMore(true);
    fetchPage(page + 1)
      .then((response) => {
        setPerformances((prev) => [...prev, ...response.data.data]);
        setPage(page + 1);
      })
      .catch(() => {
        setError('공연 목록을 더 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  if (isLoading) return <p>로딩 중...</p>;
  if (error && performances.length === 0) return <p role="alert">{error}</p>;

  const title = genre ? genreLabel(genre) ?? '공연 목록' : '전체 공연';

  return (
    <div>
      <h1 className="list-title">
        {title} <span className="list-count">{totalCount}</span>
      </h1>
      {performances.length === 0 && <p className="list-empty">이 장르에는 아직 등록된 공연이 없어요.</p>}
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
      {error && <p role="alert">{error}</p>}
      {performances.length < totalCount && (
        <button type="button" className="load-more" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? '불러오는 중...' : `더 보기 (${performances.length}/${totalCount})`}
        </button>
      )}
    </div>
  );
}

export default PerformanceListPage;