// 공연 예매 상태. key는 백엔드 BookingStatus 값(응답 bookingStatus, 목록 필터 ?status=)과 같아야 함
export const BOOKING_STATUSES = [
  { key: 'ON_SALE', label: '예매중' },
  { key: 'UPCOMING', label: '오픈예정' },
  { key: 'ENDED', label: '공연종료' },
];

export function bookingStatusLabel(key) {
  return BOOKING_STATUSES.find((s) => s.key === key)?.label;
}
