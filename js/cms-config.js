/**
 * NAF CMS config
 *
 * 1) Google 시트(NAF Website CMS)에서 Apps Script 웹 앱을 배포한 뒤
 * 2) 아래에 웹 앱 URL을 붙여넣으세요. (.../exec 로 끝나는 주소)
 *
 * 예:
 *   WEB_APP_URL: "https://script.google.com/macros/s/AKfycb.../exec"
 *
 * 비어 있으면 CMS는 동작하지 않고, 페이지에 적힌 기존 HTML 문구가 그대로 보입니다.
 */
window.NAF_CMS_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwd2DAnIR8r7FIcDXJdQEJ5kzMQeY45eO71xWt55XcH8crViuD6ecySFVRPrt5EtvzK/exec",
  // 캐시 시간(분). 시트 수정 후 바로 보려면 1~5 권장
  CACHE_MINUTES: 5,
  // 디버그 로그
  DEBUG: false
};
