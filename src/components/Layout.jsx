import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../api/auth';
import logo from '../assets/logo.png';
import { GENRES } from '../constants/genres';

const BANNER_HIDDEN_KEY = 'signupBannerHidden';

function readBannerHidden() {
  try {
    return localStorage.getItem(BANNER_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

// 모든 화면이 공유하는 틀 (예전 JSP의 sitemesh default.jsp 역할): 띠 배너 + 헤더 + 장르 메뉴
function Layout() {
  const [bannerHidden, setBannerHidden] = useState(readBannerHidden);
  const navigate = useNavigate();
  // 로그인/로그아웃 후 화면이 바뀔 때 헤더 메뉴도 다시 그리도록 location 변화를 구독
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlKeyword = location.pathname === '/' ? params.get('keyword') || '' : '';
  // 장르 메뉴 선택 표시: 목록 화면('/')에서 현재 ?genre= 값과 같은 메뉴를 강조 (검색 결과 화면에선 강조 없음)
  const currentGenre = location.pathname === '/' && !urlKeyword ? params.get('genre') || '' : null;
  const loggedIn = isLoggedIn();
  const [keyword, setKeyword] = useState(urlKeyword);

  // 뒤로가기·장르 메뉴 이동 등으로 URL의 검색어가 바뀌면 입력창도 맞춰 줌
  useEffect(() => {
    setKeyword(urlKeyword);
  }, [urlKeyword]);

  // 검색은 전체 장르 대상. 결과를 URL(?keyword=)에 담아 새로고침·뒤로가기에도 유지되게 함
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    navigate(trimmed ? `/?keyword=${encodeURIComponent(trimmed)}` : '/');
  };

  const closeBanner = () => {
    setBannerHidden(true);
    try {
      localStorage.setItem(BANNER_HIDDEN_KEY, '1');
    } catch {
      // 저장이 막힌 환경이면 이번 화면에서만 닫힘
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {!loggedIn && !bannerHidden && (
        <div className="top-banner">
          <span>회원가입하고 다양한 공연을 만나보세요!</span>
          <button type="button" className="top-banner-close" onClick={closeBanner} aria-label="배너 닫기">
            ×
          </button>
        </div>
      )}

      <header className="site-header">
        <Link to="/" className="site-logo">
          <img src={logo} alt="IN MY TICKET" />
        </Link>

        <form className="search-box" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="찾고싶은 공연을 검색하세요."
            aria-label="공연 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            maxLength={50}
          />
          <button type="submit" className="search-button" aria-label="검색">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <div className="member-menu">
          {loggedIn ? (
            <>
              <Link to="/my-reservations">마이페이지</Link>
              <span aria-hidden="true">|</span>
              <button type="button" className="link-button" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <span aria-hidden="true">|</span>
              <Link to="/signup">회원가입</Link>
            </>
          )}
        </div>
      </header>

      <nav className="genre-nav">
        <ul>
          {GENRES.map(({ key, label }) => (
            <li key={label}>
              <Link
                to={key ? `/?genre=${key}` : '/'}
                className={currentGenre === key ? 'active' : undefined}
                aria-current={currentGenre === key ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="genre-brand">인마이티켓</li>
        </ul>
      </nav>

      <main className="site-main">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
