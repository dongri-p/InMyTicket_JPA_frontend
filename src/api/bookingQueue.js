import axiosInstance from './axiosInstance';
import { isLoggedIn } from './auth';

// 회차 예매 관문 상태 - 서버 대기열(BookingQueueService)의 state를 그대로 씀
// NOT_OPEN(오픈 전) / NO_QUEUE(바로 예매) / WAITING(줄 서는 중) / ADMITTED(입장함)
// 순번은 회원 기준이라, 로그인 전에는 오픈 전인지만 회차 정보로 보고 나머지는 예매할 때(로그인 후) 서버가 다시 막음
export async function fetchBookingGate(scheduleId) {
  try {
    if (!isLoggedIn()) {
      const { data } = await axiosInstance.get(`/api/v1/schedules/${scheduleId}`);
      const notOpen = data.bookingOpenAt && new Date(data.bookingOpenAt) > new Date();
      return notOpen ? { state: 'NOT_OPEN', bookingOpenAt: data.bookingOpenAt } : { state: 'NO_QUEUE' };
    }
    let { data } = await axiosInstance.get(`/api/v1/schedules/${scheduleId}/queue/me`);
    // 대기열 운영 중인데 아직 줄을 안 섰으면(처음 들어왔거나 입장 시간이 지남) 바로 줄을 섬
    if (data.state === 'NOT_IN_QUEUE') {
      ({ data } = await axiosInstance.post(`/api/v1/schedules/${scheduleId}/queue`));
    }
    return data;
  } catch {
    // 대기열을 확인하지 못해도 좌석은 보여줌 - 예매는 서버가 입장 여부를 다시 확인함
    return { state: 'NO_QUEUE' };
  }
}
