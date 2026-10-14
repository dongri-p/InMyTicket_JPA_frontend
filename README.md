# InMyTicket Frontend

[![Frontend CI](https://github.com/dongri-p/InMyTicket_JPA_frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/dongri-p/InMyTicket_JPA_frontend/actions/workflows/ci.yml)

티켓 예매 사이트 InMyTicket의 React 화면입니다. 프로젝트 전체 소개와 백엔드에서 고민한 내용은 [백엔드 README](https://github.com/dongri-p/InMyTicket_JPA)에 있습니다.

**데모: https://inmyticket.duckdns.org**

로그인 화면의 "체험 계정으로 둘러보기" 버튼을 누르면 가입 없이 써볼 수 있습니다. 결제는 실제로 청구되지 않는 가상 결제입니다.

![공연 상세 화면](docs/images/performance-detail.jpg)

## 기술 스택

React 19, Vite, React Router, Axios, oxlint

## 화면

| 경로 | 화면 | 로그인 필요 |
| --- | --- | --- |
| `/login` | 로그인 (체험 계정 버튼) | - |
| `/signup` | 회원가입 | - |
| `/` | 공연 목록 (`?genre=` 장르, `?keyword=` 검색, `?status=` 예매 상태) | O |
| `/performances/:performanceId` | 공연 상세 (기간·장소·지도 링크), 회차 선택 | O |
| `/seats/:scheduleId` | 좌석 선택, 예매 | O |
| `/payment/result` | 결제 결과 | O |
| `/my-reservations` | 내 예매 목록, 예매 취소 | O |
| `/admin` | 공연장·회차 등록, KOPIS 동기화 | 관리자 |

## 만들면서 신경 쓴 것

- **로그인 처리**: JWT는 `localStorage`에 저장하고, Axios 인터셉터가 요청마다 `Authorization` 헤더를 붙입니다. 토큰이 만료됐으면 보내기 전에 지우고, 로그인이 필요한 화면은 `RequireAuth`가 로그인 화면으로 보냅니다.
- **결제 요청이 두 번 나가지 않게**: 개발 모드의 StrictMode에서는 `useEffect`가 두 번 실행됩니다. 그래서 결제 화면에 들어오면 결제 요청이 두 번 나갔습니다. `useRef`로 이미 요청했는지 기억해서 한 번만 보내게 했습니다.
- **좌석 선택**: 처음엔 라디오 버튼 목록이었는데, 좌석 배치가 눈에 보이게 그리드로 바꿨습니다. 이미 예약된 좌석은 회색으로 막고, 고른 좌석의 번호와 가격을 아래에 보여줍니다.
- **예매 취소**: 결제 대기·결제 완료 상태에서 공연 시작 전일 때만 취소 버튼을 보여줍니다. 결제 완료 건은 환불 통신 때문에 1.5초 정도 걸려서, 그동안 버튼을 막아 두 번 눌리지 않게 했습니다.
- **장르와 검색은 URL로**: 장르 메뉴, 검색어, 예매 상태 필터를 `?genre=`, `?keyword=`, `?status=` 쿼리로 들고 있어서, 새로고침하거나 뒤로 가도 같은 목록이 나오고 검색창에도 검색어가 다시 채워집니다. 공연 상세의 "다른 공연 둘러보기"도 보던 장르·검색 목록으로 돌아갑니다.
- **테스터 피드백 반영**: 지인들에게 써 보게 하고 받은 의견을 고쳤습니다. 이미 시작한 회차는 좌석 선택까지 가지 않도록 "마감"으로 막고, 끝난 공연은 목록 배지와 상세에 "공연종료"로 보여줍니다. 오픈예정 공연도 언제 하는지 알 수 있게 카드에 공연 기간을 넣었고, 회원가입 아이디는 영문·숫자만 받습니다(서버도 같은 규칙으로 검사).
- **관리자 화면**: 관리자도 같은 로그인 화면을 씁니다. JWT에 들어 있는 role로 헤더의 "관리자" 메뉴를 보여주고 `RequireAdmin`이 일반 회원을 돌려보내지만, 이건 표시용이고 실제 권한 검사는 서버가 합니다.
- **회차 날짜 입력**: 회차 시작 시간은 지금 이후이면서 공연 기간 안에서만 고를 수 있게 `datetime-local`에 `min`/`max`를 걸었습니다. `toISOString()`은 UTC라 한국 시간과 9시간 어긋나서, 로컬 시간으로 직접 문자열을 만듭니다.
- **HTTP에서 흰 화면**: 결제 키를 만들 때 쓴 `crypto.randomUUID()`가 HTTPS나 localhost에서만 동작해서, IP(HTTP)로 배포했을 때 결제 화면이 흰 화면이 됐습니다. `crypto.getRandomValues()`로 대신 만들도록 하고, 서비스도 HTTPS로 옮겼습니다.

## 로컬 실행

백엔드(`http://localhost:8080`)를 먼저 띄운 뒤 실행합니다.

```bash
npm install
npm run dev
```

API 주소는 `VITE_API_BASE_URL`로 바꿀 수 있고, 없으면 `http://localhost:8080`을 씁니다.

## 빌드와 배포

`Dockerfile`은 Node로 빌드한 정적 파일을 Nginx로 서빙합니다. `VITE_API_BASE_URL`은 빌드할 때 번들에 들어가서 build arg로 넘깁니다.

`main`에 push하면 GitHub Actions에서 lint와 빌드를 통과한 경우에만 이미지를 GHCR에 올리고, EC2가 그 이미지를 받아 배포합니다. 운영에서는 이 저장소의 `nginx.conf` 대신 [InMyTicket_deploy](https://github.com/dongri-p/InMyTicket_deploy)의 설정(HTTPS, `/api` 프록시)을 씁니다.

## 아쉬운 점

- 공연 목록에 지역 필터와 날짜순 정렬은 없습니다.
- 공연장 위치는 지도를 직접 띄우지 않고, 공연장 이름으로 네이버 지도를 검색하는 링크만 둡니다.
- 결제는 버튼을 누르면 바로 가상 승인되고, 실제 PG 결제창 같은 단계는 없습니다.
- 토큰을 `localStorage`에 두고 있어서 XSS에 취약할 수 있습니다. httpOnly 쿠키 방식은 적용하지 않았습니다.
