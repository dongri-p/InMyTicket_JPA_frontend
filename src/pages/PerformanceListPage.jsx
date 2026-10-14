import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { genreLabel } from '../constants/genres';

const PAGE_SIZE = 20;

// 공연 종료 판단용 오늘 날짜 'yyyy-MM-dd' (서버의 endDate와 같은 형식이라 문자열 비교로 충분)
// toISOString()은 UTC 기준이라 한국 시간 오전 9시 전엔 어제 날짜가 되므로 로컬 날짜로 직접 만듦
function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 포스터 배지: 시작 전 회차가 있으면 예매중, 종료일이 지났으면 공연종료, 나머지(기간 모름 포함)는 오픈예정
function bookingBadge(performance, today) {
  if (performance.upcomingScheduleCount > 0) {
    return <span className="booking-badge booking-badge-open">예매중</span>;
  }
  if (performance.endDate && performance.endDate < today) {
    return <span className="booking-badge booking-badge-ended">공연종료</span>;
  }
  return <span className="booking-badge">오픈예정</span>;
}

function PerformanceListPage() {
  const [searchParams] = useSearchParams();
  const genre = searchParams.get('genre') || '';
  const keyword = searchParams.get('keyword') || '';
  const [performances, setPerformances] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = (pageToLoad) =>
    axiosInstance.get('/api/v1/performances', {
      params: { page: pageToLoad, size: PAGE_SIZE, genre: genre || undefined, keyword: keyword || undefined },
    });

  // 장르나 검색어가 바뀌면 첫 페이지부터 다시 조회
  useEffect(() => {
    // 장르·검색어를 빠르게 바꿨을 때 늦게 도착한 이전 응답이 화면을 덮어쓰지 않도록 무시
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
  }, [genre, keyword]);

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

  const genreTitle = genre ? genreLabel(genre) ?? '공연 목록' : '전체 공연';
  const title = keyword ? `'${keyword}' 검색 결과` : genreTitle;
  const today = todayString();
  const emptyMessage = keyword ? '검색어와 일치하는 공연이 없어요.' : '이 장르에는 아직 등록된 공연이 없어요.';

  return (
    <div>
      <h1 className="list-title">
        {title} <span className="list-count">{totalCount}</span>
      </h1>
      {performances.length === 0 && <p className="list-empty">{emptyMessage}</p>}
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
                {bookingBadge(p, today)}
              </div>
              <strong className="poster-title">{p.title}</strong>
            </Link>
            {/* KOPIS 공연 상태(공연예정 등)는 포스터의 예매 배지와 헷갈려서 목록에선 빼고 상세 화면에만 표시 */}
            <p className="poster-meta">{p.category}</p>
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