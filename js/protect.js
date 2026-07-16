(function () {
  "use strict";

  function isEditableTarget(target) {
    if (!target || target.nodeType !== 1) {
      return false;
    }

    var tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return true;
    }

    if (target.isContentEditable) {
      return true;
    }

    return false;
  }

  function isBlockedShortcut(event) {
    var key = event.key;
    var code = event.code;
    var ctrlOrMeta = event.ctrlKey || event.metaKey;
    var shift = event.shiftKey;

    if (key === "F12" || code === "F12") {
      return true;
    }

    if (!ctrlOrMeta) {
      return false;
    }

    var letter = typeof key === "string" ? key.toLowerCase() : "";

    if (shift && (letter === "i" || letter === "j" || letter === "c")) {
      return true;
    }

    if (!shift && (letter === "u" || letter === "s" || letter === "a" || letter === "c")) {
      return true;
    }

    return false;
  }

  document.addEventListener(
    "contextmenu",
    function (event) {
      event.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    "dragstart",
    function (event) {
      var target = event.target;
      if (target && (target.tagName === "IMG" || target.closest("img"))) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (isBlockedShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
})();
