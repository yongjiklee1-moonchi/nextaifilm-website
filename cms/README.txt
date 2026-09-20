NAF Website CMS ↔ 홈페이지 연결 안내
====================================

목표
- Google 시트(NAF Website CMS) 내용을 수정하면
- 홈페이지(www.nextaifilm.com)에 반영됩니다.

------------------------------------------------
1) Apps Script 웹 앱 만들기 (처음 1회)
------------------------------------------------
1. Drive에서 NAF Website CMS 스프레드시트를 엽니다.
2. 상단 메뉴: 확장 프로그램 > Apps Script
3. 기본 코드를 지우고, 이 폴더의 Code.gs 내용을 모두 붙여넣습니다.
4. 저장(디스크 아이콘)
5. 배포 > 새 배포
   - 설정 옆 톱니바퀴 > 웹 앱 선택
   - 설명: NAF CMS API
   - 실행 계정: 나
   - 액세스 권한: 모든 사용자
6. 배포 후 나오는 웹 앱 URL을 복사합니다.
   (…/exec 로 끝나는 주소)

------------------------------------------------
2) 홈페이지 설정 파일에 URL 넣기
------------------------------------------------
로컬/GitHub 파일:
  js/cms-config.js

WEB_APP_URL: "" 안에 웹 앱 URL을 붙여넣습니다.

예:
  WEB_APP_URL: "https://script.google.com/macros/s/XXXX/exec"

그 다음 사이트에 올립니다:
  js/cms-config.js
  js/cms.js
  (그리고 data-cms 가 들어간 HTML들)

------------------------------------------------
3) 사용하는 방법
------------------------------------------------
1. 시트에서 문구/링크를 수정합니다.
2. 사이트에서 새로고침합니다.
   (최대 약 5분 캐시 — cms-config.js 의 CACHE_MINUTES 로 조절)
3. 바로 보고 싶으면 브라우저 시크릿 창으로 열거나 CACHE_MINUTES 를 1 로 낮춥니다.

------------------------------------------------
4) 어떤 탭이 어디에 쓰이나
------------------------------------------------
Content          → 페이지 제목/소개 문구, 푸터 문구
Projects         → 영화/광고 프로젝트 기본 정보
ProjectSections  → 시놉시스, Director’s Statement 등
Team             → About 팀 소개
Commercials      → 광고 카테고리 문구/비메오
Links            → 이메일·SNS·Vimeo 링크
Awards           → (추후 목록 자동 렌더 확장 가능)
Copyright        → Copyright 페이지 조항
Media            → Vimeo/이미지 ID (예: M20 → Commercial 4K 링크)
Pages            → 참고용 목록

HTML에는 data-cms="page.section.field" 형태로 연결되어 있습니다.
시트의 page_id / section / field_key 와 같아야 합니다.

------------------------------------------------
5) 주의
------------------------------------------------
- Forms는 아직 연결하지 않았습니다. (문의 폼 준비되면 이어서 가능)
- 웹 앱을 다시 배포하면 URL이 바뀔 수 있습니다. 바뀌면 cms-config.js 도 다시 수정하세요.
- 시트 탭 이름(Pages, Content, Team …)을 바꾸면 Code.gs 의 SHEET_MAP 도 맞춰야 합니다.
- 처음 배포 시 Google 권한 승인 창이 뜹니다. 본인 계정으로 허용하면 됩니다.

------------------------------------------------
6) 임시 상담 폼 (Contact)
------------------------------------------------
1. Apps Script 편집기에서 Code.gs 전체를 최신 내용으로 교체 저장
2. 상단 함수 선택: setupInquiriesSheet → 실행 (Inquiries 탭 생성)
3. 배포 > 배포 관리 > 연필(수정) > 새 버전 > 배포
4. contact.html / js/contact-form.js / css/style.css / cms/Code.gs 반영 후 사이트 업로드
5. Contact 페이지에서 폼 제출 → 시트의 Inquiries 탭에 행이 쌓입니다

------------------------------------------------
7) 문의 알림 메일
------------------------------------------------
- 새 문의가 들어오면 Code.gs 의 NOTIFY_EMAIL 주소로 알림 메일이 갑니다.
  기본값: hello@nextaifilm.com
- 다른 주소로 받고 싶으면 NOTIFY_EMAIL 값을 바꾸고 다시 배포하세요.
  알림을 끄려면 빈 값("")으로 두면 됩니다.
- 메일 발신 계정은 Apps Script를 배포한 본인 Google 계정입니다.
  (수신 메일의 답장 주소는 문의한 사람의 이메일로 설정됩니다)
- Code.gs 를 새로 붙여넣은 뒤에는 반드시
  배포 > 배포 관리 > 연필(수정) > 새 버전 > 배포 를 해야 적용됩니다.
- 처음 실행할 때 메일 발송 권한 승인 창이 한 번 더 뜹니다. 허용해 주세요.

------------------------------------------------
8) 메일만 오고 시트에 안 남을 때 (드라이브 이전/시트 재생성 후)
------------------------------------------------
증상: 문의 메일은 오는데 새 시트의 Inquiries 탭에는 행이 없음.

원인(가장 흔함):
- 홈피가 예전 웹 앱 URL을 가리키거나
- Apps Script가 예전 시트에 묶여 있어, 기록이 예전 시트에만 쌓임
- 또는 새 시트에서 setupInquiriesSheet 를 안 돌림

바로 확인:
1. 방금 받은 알림 메일 본문의 "Sheet:" 링크를 열어보세요.
   → 지금 보고 있는 새 시트와 다르면, 예전 시트에 쓰이고 있는 겁니다.
2. 새 시트 주소창의 /d/XXXX/edit 에서 XXXX(시트 ID)를 복사합니다.

복구 순서:
1. 새 시트 열기 → 확장 프로그램 > Apps Script
2. cms/Code.gs 최신 내용으로 교체
3. SPREADSHEET_ID = "XXXX" 로 새 시트 ID 입력 후 저장
4. 함수 debugSpreadsheetBinding 실행 → 로그의 name/id/url 이 새 시트인지 확인
5. 함수 setupInquiriesSheet 실행 (Inquiries 탭 생성)
6. 배포 > 배포 관리 > 연필(수정) > 새 버전 > 배포
7. 웹 앱 URL이 바뀌었으면 js/cms-config.js 의 WEB_APP_URL 도 갱신 후 사이트 업로드
8. /inquire 에서 테스트 제출 → 새 시트 Inquiries 탭 확인

------------------------------------------------
9) Sunflowers 비공개 페이지 로그인
------------------------------------------------
주소: https://www.nextaifilm.com/sunflowers
메뉴에는 보이지 않습니다. 주소를 아는 사람만 들어갑니다.

기본 계정 (서버 Script Properties 에 솔트+SHA-256 으로 저장):
- 아이디: sunflowers
- 비밀번호: 1234

적용 순서:
1. Code.gs 최신 내용으로 교체 저장
2. 함수 setupSunflowersGate 실행 (처음 한 번)
3. 배포 > 배포 관리 > 연필(수정) > 새 버전 > 배포
4. 사이트에 sunflowers.html / js/sunflowers.js 업로드

비밀번호 바꾸기:
Apps Script 편집기에서 setupSunflowersGate("새비밀번호") 를 실행한 뒤
다시 새 버전 배포. 홈페이지 JS에는 비밀번호가 없습니다.

로그인 유지 시간:
Apps Script 상단에서 setSessionToOneHour 를 고른 뒤 실행 → 1시간.
다른 시간이 필요하면 setSunflowersSessionHours(3) 처럼 숫자를 바꿔 실행.
로그인 후 1시간이 되면 탭을 열어 두어도 상영이 닫히고 로그인 화면으로 돌아갑니다.
