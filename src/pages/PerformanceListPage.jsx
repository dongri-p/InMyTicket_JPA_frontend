import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { genreLabel } from '../constants/genres';
import { formatPeriod, isEnded, todayString } from '../utils/date';

const PAGE_SIZE = 20;

// 예매 상태 필터 (?status=). key는 백엔드 BookingStatus 값과 같아야 함, ''는 전체
const STATUS_FILTERS = [
  { key: '', label: '전체' },
  { key: 'ON_SALE', label: '예매중' },
  { key: 'UPCOMING', label: '오픈예정' },
  { key: 'ENDED', label: '공연종료' },
];

// 지역 필터 (?region=). key는 백엔드 RegionGroup 값과 같아야 함, ''는 전체
const REGION_FILTERS = [
  { key: '', label: '전체' },
  { key: 'SEOUL', label: '서울' },
  { key: 'GYEONGGI_INCHEON', label: '경기·인천' },
  { key: 'CHUNGCHEONG_GANGWON', label: '충청·강원' },
  { key: 'GYEONGSANG', label: '경상' },
  { key: 'JEOLLA_JEJU', label: '전라·제주' },
];

// 주소창에 모르는 값이 들어오면 서버가 400을 주므로 아는 값만 사용 (나머지는 전체)
function knownKey(filters, value) {
  return filters.some((f) => f.key === value) ? value : '';
}

// 포스터 배지: 시작 전 회차가 있으면 예매중, 종료일이 지났으면 공연종료, 나머지(기간 모름 포함)는 오픈예정
function bookingBadge(performance, today) {
  if (performance.upcomingScheduleCount > 0) {
    return <span className="booking-badge booking-badge-open">예매중</span>;
  }
  if (isEnded(performance, today)) {
    return <span className="booking-badge booking-badge-ended">공연종료</span>;
  }
  return <span className="booking-badge">오픈예정</span>;
}

function PerformanceListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const genre = searchParams.get('genre') || '';
  const keyword = searchParams.get('keyword') || '';
  const status = knownKey(STATUS_FILTERS, searchParams.get('status') || '');
  const region = knownKey(REGION_FILTERS, searchParams.get('region') || '');
  const [performances, setPerformances] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = (pageToLoad) =>
    axiosInstance.get('/api/v1/performances', {
      params: {
        page: pageToLoad,
        size: PAGE_SIZE,
        genre: genre || undefined,
        keyword: keyword || undefined,
        status: status || undefined,
        region: region || undefined,
      },
    });

  // 장르·검색어·예매 상태·지역이 바뀌면 첫 페이지부터 다시 조회
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
  }, [genre, keyword, status, region]);

  // 다른 조건은 그대로 두고 예매 상태(status)나 지역(region) 하나만 바꿈 (URL에 남겨서 새로고침·뒤로가기에도 유지)
  const changeFilter = (name, key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set(name, key);
    else next.delete(name);
    setSearchParams(next);
  };

  const filterChips = (name, label, filters, selected) => (
    <div className="status-filter" role="group" aria-label={label}>
      <span className="filter-label">{label}</span>
      {filters.map(({ key, label: chipLabel }) => (
        <button
          key={key || 'all'}
          type="button"
          className={key === selected ? 'status-chip status-chip-active' : 'status-chip'}
          aria-pressed={key === selected}
          onClick={() => changeFilter(name, key)}
        >
          {chipLabel}
        </button>
      ))}
    </div>
  );

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
  const emptyMessage = status || region
    ? '조건에 맞는 공연이 없어요.'
    : keyword
      ? '검색어와 일치하는 공연이 없어요.'
      : '이 장르에는 아직 등록된 공연이 없어요.';

  return (
    <div>
      <h1 className="list-title">
        {title} <span className="list-count">{totalCount}</span>
      </h1>
      <div className="list-filters">
        {filterChips('status', '예매 상태', STATUS_FILTERS, status)}
        {filterChips('region', '지역', REGION_FILTERS, region)}
      </div>
      {performances.length === 0 && <p className="list-empty">{emptyMessage}</p>}
      <ul className="poster-grid">
        {performances.map((p) => (
          <li key={p.id} className="poster-card">
            {/* 상세에서 '다른 공연 둘러보기'를 누르면 보던 장르·검색 목록으로 돌아가도록 현재 쿼리를 넘김 */}
            <Link to={`/performances/${p.id}`} state={{ listSearch: location.search }}>
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
            {/* 오픈예정 공연도 언제 하는지 알 수 있게 공연 기간 표시 (기간을 모르면 생략) */}
            {formatPeriod(p.startDate, p.endDate) && (
              <p className="poster-period">{formatPeriod(p.startDate, p.endDate)}</p>
            )}
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