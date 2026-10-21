import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';

// 토스페이먼츠 "주문서형, 결제창형 연동 키 > 클라이언트 키"(test_gck_). 기본값은 토스 문서에 공개된 결제위젯 테스트 키(실제 청구 없음)이고,
// 서버의 시크릿 키(TOSS_SECRET_KEY, test_gsk_)와 같은 상점의 키여야 승인이 됨.
// (예전에 쓰던 문서 공개 "API 개별 연동 키"(test_ck_)는 토스가 막아 결제창이 401로 열리지 않음)
const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

function randomHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

// 주문번호는 "imt-{예약ID}-{임의값}". 서버가 앞부분으로 이 예약의 주문인지 확인하고,
// 임의값 덕분에 결제창을 닫았다가 다시 결제해도 주문번호가 겹치지 않음
export function createOrderId(reservationId) {
  return `imt-${reservationId}-${randomHex(8)}`;
}

// 데모 결제는 결제창이 없어서 결제 키를 직접 만듦 (서버의 데모 PG가 바로 승인)
export function createDemoPaymentKey() {
  return `demo-${randomHex(16)}`;
}

// 토스 결제위젯(결제수단 선택 + 약관 동의)을 화면의 두 영역에 그림. 그려진 위젯으로 requestTossWidgetPayment()를 호출함
export async function renderTossWidgets({ amount, methodSelector, agreementSelector }) {
  const tossPayments = await loadTossPayments(CLIENT_KEY);
  const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

  await widgets.setAmount({ currency: 'KRW', value: amount });
  await Promise.all([
    widgets.renderPaymentMethods({ selector: methodSelector, variantKey: 'DEFAULT' }),
    widgets.renderAgreement({ selector: agreementSelector, variantKey: 'AGREEMENT' }),
  ]);

  return widgets;
}

// 위젯에서 고른 결제수단으로 결제를 진행. 결제를 마치면 토스가 successUrl로 paymentKey·orderId·amount를 붙여 이동시키고,
// 실패하면 failUrl로 code·message를 붙여 이동시킴. 사용자가 결제창을 닫으면 USER_CANCEL 에러로 끝남
export async function requestTossWidgetPayment(widgets, { reservationId, orderName }) {
  await widgets.requestPayment({
    orderId: createOrderId(reservationId),
    orderName,
    successUrl: `${window.location.origin}/payment/result?reservationId=${reservationId}`,
    failUrl: `${window.location.origin}/payment/fail?reservationId=${reservationId}`,
  });
}

// 결제창을 사용자가 닫은 경우는 오류가 아니라 안내만 하면 됨
export function isUserCancel(err) {
  return err?.code === 'USER_CANCEL' || err?.code === 'PAY_PROCESS_CANCELED';
}
