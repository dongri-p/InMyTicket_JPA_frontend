# InMyTicket Frontend

[![Frontend CI](https://github.com/dongri-p/InMyTicket_JPA_frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/dongri-p/InMyTicket_JPA_frontend/actions/workflows/ci.yml)

실시간 티켓 예매 서비스 **InMyTicket**의 React 프론트엔드입니다.
프로젝트 전체 소개, 아키텍처, 문제 해결 경험은 [백엔드 저장소 README](https://github.com/dongri-p/InMyTicket_JPA)에 정리되어 있습니다.

* **데모:** https://inmyticket.duckdns.org
* **배포 설정:** [InMyTicket_deploy](https://github.com/dongri-p/InMyTicket_deploy)

## 기술 스택
React 19, Vite, React Router, Axios

## 화면 구성
| 경로 | 화면 | 로그인 필요 |
| --- | --- | --- |
| `/login` | 로그인 | - |
| `/signup` | 회원가입 | - |
| `/` | 공연 목록 | O |
| `/performances/:performanceId` | 공연 상세 · 회차 선택 | O |
| `/seats/:scheduleId` | 좌석 선택 · 예매 | O |
| `/payment/result` | 결제 결과 | O |
| `/my-reservations` | 마이페이지 (내 예매 목록) | O |

* 로그인하지 않았거나 토큰이 만료되면 `RequireAuth`가 `/login`으로 보냅니다.
* JWT는 `localStorage`에 저장하고, Axios 인터셉터가 요청마다 `Authorization: Bearer` 헤더를 붙입니다. 만료된 토큰은 요청 전에 제거합니다.

## 로컬 실행
백엔드(`http://localhost:8080`)를 먼저 띄운 뒤 실행합니다.

```bash
npm install
npm run dev
```

API 주소는 `VITE_API_BASE_URL` 환경변수로 바꿀 수 있으며, 지정하지 않으면 `http://localhost:8080`을 사용합니다.

## 빌드 / 배포
`Dockerfile`은 Node로 빌드한 정적 파일을 Nginx로 서빙하는 멀티스테이지 빌드입니다. `VITE_API_BASE_URL`은 빌드 시점에 번들에 들어가므로 build arg로 넘깁니다.
운영 환경에서는 [InMyTicket_deploy](https://github.com/dongri-p/InMyTicket_deploy)의 Nginx 설정(HTTPS, `/api` 리버스 프록시)으로 이 저장소의 `nginx.conf`를 덮어씁니다.
