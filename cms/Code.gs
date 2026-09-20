/**
 * NAF Website CMS — Google Apps Script
 *
 * 설치:
 * 1. NAF Website CMS 스프레드시트 열기
 * 2. 확장 프로그램 > Apps Script
 * 3. 이 코드를 붙여넣고 저장
 * 4. 아래 SPREADSHEET_ID 에 이 시트의 ID를 넣기 (주소창 /d/XXXX/edit 의 XXXX)
 * 5. setupInquiriesSheet 함수를 한 번 실행 (Inquiries 탭 생성)
 * 6. 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 *    (문의 스팸 방지 로직을 바꿨으면 반드시 새 버전으로 다시 배포하세요)
 * 7. 배포 후 나온 웹 앱 URL을 js/cms-config.js 의 WEB_APP_URL 에 넣기
 * 8. 코드를 수정하면 배포 > 배포 관리 > 수정 > 새 버전 으로 다시 배포
 *
 * 드라이브를 옮기거나 시트를 새로 만든 뒤:
 * - 반드시 "새 시트"에서 확장 프로그램 > Apps Script 로 열어 이 코드를 넣으세요.
 * - SPREADSHEET_ID 를 새 시트 ID로 바꾸고 저장
 * - setupInquiriesSheet 실행
 * - 배포 관리에서 새 버전 배포 (URL이 바뀌면 cms-config.js 도 갱신)
 */

var SHEET_MAP = {
  pages: "Pages",
  content: "Content",
  projects: "Projects",
  projectSections: "ProjectSections",
  awards: "Awards",
  team: "Team",
  commercials: "Commercials",
  links: "Links",
  media: "Media",
  copyright: "Copyright"
};

var INQUIRIES_SHEET = "Inquiries";
var INQUIRIES_HEADERS = [
  "timestamp",
  "title",
  "email",
  "message",
  "source",
  "userAgent",
  "mailStatus"
];

/**
 * 시트 주소창: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 * 드라이브 이전/시트 재생성 후에는 반드시 새 ID로 바꾸세요.
 * 비워 두면 컨테이너 바인딩(시트에서 연 Apps Script)의 getActiveSpreadsheet 를 씁니다.
 */
var SPREADSHEET_ID = "";

/** 새 문의가 들어오면 알림 메일을 받을 주소. 비우면 메일을 보내지 않습니다. */
var NOTIFY_EMAIL = "hello@nextaifilm.com";

function getSpreadsheet_() {
  if (SPREADSHEET_ID && String(SPREADSHEET_ID).trim()) {
    return SpreadsheetApp.openById(String(SPREADSHEET_ID).trim());
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "No spreadsheet. Set SPREADSHEET_ID in Code.gs, or open Apps Script from the sheet (Extensions > Apps Script)."
    );
  }
  return ss;
}

function doGet(e) {
  var data = buildPayload_();
  var callback = e && e.parameter && e.parameter.callback;

  var json = JSON.stringify(data);
  if (callback) {
    var safe = String(callback).replace(/[^\w.$]/g, "");
    return ContentService.createTextOutput(safe + "(" + json + ");").setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var action = String(p.action || "").trim();

    if (action === "sunflowersLogin") {
      return handleSunflowersLogin_(p);
    }

    if (String(p.website || p.company || p.url || "").trim()) {
      return formOk_();
    }

    if (isRateLimited_()) {
      return formOk_();
    }

    var title = String(p.title || p.name || "").trim().substring(0, 160);
    var email = String(p.email || "").trim().substring(0, 160);
    var message = String(p.message || "").trim().substring(0, 2000);
    var source = String(p.source || "contact").trim().substring(0, 40);
    var started = Number(p.formStarted || 0);

    if (started && Date.now() - started < 2000) {
      return formOk_();
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return formError_();
    }
    if (message.length < 5) {
      return formError_();
    }

    var sheet = ensureInquiriesSheet_();
    var ss = getSpreadsheet_();

    sheet.appendRow([
      new Date(),
      title,
      email,
      message,
      source,
      String(p.userAgent || "").substring(0, 300),
      "pending"
    ]);
    var row = sheet.getLastRow();

    var mailStatus = notifyInquiry_({
      title: title,
      email: email,
      message: message,
      source: source,
      sheetUrl: ss.getUrl()
    });

    try {
      sheet.getRange(row, INQUIRIES_HEADERS.length).setValue(mailStatus);
    } catch (statusErr) {
      Logger.log("mailStatus write failed: " + statusErr);
    }

    return formOk_();
  } catch (err) {
    Logger.log("doPost failed: " + err);
    try {
      var p2 = e && e.parameter ? e.parameter : {};
      notifyInquiry_({
        title: String(p2.title || p2.name || "").trim().substring(0, 160),
        email: String(p2.email || "").trim().substring(0, 160),
        message: String(p2.message || "").trim().substring(0, 2000) +
          "\n\n[WARN] Sheet save failed: " + err,
        source: String(p2.source || "contact").trim().substring(0, 40),
        sheetUrl: ""
      });
    } catch (mailErr) {
      Logger.log("fallback mail failed: " + mailErr);
    }
    return formError_();
  }
}

function formOk_() {
  return HtmlService.createHtmlOutput(
    "<!doctype html><html><body data-naf-form=\"ok\">OK</body></html>"
  );
}

function formError_() {
  return HtmlService.createHtmlOutput(
    "<!doctype html><html><body data-naf-form=\"error\">ERROR</body></html>"
  );
}

function isRateLimited_() {
  var cache = CacheService.getScriptCache();
  var key = "naf_inq_count";
  var n = Number(cache.get(key) || 0);
  if (n >= 8) return true;
  cache.put(key, String(n + 1), 600);
  return false;
}

/** 알림 메일 실패가 폼 저장을 막지 않도록 별도로 감쌉니다. */
function notifyInquiry_(inquiry) {
  if (!NOTIFY_EMAIL) {
    Logger.log("NOTIFY_EMAIL empty — skip mail");
    return "skipped: empty NOTIFY_EMAIL";
  }

  try {
    var subject = "[NAF] New inquiry: " + (inquiry.title || "(no title)");
    var sheetUrl = inquiry.sheetUrl || "";
    if (!sheetUrl) {
      try {
        sheetUrl = getSpreadsheet_().getUrl();
      } catch (urlErr) {
        Logger.log("Sheet URL lookup failed: " + urlErr);
      }
    }

    var body =
      "Title: " + (inquiry.title || "-") + "\n" +
      "Email: " + (inquiry.email || "-") + "\n" +
      "Source: " + (inquiry.source || "-") + "\n\n" +
      "Message:\n" + (inquiry.message || "-") + "\n";

    if (sheetUrl) {
      body += "\nSheet: " + sheetUrl + "\n";
    }

    var options = { name: "Next AI Film" };
    if (inquiry.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inquiry.email)) {
      options.replyTo = inquiry.email;
    }

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body, options);
    Logger.log("Notify mail sent to " + NOTIFY_EMAIL + " subject=" + subject);
    return "sent";
  } catch (err) {
    Logger.log("Notify mail failed: " + err);
    return "failed: " + err;
  }
}

/** Run once from the Apps Script editor to create the Inquiries tab. */
function setupInquiriesSheet() {
  ensureInquiriesSheet_();
}

/** 연결 확인용: 실행 후 로그에 시트 이름/ID/URL이 보이면 OK */
function debugSpreadsheetBinding() {
  var ss = getSpreadsheet_();
  Logger.log("name=" + ss.getName());
  Logger.log("id=" + ss.getId());
  Logger.log("url=" + ss.getUrl());
  Logger.log("hasInquiries=" + !!ss.getSheetByName(INQUIRIES_SHEET));
}

function ensureInquiriesSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(INQUIRIES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(INQUIRIES_SHEET);
    sheet.appendRow(INQUIRIES_HEADERS);
    return sheet;
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(INQUIRIES_HEADERS);
  }

  // 기존 시트에 mailStatus 열이 없으면 헤더만 추가
  var lastCol = sheet.getLastColumn();
  if (lastCol < INQUIRIES_HEADERS.length) {
    sheet.getRange(1, INQUIRIES_HEADERS.length).setValue("mailStatus");
  } else {
    var header = String(sheet.getRange(1, INQUIRIES_HEADERS.length).getValue() || "").trim();
    if (!header) {
      sheet.getRange(1, INQUIRIES_HEADERS.length).setValue("mailStatus");
    }
  }
  return sheet;
}

function buildPayload_() {
  var ss = getSpreadsheet_();
  var payload = {
    ok: true,
    updatedAt: new Date().toISOString()
  };

  Object.keys(SHEET_MAP).forEach(function (key) {
    payload[key] = readSheetAsObjects_(ss, SHEET_MAP[key]);
  });

  return payload;
}

var SUNFLOWERS_DEFAULT_EMBED =
  "https://player.vimeo.com/video/1210535916?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0";

/**
 * Run once after deploy (or whenever the password should change).
 * Default: username sunflowers / password 1234.
 * The plaintext password is written only into Script Properties as a salted SHA-256 hash.
 * To change later: setupSunflowersGate("new-password") then save.
 */
function setupSunflowersGate(newPassword) {
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty("SUNFLOWERS_SALT") || Utilities.getUuid();
  var secret = props.getProperty("SUNFLOWERS_TOKEN_SECRET") || Utilities.getUuid();
  var user = props.getProperty("SUNFLOWERS_USER") || "sunflowers";
  var hash = props.getProperty("SUNFLOWERS_PASS_HASH");
  var embed = props.getProperty("SUNFLOWERS_EMBED") || SUNFLOWERS_DEFAULT_EMBED;
  var sessionHours = props.getProperty("SUNFLOWERS_SESSION_HOURS") || "1";

  if (!hash || newPassword) {
    var password = newPassword ? String(newPassword) : "1234";
    hash = hashPassword_(password, salt);
  }

  props.setProperties(
    {
      SUNFLOWERS_USER: user,
      SUNFLOWERS_SALT: salt,
      SUNFLOWERS_PASS_HASH: hash,
      SUNFLOWERS_TOKEN_SECRET: secret,
      SUNFLOWERS_EMBED: embed,
      SUNFLOWERS_SESSION_HOURS: String(sessionHours)
    },
    false
  );
}

/** Apps Script 상단 함수 목록에서 이 이름을 고른 뒤 실행하세요. 로그인 유지 1시간. */
function setSessionToOneHour() {
  setSunflowersSessionHours(1);
}

/** 로그인 유지 시간(시간 단위). 예: setSunflowersSessionHours(3) → 3시간 */
function setSunflowersSessionHours(hours) {
  var value = Number(hours);
  if (!value || value <= 0) value = 1;
  if (value > 24 * 30) value = 24 * 30;
  PropertiesService.getScriptProperties().setProperty(
    "SUNFLOWERS_SESSION_HOURS",
    String(value)
  );
}

function sunflowersSessionHours_() {
  var raw = PropertiesService.getScriptProperties().getProperty("SUNFLOWERS_SESSION_HOURS");
  var hours = Number(raw);
  if (!hours || hours <= 0) return 1;
  return hours;
}

function ensureSunflowersGate_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("SUNFLOWERS_PASS_HASH") || !props.getProperty("SUNFLOWERS_SALT")) {
    setupSunflowersGate();
  }
  return PropertiesService.getScriptProperties();
}

function handleSunflowersLogin_(p) {
  if (String(p.website || "").trim()) {
    return sunflowersAuthPage_({ ok: false, error: "invalid" }, p.origin);
  }

  if (isSunflowersRateLimited_()) {
    return sunflowersAuthPage_({ ok: false, error: "too_many" }, p.origin);
  }

  ensureSunflowersGate_();
  var props = PropertiesService.getScriptProperties();
  var expectedUser = String(props.getProperty("SUNFLOWERS_USER") || "sunflowers");
  var salt = String(props.getProperty("SUNFLOWERS_SALT") || "");
  var expectedHash = String(props.getProperty("SUNFLOWERS_PASS_HASH") || "");
  var embed = String(props.getProperty("SUNFLOWERS_EMBED") || SUNFLOWERS_DEFAULT_EMBED);

  var user = String(p.username || p.user || "").trim();
  var password = String(p.password || p.pass || "");
  var actualHash = hashPassword_(password, salt);

  if (!timingSafeEqual_(user, expectedUser) || !timingSafeEqual_(actualHash, expectedHash)) {
    Utilities.sleep(400);
    return sunflowersAuthPage_({ ok: false, error: "invalid" }, p.origin);
  }

  return sunflowersAuthPage_(
    { ok: true, embedUrl: embed, sessionHours: sunflowersSessionHours_() },
    p.origin
  );
}

function sunflowersAuthPage_(payload, origin) {
  var data = payload || {};
  data.type = "naf-sunflowers-auth";
  var target = allowedSunflowersOrigin_(origin);
  var html =
    "<!doctype html><html><body><script>" +
    "window.parent.postMessage(" +
    JSON.stringify(data) +
    ",'*');" +
    "</script></body></html>";
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(
    HtmlService.XFrameOptionsMode.ALLOWALL
  );
}

function allowedSunflowersOrigin_(origin) {
  var value = String(origin || "").replace(/\/$/, "");
  if (/^https:\/\/(www\.)?nextaifilm\.com$/.test(value)) return value;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(value)) return value;
  return "https://www.nextaifilm.com";
}

function hashPassword_(password, salt) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + "\u0000" + String(password),
    Utilities.Charset.UTF_8
  );
  return toHex_(raw);
}

function toHex_(bytes) {
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i];
    if (b < 0) b += 256;
    var hex = b.toString(16);
    out.push(hex.length === 1 ? "0" + hex : hex);
  }
  return out.join("");
}

function timingSafeEqual_(a, b) {
  a = String(a || "");
  b = String(b || "");
  var max = Math.max(a.length, b.length);
  var diff = a.length ^ b.length;
  for (var i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function isSunflowersRateLimited_() {
  var cache = CacheService.getScriptCache();
  var key = "naf_sunflowers_login";
  var n = Number(cache.get(key) || 0);
  if (n >= 20) return true;
  cache.put(key, String(n + 1), 600);
  return false;
}

function readSheetAsObjects_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var values = sheet.getDataRange().getDisplayValues();
  if (!values || values.length < 2) return [];

  var headers = values[0].map(function (h) {
    return String(h || "").trim();
  });

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (!row || row.join("").trim() === "") continue;

    var obj = {};
    var hasValue = false;
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      if (!key) continue;
      var val = row[c] == null ? "" : String(row[c]);
      obj[key] = val;
      if (val.trim() !== "") hasValue = true;
    }
    if (hasValue) rows.push(obj);
  }
  return rows;
}
