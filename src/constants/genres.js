// 헤더 장르 메뉴. key는 백엔드 GenreGroup 값(?genre=)과 같아야 함, ''는 전체
export const GENRES = [
  { key: '', label: '전체' },
  { key: 'CONCERT', label: '콘서트' },
  { key: 'MUSICAL_PLAY', label: '뮤지컬/연극' },
  { key: 'CLASSIC', label: '클래식/국악' },
  { key: 'DANCE', label: '무용' },
  { key: 'ETC', label: '기타' },
];

export function genreLabel(key) {
  return GENRES.find((g) => g.key === key)?.label;
}
