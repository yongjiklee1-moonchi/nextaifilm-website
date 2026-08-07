(function () {
  "use strict";

  var CALLBACK_NAME = "nafCmsReceive";
  var CACHE_KEY = "naf-cms-payload-v1";
  var config = window.NAF_CMS_CONFIG || {};
  var webAppUrl = (config.WEB_APP_URL || "").trim();
  var cacheMinutes = Number(config.CACHE_MINUTES);
  if (!isFinite(cacheMinutes) || cacheMinutes < 0) cacheMinutes = 5;

  function log() {
    if (!config.DEBUG || !window.console) return;
    console.log.apply(console, ["[NAF CMS]"].concat([].slice.call(arguments)));
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || !parsed.data) return null;
      var ageMs = Date.now() - parsed.savedAt;
      if (ageMs > cacheMinutes * 60 * 1000) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), data: data })
      );
    } catch (e) {}
  }

  function indexBy() {
    var map = Object.create(null);
    for (var i = 0; i < arguments.length; i++) {
      /* noop helper signature */
    }
    return map;
  }

  function buildIndexes(data) {
    var contentByKey = Object.create(null);
    (data.content || []).forEach(function (row) {
      var key =
        (row.page_id || "").trim() +
        "." +
        (row.section || "").trim() +
        "." +
        (row.field_key || "").trim();
      if (key !== "..") contentByKey[key] = row.english_text || "";
    });

    var projectsById = Object.create(null);
    (data.projects || []).forEach(function (row) {
      if (row.project_id) projectsById[row.project_id] = row;
    });

    var sectionsByKey = Object.create(null);
    (data.projectSections || []).forEach(function (row) {
      var key = (row.project_id || "") + "." + (row.section_key || "");
      sectionsByKey[key] = row;
    });

    var teamById = Object.create(null);
    (data.team || []).forEach(function (row) {
      if (row.member_id) teamById[row.member_id] = row;
    });

    var commercialsById = Object.create(null);
    (data.commercials || []).forEach(function (row) {
      if (row.commercial_id) commercialsById[row.commercial_id] = row;
    });

    var linksById = Object.create(null);
    (data.links || []).forEach(function (row) {
      if (row.link_id) linksById[row.link_id] = row;
    });

    var awards = (data.awards || []).slice().sort(function (a, b) {
      return Number(a.sort || 0) - Number(b.sort || 0);
    });

    var copyright = (data.copyright || []).slice().sort(function (a, b) {
      return Number(a.sort || 0) - Number(b.sort || 0);
    });

    return {
      contentByKey: contentByKey,
      projectsById: projectsById,
      sectionsByKey: sectionsByKey,
      teamById: teamById,
      commercialsById: commercialsById,
      linksById: linksById,
      awards: awards,
      copyright: copyright,
      raw: data
    };
  }

  function setText(el, value) {
    if (!el || value == null) return;
    var text = String(value);
    var mode = (el.getAttribute("data-cms-mode") || "text").toLowerCase();
    if (mode === "html") {
      el.innerHTML = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n\n+/g, "</p><p>")
        .replace(/\n/g, "<br />");
      if (el.innerHTML && el.tagName !== "P") {
        // keep as-is for containers; if plain, wrap not forced
      }
      return;
    }
    if (mode === "multiline") {
      el.innerHTML = "";
      String(text)
        .split(/\n+/)
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean)
        .forEach(function (line) {
          var p = document.createElement("p");
          p.textContent = line;
          el.appendChild(p);
        });
      return;
    }
    el.textContent = text;
  }

  function applyContent(ix) {
    document.querySelectorAll("[data-cms]").forEach(function (el) {
      var key = (el.getAttribute("data-cms") || "").trim();
      if (!key || !Object.prototype.hasOwnProperty.call(ix.contentByKey, key)) {
        return;
      }
      setText(el, ix.contentByKey[key]);
    });
  }

  function applyTeam(ix) {
    document.querySelectorAll("[data-cms-team]").forEach(function (root) {
      var id = (root.getAttribute("data-cms-team") || "").trim();
      var member = ix.teamById[id];
      if (!member) return;

      root.querySelectorAll("[data-cms-field]").forEach(function (el) {
        var field = el.getAttribute("data-cms-field");
        if (!field || member[field] == null || member[field] === "") return;
        if (field === "photo" && el.tagName === "IMG") {
          el.src = member.photo;
          if (member.name) el.alt = member.name;
          return;
        }
        if (field === "name" && el.querySelector(".about-member__nick")) {
          // keep nickname markup; update leading text node only when simple
          var nick = el.querySelector(".about-member__nick");
          var symbol = el.querySelector(".about-member__nick-symbol");
          el.textContent = "";
          el.appendChild(document.createTextNode(member.name + " | "));
          if (nick) {
            nick.textContent = member.nickname || nick.textContent;
            el.appendChild(nick);
          }
          if (symbol) el.appendChild(symbol);
          return;
        }
        setText(el, member[field]);
      });
    });
  }

  function applyProjectMeta(ix) {
    document.querySelectorAll("[data-cms-project]").forEach(function (root) {
      var id = (root.getAttribute("data-cms-project") || "").trim();
      var project = ix.projectsById[id];
      if (!project) return;
      root.querySelectorAll("[data-cms-field]").forEach(function (el) {
        var field = el.getAttribute("data-cms-field");
        if (!field || project[field] == null || project[field] === "") return;
        if (field === "poster" && el.tagName === "IMG") {
          el.src = project.poster;
          if (project.title) el.alt = project.title;
          return;
        }
        setText(el, project[field]);
      });
    });
  }

  function applySections(ix) {
    document.querySelectorAll("[data-cms-section]").forEach(function (el) {
      var key = (el.getAttribute("data-cms-section") || "").trim();
      var row = ix.sectionsByKey[key];
      if (!row) return;
      var field = el.getAttribute("data-cms-field") || "body";
      if (row[field] == null || row[field] === "") return;
      setText(el, row[field]);
    });
  }

  function applyCommercials(ix) {
    document.querySelectorAll("[data-cms-commercial]").forEach(function (root) {
      var id = (root.getAttribute("data-cms-commercial") || "").trim();
      var item = ix.commercialsById[id];
      if (!item) return;
      root.querySelectorAll("[data-cms-field]").forEach(function (el) {
        var field = el.getAttribute("data-cms-field");
        if (!field || item[field] == null || item[field] === "") return;
        if ((field === "cover_image" || field === "player_poster") && el.tagName === "IMG") {
          el.src = item[field];
          return;
        }
        if (field === "vimeo_id" && el.tagName === "A" && item.vimeo_id) {
          el.href = "https://vimeo.com/" + item.vimeo_id;
          return;
        }
        setText(el, item[field]);
      });

      var player = root.querySelector(".commercial-item__player");
      if (player && item.vimeo_id) {
        player.setAttribute("data-vimeo-id", item.vimeo_id);
      }
      if (player && item.player_poster) {
        player.setAttribute("data-poster", item.player_poster);
      }
    });
  }

  function applyLinks(ix) {
    document.querySelectorAll("[data-cms-link]").forEach(function (el) {
      var id = (el.getAttribute("data-cms-link") || "").trim();
      var link = ix.linksById[id];
      if (!link || !link.url) return;
      if (el.tagName === "A") {
        el.href = link.url;
        if (el.hasAttribute("data-cms-link-label") && link.name) {
          setText(el, link.name);
        }
      }
    });
  }

  function applyCopyright(ix) {
    document.querySelectorAll("[data-cms-copyright]").forEach(function (el) {
      var number = String(el.getAttribute("data-cms-copyright") || "").trim();
      var row = null;
      for (var i = 0; i < ix.copyright.length; i++) {
        if (String(ix.copyright[i].number) === number) {
          row = ix.copyright[i];
          break;
        }
      }
      if (!row) return;
      var titleEl = el.querySelector("[data-cms-field='title']");
      var bodyEl = el.querySelector("[data-cms-field='body']");
      if (titleEl && row.title) {
        setText(titleEl, row.number + ". " + row.title);
      }
      if (bodyEl && row.body) setText(bodyEl, row.body);
    });
  }

  function applyFooter(ix) {
    var studio = ix.contentByKey["site.brand.studio_name"];
    var tagline = ix.contentByKey["site.brand.tagline"];
    var quote = ix.contentByKey["site.brand.footer_quote"];
    var copy = ix.contentByKey["site.footer.copyright"];
    var email = ix.contentByKey["site.footer.email"];
    var location = ix.contentByKey["site.footer.location"];

    document.querySelectorAll("[data-cms='site.brand.studio_name']").forEach(function (el) {
      if (studio) setText(el, studio);
    });
    document.querySelectorAll("[data-cms='site.brand.tagline']").forEach(function (el) {
      if (tagline) setText(el, tagline);
    });
    document.querySelectorAll("[data-cms='site.brand.footer_quote']").forEach(function (el) {
      if (quote) setText(el, quote);
    });
    document.querySelectorAll("[data-cms='site.footer.copyright']").forEach(function (el) {
      if (!copy) return;
      // preserve Copyright link if present
      var link = el.querySelector("a.footer__copy-link");
      el.childNodes.forEach(function () {});
      var linkHtml = link ? link.outerHTML : "";
      el.innerHTML = copy + (linkHtml ? " " + linkHtml : "");
    });
    document.querySelectorAll('a[data-cms-link="L01"]').forEach(function (el) {
      if (email) {
        el.href = email.indexOf("mailto:") === 0 ? email : "mailto:" + email;
        if (!el.getAttribute("data-cms-keep-label")) setText(el, email.replace(/^mailto:/, ""));
      }
    });
    document.querySelectorAll("[data-cms='site.footer.location']").forEach(function (el) {
      if (location) setText(el, location);
    });
  }

  function applyAll(data) {
    if (!data || data.ok === false) {
      log("payload missing or not ok");
      return;
    }
    var ix = buildIndexes(data);
    applyContent(ix);
    applyTeam(ix);
    applyProjectMeta(ix);
    applySections(ix);
    applyCommercials(ix);
    applyLinks(ix);
    applyCopyright(ix);
    applyFooter(ix);
    document.documentElement.classList.add("cms-loaded");
    log("applied", data.updatedAt || "");
  }

  function loadViaJsonp(url) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timeout = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("CMS timeout"));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timeout);
        try {
          delete window[CALLBACK_NAME];
        } catch (e) {
          window[CALLBACK_NAME] = undefined;
        }
        if (script && script.parentNode) script.parentNode.removeChild(script);
      }

      window[CALLBACK_NAME] = function (payload) {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(payload);
      };

      var script = document.createElement("script");
      var sep = url.indexOf("?") >= 0 ? "&" : "?";
      script.src = url + sep + "callback=" + encodeURIComponent(CALLBACK_NAME);
      script.async = true;
      script.onerror = function () {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("CMS script error"));
      };
      document.head.appendChild(script);
    });
  }

  function boot() {
    if (!webAppUrl) {
      log("WEB_APP_URL empty — using static HTML");
      return;
    }

    var cached = readCache();
    if (cached) {
      log("using cache");
      applyAll(cached);
    }

    loadViaJsonp(webAppUrl)
      .then(function (payload) {
        writeCache(payload);
        applyAll(payload);
      })
      .catch(function (err) {
        log(err && err.message ? err.message : err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
