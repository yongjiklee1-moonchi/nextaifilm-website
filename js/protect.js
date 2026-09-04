(function () {
  "use strict";

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }

    if (target.nodeType !== 1) {
      target = target.parentElement;
    }

    if (!target) {
      return false;
    }

    var tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return true;
    }

    if (target.isContentEditable) {
      return true;
    }

    return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
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

    if (shift && (letter === "i" || letter === "j" || letter === "c" || letter === "k" || letter === "e")) {
      return true;
    }

    if (!shift && (letter === "u" || letter === "s" || letter === "a" || letter === "c" || letter === "p")) {
      return true;
    }

    return false;
  }

  function lockMedia(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = scope.querySelectorAll("img, video");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute("draggable", "false");
    }

    if (root && (root.tagName === "IMG" || root.tagName === "VIDEO")) {
      root.setAttribute("draggable", "false");
    }
  }

  document.addEventListener(
    "contextmenu",
    function (event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    },
    true
  );

  document.addEventListener(
    "dragstart",
    function (event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    },
    { capture: true, passive: false }
  );

  document.addEventListener(
    "selectstart",
    function (event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    },
    true
  );

  document.addEventListener(
    "copy",
    function (event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    },
    true
  );

  document.addEventListener(
    "cut",
    function (event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    },
    true
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

  lockMedia(document);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      lockMedia(document);
    });
  }

  if (typeof MutationObserver === "function") {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) {
            continue;
          }
          lockMedia(node);
        }
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
