window.__ModuleLoader__.load({id:"@xien/dsh-ui-plugin",factory:(require)=>{var module={exports:{}};var exports=module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  Connections: () => Connections,
  EvidencePanel: () => EvidencePanel,
  WorkBar: () => WorkBar,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");

// node_modules/@deepseek-ai/dsh-util-workspace-path/lib/index.js
var FILE_ADDRESS_PREFIX = "dsh-resource://file/";
function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(/%3A/gi, ":");
}
function encodePath(path) {
  return path.split("/").map(encodeSegment).join("/");
}
function sessionFileAddress(sessionId, path) {
  const normalized = path.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
  return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(sessionId)}/${encodePath(normalized)}`;
}
function isWindowsStylePath(value) {
  return /^[A-Za-z]:[/\\]/.test(value) || value.startsWith("\\\\");
}
function isAbsoluteWorkspacePath(path) {
  return path.startsWith("/") || isWindowsStylePath(path);
}
function fileAddressFor(sessionId, cwd, path) {
  const normalized = path.replace(/\\/g, "/");
  if (!isAbsoluteWorkspacePath(normalized)) return sessionFileAddress(sessionId, normalized);
  const root = cwd === void 0 ? "" : cwd.replace(/\\/g, "/").replace(/\/+$/, "");
  if (root !== "" && normalized === root) return sessionFileAddress(sessionId, "");
  if (root !== "" && normalized.startsWith(`${root}/`)) return sessionFileAddress(sessionId, normalized.slice(root.length + 1));
  return sessionFileAddress(sessionId, normalized);
}

// src/brand.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function BrandMark({ size = 36, className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      className: "xien-brand-mark " + (className ?? ""),
      width: size,
      height: size,
      viewBox: "0 0 54 56",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M24 38C13 29 14 12 24 3c0 14 7 24 16 28-8-1-12 1-16 7Z", fill: "#91abdd" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 40C11 35 5 23 3 14c13 2 24 8 30 17-6 2-10 5-12 9Z", fill: "#4d79cc" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M11 53C19 32 35 18 51 26 36 30 24 42 11 53Z", fill: "#002fa7" })
      ]
    }
  );
}
function BrandName() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "xien-brand-name", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u897F\u6069\u79D1\u6280" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "XIEN \xB7 AGENT" })
  ] });
}
function EvidenceIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 20 20", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 2h8l4 4v12H4zM12 2v4h4M7 10h6M7 13h5" }) });
}

// src/theme.ts
var theme = `
body.xien-ui{
 color-scheme:light;
 --dsw-alias-bg-base:#fff;--dsw-alias-bg-layer-1:#f8faff;--dsw-alias-bg-layer-2:#edf2ff;--dsw-alias-bg-layer-3:#e6edff;--dsw-alias-bg-overlay:#f8faff;--dsw-alias-bg-module-platform:#f5f8ff;--dsw-alias-bg-multi-select:#e6edff;--dsw-alias-bg-skeleton:rgba(0,47,167,.06);
 --dsw-alias-label-primary:#1b2a42;--dsw-alias-label-primary-dimmed:#405371;--dsw-alias-label-primary-bluish:#002fa7;--dsw-alias-label-secondary:#617795;--dsw-alias-label-tertiary:#7a8ea9;--dsw-alias-label-caption:#8a9db8;--dsw-alias-label-dimmed:#96a7bf;
 --dsw-alias-border-l1:rgba(0,47,167,.08);--dsw-alias-border-l2:rgba(0,47,167,.13);--dsw-alias-border-l3:rgba(0,47,167,.2);--dsw-alias-border-l4:rgba(0,47,167,.28);
 --dsw-alias-brand-primary:#002fa7;--dsw-alias-brand-text:#002a96;--dsw-alias-brand-primary-invert:#fff;--dsw-alias-brand-primary-new-colorprimary-new-color:#002fa7;
 --dsw-alias-button-primary-fill:#002fa7;--dsw-alias-button-primary-hover:#163fa8;--dsw-alias-button-primary-dimmed:#d9e3f6;--dsw-alias-button-info-fill:#002fa7;--dsw-alias-button-info-hover:#1a4ac8;--dsw-alias-button-contrast-fill:#002a96;--dsw-alias-button-elevated-fill:#fff;--dsw-alias-button-floating-fill:#fff;--dsw-alias-button-floating-hover:#edf2ff;--dsw-alias-button-ghost-active-fill:#e6edff;--dsw-alias-button-ghost-active-hover:#d5e2ff;--dsw-alias-button-ghost-active-border:#7a98d0;
 --dsw-alias-interactive-bg-hover:rgba(0,47,167,.05);--dsw-alias-interactive-bg-active:rgba(0,47,167,.1);--dsw-alias-interactive-bg-hover-accent:rgba(0,47,167,.12);--dsw-alias-interactive-bg-hover-solid:#edf2ff;
 --dsw-alias-state-business-primary:#002fa7;--dsw-alias-state-business-tertiary:#e6edff;--dsw-alias-state-error-primary:#b23939;--dsw-alias-state-error-secondary:#c24b4b;--dsw-alias-state-success-primary:#3c7b5d;--dsw-alias-state-warn-primary:#96702e;
 --dsw-alias-markdown-code-block:#f7f9fe;--dsw-alias-markdown-code-block-banner:#f0f4fc;--dsw-alias-markdown-inline-code:#edf2ff;--dsw-alias-markdown-code-segment-selected:#fff;--dsw-alias-markdown-code-segment-unselected:#edf2ff;--dsw-alias-markdown-tag:#edf2ff;--dsw-alias-markdown-placeholder:#edf2ff;--dsw-alias-markdown-citation:#edf2ff;
 --dsw-specific-bubble:#f0f4fc;--dsw-specific-bubble-highlight:#e6edff;--dsw-specific-sidebar-fill:#f7f9fe;--dsw-specific-sidebar-nav-item-active:#eaf0ff;--dsw-specific-sidebar-nav-item-active-accent:#d5e2ff;--dsw-specific-sidebar-nav-item-hover:#edf2ff;--dsw-specific-input-major:#fff;--dsw-specific-login-input:#f5f8ff;--dsw-specific-menu:#f8faff;--dsw-specific-selector:#edf2ff;--dsw-specific-tip:#edf2ff;
 --dsw-alias-scrollbar-bg-l1:#d7e1f3;--dsw-alias-scrollbar-bg-l2:#c8d6ef;--dsw-alias-scrollbar-hover-l1:#b8c9e7;--dsw-alias-scrollbar-hover-l2:#a4badf;--dsw-alias-toast-bg:#294e89;--dsw-alias-tooltip-bg:#294e89;
}
body.xien-ui [data-composer-card]{border:1px solid #cedbf0!important;border-radius:23px!important;background:#fff!important;box-shadow:0 5px 18px #123c890b;overflow:visible}
body.xien-ui [data-composer-card]:focus-within{border-color:#829fd8!important;box-shadow:0 0 0 3px #edf2ff}
body.xien-ui [data-composer-card] button[class*="_primary"]{width:40px!important;height:40px!important;min-width:40px;flex-shrink:0;border-radius:50%!important;position:relative;box-shadow:0 3px 10px #002fa710}
body.xien-ui [data-composer-card] button[class*="_primary"]:disabled{box-shadow:none}
body.xien-ui [data-composer-card] button[class*="_primary"]:has(rect){background:#edf2ff!important;color:#002fa7!important}
body.xien-ui [data-composer-card] button[class*="_primary"]:has(rect):after{content:'';position:absolute;inset:-4px;border:1.5px solid #d8e2f8;border-top-color:#315fc5;border-right-color:#315fc5;border-radius:50%;pointer-events:none;animation:xien-spin 1.1s linear infinite}
body.xien-ui [data-slot="sidebar"] button[class*="_newSession"]{border-radius:999px!important;border:1px solid #d4dff2;background:#fff;color:#002fa7}
body.xien-ui [data-slot="sidebar"] button[class*="_panel"],body.xien-ui [data-slot="sidebar"] [class*="_sessionRow"]{border-radius:12px}
body.xien-ui [data-slot="sidebar.brand.name"]{min-width:0}
body.xien-ui [data-slot="sidebar"] [class$="_brand"]:has([data-slot="sidebar.brand.name"]){min-height:42px;overflow:visible}
body.xien-ui [data-slot="sidebar"] [class*="_brandIdentity"]:has([data-slot="sidebar.brand.name"]){height:38px}
body.xien-ui [data-slot="sidebar"] [class*="_brandName"]{height:auto;min-height:35px}
.xien-brand-name{display:flex;flex-direction:column;gap:3px;line-height:1.35;white-space:nowrap}.xien-brand-name strong{font-size:19px;letter-spacing:2px;font-weight:600;color:#19345a}.xien-brand-name small{font:8px/1.2 Helvetica,Arial,sans-serif;letter-spacing:2px;color:#6380b3}
.xien-brand-mark{display:block;flex-shrink:0;overflow:visible}.xien-workbar{display:flex;align-items:center;gap:8px;color:#8499b8;font:11px/1.6 'Microsoft YaHei',Helvetica,sans-serif;padding:7px 5px 10px;min-width:0}.xien-workbar .xien-dot{width:6px;height:6px;border-radius:50%;background:#7d9dcc;flex-shrink:0}.xien-workbar strong{color:#5e7faf;font-size:11px;font-weight:500;white-space:nowrap}.xien-workbar small{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.xien-workbar .xien-clock{font:9px Consolas,monospace;margin-left:auto;white-space:nowrap;color:#91a2bf}.xien-workbar[data-busy=true] .xien-dot{background:#002fa7;box-shadow:0 0 0 4px #edf2ff;animation:xien-pulse 1.6s ease-in-out infinite}.xien-workbar[data-busy=true] strong{color:#002fa7}.xien-workbar[data-phase=error] strong{color:#a14848}.xien-workbar[data-phase=waiting] strong{color:#96702e}
.xien-evidence-button{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border:1px solid #dce6f7;border-radius:999px;font:11px/1.5 'Microsoft YaHei',sans-serif;color:#476ca8;background:#f8faff;white-space:nowrap;cursor:pointer}.xien-evidence-button:hover{background:#edf2ff}.xien-evidence-button svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.5}
.xien-panel{height:100%;min-height:0;display:flex;flex-direction:column;background:#fff;color:#294363;font:12px/1.7 'Microsoft YaHei',Helvetica,sans-serif;box-sizing:border-box}.xien-panel *{box-sizing:border-box}.xien-panel button,.xien-panel input,.xien-panel select,.xien-panel textarea{font:inherit;color:inherit}.xien-panel button{cursor:pointer}.xien-panel button:disabled{cursor:default;opacity:.5}.xien-panel button:focus-visible,.xien-panel a:focus-visible,.xien-panel input:focus-visible,.xien-panel textarea:focus-visible,.xien-panel select:focus-visible{outline:2px solid #7d9cdb;outline-offset:3px}.xien-panel button:hover{background:#edf2ff}.xien-panel a{color:#517dbf;text-decoration:none}.xien-panel a:hover{text-decoration:underline}.xien-panel-head{padding:18px 20px 5px;display:flex;align-items:center;justify-content:space-between;gap:12px}.xien-panel-head h2{font-size:14px;letter-spacing:1px;font-weight:500;margin:0}.xien-panel-head span{font-size:9px;color:#96a9c5}.xien-panel .xien-workbar{padding:9px 20px 13px}.xien-panel .xien-workbar small{display:none}.xien-tabs{display:flex;gap:20px;padding:0 20px;border-bottom:1px solid #e5ebf4}.xien-tabs button{padding:11px 0;border:0;background:transparent;font-size:11px;color:#8c9fba;position:relative;white-space:nowrap}.xien-tabs button[aria-selected=true]{color:#002fa7}.xien-tabs button[aria-selected=true]:after{content:'';position:absolute;bottom:-1px;left:0;right:0;background:#3d68c3;height:2px;border-radius:99px}.xien-panel-body{overflow:auto;padding:19px 20px;flex:1;min-height:0}.xien-turn-picker{display:flex;gap:9px;align-items:center;font-size:10px;color:#7a92b6;margin-bottom:17px}.xien-turn-picker select{min-width:0;width:100%;border:1px solid #e0e8f6;border-radius:9px;background:#f9fbff;padding:7px;color:#6e89b3;font-size:10px}.xien-summary{display:flex;justify-content:space-between;align-items:center;color:#7590b7;font-size:10px;margin:0 0 14px}.xien-summary strong{font-size:11px;font-weight:500;color:#5f7da6}.xien-source{border:1px solid #e5ebf5;border-radius:15px;padding:16px;margin-bottom:13px;background:#fff}.xien-source-top{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.xien-source-index{font:20px Georgia,serif;color:#8da4c8;margin-right:auto}.xien-tag{font:8px/1.5 Consolas,monospace;border:1px solid #e1e9f7;color:#7b96bf;border-radius:6px;padding:2px 5px;background:#f9fbff}.xien-source h3{font-size:12px;font-weight:500;line-height:1.7;margin:10px 0 6px;color:#3e5d8b;overflow-wrap:anywhere}.xien-source p{font-size:11px;color:#7d8fa9;margin:0 0 12px;line-height:1.85;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap}.xien-location{font:9px/1.8 Consolas,monospace;color:#91a3be;overflow-wrap:anywhere}.xien-source-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;font-size:9px;color:#7e97ba;flex-wrap:wrap}.xien-source-foot button{border:0;background:transparent;padding:0;font-size:10px;color:#6387c0}.xien-source-foot a{font-size:10px}.xien-notice{background:#f5f8ff;border:1px solid #e5ebf8;border-radius:11px;color:#7b92b6;padding:10px 12px;font-size:10px;line-height:1.8;margin:13px 0;overflow-wrap:anywhere}.xien-notice[data-error=true]{background:#fff8f7;border-color:#f0dbd8;color:#9a5c53}.xien-empty{padding:40px 6px;text-align:center;color:#8a9ebc;font-size:11px;line-height:1.9}.xien-empty svg{display:block;width:28px;height:28px;margin:0 auto 13px;stroke:#9aafd0;fill:none;stroke-width:1}.xien-panel-footer{border-top:1px solid #e5ebf4;padding:12px 20px;font:8px/1.5 Consolas,monospace;letter-spacing:1.5px;color:#9aaecb}.xien-button{background:#fff;border:1px solid #d7e3f8;border-radius:999px;padding:7px 13px;color:#5e81ba;font-size:11px}.xien-button.xien-primary{background:#002fa7;color:#fff;border:1px solid #002fa7}.xien-button.xien-primary:hover{background:#163fa8}.xien-more{width:100%;margin-top:5px;background:#fff;border:1px dashed #ccd9f1;border-radius:999px;padding:8px;color:#7c98c4;font-size:10px}.xien-tail{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0 2px;padding:12px 0;border-top:1px solid #e6ebf5;color:#849cbe;font-size:11px}.xien-tail button{border:0;background:transparent;color:#5179b8;padding:0;font:inherit;cursor:pointer}.xien-call{border-left:1px solid #d9e4f7;padding:0 0 18px 16px;margin-left:4px;position:relative}.xien-call:before{content:'';width:6px;height:6px;position:absolute;left:-4px;top:8px;border:1px solid #7b9ad1;border-radius:50%;background:#f5f8ff}.xien-call summary{list-style:none;cursor:pointer;display:flex;gap:9px;align-items:center;padding:3px 0;color:#5f7faf;overflow-wrap:anywhere}.xien-call summary code{font:11px/1.6 Consolas,monospace;flex:1;min-width:0}.xien-call summary small{font-size:9px}.xien-call pre{font:10px/1.8 Consolas,monospace;background:#f5f8ff;padding:11px;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:280px;overflow:auto;margin:8px 0}.xien-call label{font-size:9px;color:#91a5c4}.xien-config label{display:block;font-size:11px;color:#7e95b5;margin-bottom:17px}.xien-config input,.xien-config textarea{display:block;width:100%;padding:9px 11px;margin-top:7px;border:1px solid #dce6f7;background:#fbfcff;border-radius:10px;color:#59769f;font-size:11px}.xien-config textarea{resize:vertical;min-height:77px}.xien-config input::placeholder,.xien-config textarea::placeholder{color:#a0afc5}.xien-config p{font-size:10px;color:#8a9fbd;line-height:1.9}.xien-config h3{font-size:15px;color:#385b92;margin:0 0 7px;font-weight:500}.xien-config code{font-size:10px;overflow-wrap:anywhere}.xien-inline-error{color:#a04e4e;font-size:10px;padding:7px 0}
@keyframes xien-spin{to{transform:rotate(360deg)}}@keyframes xien-pulse{50%{opacity:.45}}@media(prefers-reduced-motion:reduce){.xien-workbar[data-busy=true] .xien-dot,body.xien-ui [data-composer-card] button[class*="_primary"]:has(rect):after{animation:none}}
@media(max-width:600px){body.xien-ui [data-composer-card]{border-radius:20px!important}.xien-workbar{font-size:10px}.xien-workbar small{display:none}.xien-panel-body{padding:17px}.xien-panel-head{padding:17px 17px 5px}.xien-tabs{padding:0 17px;gap:18px}.xien-panel .xien-workbar{padding-left:17px;padding-right:17px}.xien-brand-name strong{font-size:17px}}
`;

// src/model.ts
var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
var str = (value) => typeof value === "string" ? value : "";
function redact(value) {
  if (typeof value === "string")
    return value.replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]").replace(/([?&](?:token|key|ticket|secret|access|signature)=)[^&#\s]+/gi, "$1[REDACTED]").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]");
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => !/thinking|reasoning|chain.?of.?thought|stream/i.test(key)).map(([key, v]) => [
        key,
        /secret|password|credential|authorization|api.?key|^token$/i.test(key) ? "[REDACTED]" : redact(v)
      ])
    );
  return value;
}
var summary = (v) => (typeof v === "string" ? String(redact(v)) : JSON.stringify(redact(v)) ?? "").slice(0, 4e3);
function text(v) {
  return Array.isArray(v) ? v.filter((x) => record(x).type === "text").map((x) => str(record(x).text)).join("\n") : "";
}
function source(value) {
  const v = record(value), loc = record(v.locator);
  if (typeof v.source_id !== "string" || typeof v.title !== "string" || typeof v.original_url !== "string" || !["sdk", "manual", "kb"].includes(str(v.type)) || !["search_hit", "read"].includes(str(v.status)))
    return;
  return {
    source_id: v.source_id,
    type: v.type,
    title: v.title,
    original_url: v.original_url,
    version: typeof v.version === "string" ? v.version : null,
    chip: typeof v.chip === "string" ? v.chip : null,
    board: typeof v.board === "string" ? v.board : null,
    fetched_at: str(v.fetched_at),
    snippet: str(v.snippet),
    status: v.status,
    applicability: ["unconfirmed", "as_documented", "conflict"].includes(str(v.applicability)) ? v.applicability : "unconfirmed",
    locator: {
      path: typeof loc.path === "string" ? loc.path : void 0,
      line_start: typeof loc.line_start === "number" ? loc.line_start : void 0,
      line_end: typeof loc.line_end === "number" ? loc.line_end : void 0,
      page: typeof loc.page === "number" ? loc.page : void 0,
      section: typeof loc.section === "string" ? loc.section : void 0
    },
    open_path: typeof v.open_path === "string" ? v.open_path : void 0,
    cached: v.cached === true,
    git_commit: typeof v.git_commit === "string" ? v.git_commit : void 0
  };
}
function projectTurns(entries) {
  const turns = [], byTurn = /* @__PURE__ */ new Map(), calls = /* @__PURE__ */ new Map();
  let current;
  for (const entry of entries) {
    if (entry.type !== "event") continue;
    const event = entry.event, data = record(event.data), number = typeof data.turn === "number" ? data.turn : current?.number;
    if (event.type === "turn/start") {
      current = {
        seq: event.seq,
        number: number ?? event.seq,
        start: event.time,
        question: "",
        calls: [],
        sources: [],
        warnings: []
      };
      turns.push(current);
      byTurn.set(current.number, current);
    } else if (number !== void 0) {
      current = byTurn.get(number);
      if (!current) {
        current = {
          seq: event.seq,
          number,
          start: event.time,
          question: "\uFF08\u672C\u8F6E\u5F00\u5934\u5C1A\u672A\u52A0\u8F7D\uFF09",
          calls: [],
          sources: [],
          warnings: []
        };
        turns.push(current);
        byTurn.set(number, current);
      }
    }
    if (!current) continue;
    if (event.type === "user/message" && record(data.source).kind === "user")
      current.question = text(data.content) || current.question;
    if (event.type === "tool/call" || event.type === "tool/ptc-dispatch-start") {
      const id = str(data.subCallId) || str(data.callId);
      if (!id) continue;
      const call = {
        id,
        parentId: str(data.parentCallId) || void 0,
        name: str(data.name) || "tool",
        start: event.time,
        status: "running",
        input: summary(data.arguments),
        output: ""
      };
      current.calls.push(call);
      calls.set(id, { turn: current, call });
    }
    if (event.type === "tool/result" || event.type === "tool/ptc-dispatch") {
      const message = record(data.message), id = str(data.subCallId) || str(message.toolCallId) || str(data.callId);
      let existing = calls.get(id);
      if (!existing) {
        const call2 = {
          id: id || `partial-${event.seq}`,
          name: str(data.name) || "tool\uFF08\u8C03\u7528\u5934\u672A\u52A0\u8F7D\uFF09",
          start: event.time,
          status: "running",
          input: "",
          output: ""
        };
        current.calls.push(call2);
        existing = { turn: current, call: call2 };
        calls.set(call2.id, existing);
      }
      const { call, turn } = existing;
      call.end = event.time;
      call.status = data.isError ?? message.isError ? "error" : "ok";
      call.output = summary(text(data.content ?? message.content));
      const meta = record(data.meta);
      if (Array.isArray(meta.sources))
        for (const candidate of meta.sources) {
          const item = source(candidate);
          if (!item) continue;
          const i = turn.sources.findIndex((s) => s.source_id === item.source_id);
          if (i < 0) turn.sources.push(item);
          else if (item.status === "read" || turn.sources[i].status !== "read")
            turn.sources[i] = item;
        }
      if (Array.isArray(meta.warnings))
        turn.warnings.push(...meta.warnings.filter((x) => typeof x === "string"));
      if (meta.status === "error") call.status = "error";
    }
    if (event.type === "turn/end") {
      current.end = event.time;
      current.reason = str(record(data.reason).kind) || str(data.reason);
    }
  }
  return turns;
}
function workState(lifecycle, entries, waiting = false) {
  const turns = projectTurns(entries), turn = turns.at(-1), base = { busy: false, started: turn?.start, ended: turn?.end };
  if (lifecycle.removed)
    return { ...base, phase: "error", label: "\u4F1A\u8BDD\u5DF2\u79FB\u9664", detail: "\u8BF7\u4ECE\u4FA7\u680F\u91CD\u65B0\u9009\u62E9\u4F1A\u8BDD" };
  if (lifecycle.openState === "error")
    return {
      ...base,
      phase: "error",
      label: "\u8FDE\u63A5\u5F02\u5E38",
      detail: "\u4F1A\u8BDD\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 Harness \u8FDE\u63A5"
    };
  if (lifecycle.openState === "cold" || lifecycle.openState === "loading")
    return { ...base, phase: "loading", label: "\u540C\u6B65\u4F1A\u8BDD\u4E2D", detail: "\u6B63\u5728\u6062\u590D\u771F\u5B9E\u5386\u53F2\u4E0E\u8FD0\u884C\u72B6\u6001" };
  if (lifecycle.promptError)
    return {
      ...base,
      busy: lifecycle.running,
      phase: "error",
      label: "\u64CD\u4F5C\u672A\u6210\u529F",
      detail: "\u8BF7\u67E5\u770B\u539F\u751F\u5BF9\u8BDD\u4E2D\u7684\u53D1\u9001\u6216\u505C\u6B62\u9519\u8BEF"
    };
  if (waiting)
    return {
      ...base,
      busy: lifecycle.running,
      phase: "waiting",
      label: "\u7B49\u5F85\u786E\u8BA4",
      detail: "\u8BF7\u5728\u539F\u751F\u5BA1\u6279\u6216\u63D0\u95EE\u9762\u677F\u4E2D\u7EE7\u7EED"
    };
  if (lifecycle.awaitingFirstTurn || !lifecycle.running && lifecycle.pendingSubmissions.length > 0)
    return {
      ...base,
      busy: true,
      phase: "sending",
      label: "\u6B63\u5728\u63D0\u4EA4",
      detail: "\u7B49\u5F85 Host \u63A5\u7EB3\u672C\u8F6E\u8BF7\u6C42"
    };
  if (lifecycle.running) {
    const active = turn && !turn.end ? turn : void 0;
    const pending = active?.calls.filter((c) => c.status === "running") ?? [];
    const call = pending.at(-1), busy = { ...base, busy: true, ended: void 0, started: active?.start };
    if (call) {
      const phase = /search|find|grep/i.test(call.name) ? "searching" : /read|fetch|open/i.test(call.name) ? "reading" : "working";
      return {
        ...busy,
        phase,
        label: phase === "searching" ? "\u68C0\u7D22\u8D44\u6599\u4E2D" : phase === "reading" ? "\u8BFB\u53D6\u539F\u6587\u4E2D" : "\u6267\u884C\u5DE5\u5177\u4E2D",
        detail: call.name + (pending.length > 1 ? ` \xB7 ${pending.length} \u9879\u5E76\u884C` : "")
      };
    }
    const live = entries.at(-1)?.event;
    if (active && (active.calls.length || live?.type === "assistant/live-chunk"))
      return { ...busy, phase: "answering", label: "\u6574\u7406\u56DE\u7B54\u4E2D", detail: "\u6B63\u5728\u751F\u6210\u7ED3\u8BBA\u4E0E\u5F15\u7528" };
    return { ...busy, phase: "working", label: "Agent \u5DE5\u4F5C\u4E2D", detail: "\u7B49\u5F85\u6A21\u578B\u54CD\u5E94" };
  }
  if (turn?.reason === "completed")
    return { ...base, phase: "completed", label: "\u672C\u8F6E\u5DF2\u5B8C\u6210", detail: "\u53EF\u4EE5\u7EE7\u7EED\u8FFD\u95EE\u5F53\u524D\u5DE5\u7A0B" };
  if (turn?.reason === "aborted")
    return { ...base, phase: "stopped", label: "\u5DF2\u505C\u6B62", detail: "Host \u5DF2\u786E\u8BA4\u672C\u8F6E\u505C\u6B62" };
  if (turn?.reason === "interrupted" || turn?.reason === "forked")
    return {
      ...base,
      phase: "interrupted",
      label: "\u672C\u8F6E\u5DF2\u4E2D\u65AD",
      detail: "\u5386\u53F2\u56DE\u5408\u672A\u6B63\u5E38\u5B8C\u6210\uFF0C\u53EF\u7EE7\u7EED\u63D0\u95EE"
    };
  if (turn?.reason === "blocked")
    return { ...base, phase: "waiting", label: "\u6267\u884C\u53D7\u963B", detail: "\u8BF7\u67E5\u770B\u539F\u751F\u5BF9\u8BDD\u4E2D\u7684\u63D0\u793A" };
  if (turn?.reason === "error" || turn?.reason === "max-tokens" || lifecycle.lastAgentError)
    return { ...base, phase: "error", label: "\u672C\u8F6E\u672A\u5B8C\u6210", detail: "\u8BF7\u67E5\u770B\u6A21\u578B\u9519\u8BEF\u6216\u8F93\u51FA\u9650\u5236\u63D0\u793A" };
  return {
    ...base,
    phase: "ready",
    label: "\u5DF2\u5C31\u7EEA",
    detail: turn ? "Host \u5F53\u524D\u7A7A\u95F2\uFF1B\u672C\u8F6E\u7ED3\u675F\u8BB0\u5F55\u5C1A\u672A\u786E\u8BA4" : "\u968F\u65F6\u5F00\u59CB\u65B0\u7684\u5DE5\u7A0B\u4EFB\u52A1"
  };
}
function externalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : void 0;
  } catch {
    return;
  }
}
function exportTrace(turn) {
  return redact({
    schema: "xien-trace-v1",
    turn: turn.number,
    started_at: turn.start,
    ended_at: turn.end,
    reason: turn.reason,
    calls: turn.calls,
    sources: turn.sources,
    warnings: turn.warnings
  });
}

// src/client.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var inject = ["slots", "sessions", "configForms", "sidebarRight", "sidebarRightTabs"];
var TAB = "xien-engineering-evidence";
var empty = {
  entries: [],
  hasMore: false,
  revision: 0,
  change: { kind: "replace", entries: [] }
};
var noEvents = { getSnapshot: () => empty, subscribe: () => () => {
} };
function useWindow(events) {
  return (0, import_react.useSyncExternalStore)(events.subscribe.bind(events), events.getSnapshot.bind(events));
}
function useTime(state) {
  const [now, setNow] = (0, import_react.useState)(Date.now());
  (0, import_react.useEffect)(() => {
    if (!state.busy) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, [state.busy, state.started]);
  if (!state.started) return "";
  const value = Math.max(0, ((state.ended ?? now) - state.started) / 1e3);
  return `${value.toFixed(value < 10 ? 1 : 0)} s`;
}
function WorkBar({ state, action }) {
  const elapsed = useTime(state);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      className: "xien-workbar",
      role: "status",
      "aria-live": "polite",
      "data-busy": state.busy,
      "data-phase": state.phase,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "xien-dot" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: state.label }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: state.detail }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "xien-clock", "aria-live": "off", children: elapsed }),
        action && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: "xien-evidence-button",
            onClick: action,
            "aria-label": "\u6253\u5F00\u5DE5\u7A0B\u8BC1\u636E",
            children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EvidenceIcon, {})
          }
        )
      ]
    }
  );
}
function Status(props) {
  const snapshot = props.useSession((v) => v), window = useWindow(props.events), waiting = props.useSessionStatus((v) => !!v.get(props.sessionId)?.pendingInteraction);
  const state = (0, import_react.useMemo)(
    () => workState(snapshot, window.entries, waiting),
    [snapshot, window, waiting]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(WorkBar, { state, action: () => props.openEvidence() });
}
function Header(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "button",
    {
      type: "button",
      className: "xien-evidence-button",
      onClick: () => props.openEvidence(),
      title: "\u6253\u5F00\u5F53\u524D\u4F1A\u8BDD\u7684\u5DE5\u7A0B\u8BC1\u636E",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EvidenceIcon, {}),
        "\u5DE5\u7A0B\u8BC1\u636E"
      ]
    }
  );
}
function Tail(props) {
  const window = useWindow(props.events), turn = (0, import_react.useMemo)(
    () => projectTurns(window.entries).find((t) => t.number === props.turn.turn),
    [window, props.turn]
  );
  if (!turn?.sources.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-tail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
      turn.sources.length,
      " \u6761\u5DE5\u7A0B\u8BC1\u636E \xB7 ",
      turn.sources.filter((s) => s.status === "read").length,
      " ",
      "\u6761\u5DF2\u8BFB\u53D6"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => props.openEvidence(turn.number), children: "\u67E5\u770B\u672C\u8F6E\u8BC1\u636E \u2197" })
  ] });
}
function SourceCard({
  item,
  index,
  openLocal
}) {
  const [error, setError] = (0, import_react.useState)(""), url = externalUrl(item.original_url), local = item.type === "sdk" && (item.open_path ?? item.locator.path);
  const location = item.locator.page ? `PDF \u7269\u7406\u9875 ${item.locator.page}` : item.locator.line_start ? `L${item.locator.line_start}${item.locator.line_end ? `\u2013${item.locator.line_end}` : ""}` : item.locator.section;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "xien-source", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-source-top", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "xien-source-index", children: String(index + 1).padStart(2, "0") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "xien-tag", children: item.type.toUpperCase() }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "xien-tag", children: item.version ?? "\u7248\u672C\u5F85\u786E\u8BA4" }),
      item.cached && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "xien-tag", children: "CACHE" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: item.title }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: item.snippet }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-location", children: [
      item.locator.path ?? (item.chip ? item.chip : ""),
      location && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
        location
      ] }),
      item.git_commit && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
        "Git ",
        item.git_commit.slice(0, 12)
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-source-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: item.status === "read" ? "\u2713 \u5DF2\u8BFB\u53D6\u539F\u6587" : "\u25CB \u4EC5\u641C\u7D22\u547D\u4E2D" }),
      local ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          onClick: () => {
            setError("");
            try {
              openLocal(local);
            } catch (e) {
              setError(String(e));
            }
          },
          children: "\u67E5\u770B\u539F\u6587 \u2197"
        }
      ) : url ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { href: url, target: "_blank", rel: "noreferrer noopener", children: [
        item.type === "manual" ? "\u67E5\u770B\u539F\u4EF6" : "\u67E5\u770B\u6765\u6E90",
        " \u2197"
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u539F\u6587\u5730\u5740\u4E0D\u53EF\u7528" })
    ] }),
    item.applicability !== "as_documented" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "xien-notice", children: item.applicability === "conflict" ? "\u578B\u53F7\u6216\u7248\u672C\u5B58\u5728\u51B2\u7A81\uFF0C\u8BF7\u5BF9\u7167\u539F\u4EF6\u590D\u6838\u3002" : "\u9002\u7528\u6027\u5F85\u590D\u6838\uFF1A\u5DF2\u8BFB\u53D6\u4E0D\u4EE3\u8868\u5DF2\u6838\u9A8C\u578B\u53F7\u548C\u7248\u672C\u3002" }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "xien-inline-error", role: "alert", children: error })
  ] });
}
function Sources({
  turn,
  openLocal
}) {
  const [limit, setLimit] = (0, import_react.useState)(5);
  (0, import_react.useEffect)(() => setLimit(5), [turn?.seq]);
  if (!turn?.sources.length)
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EvidenceIcon, {}),
      "\u672C\u8F6E\u6682\u65E0\u5DE5\u7A0B\u8BC1\u636E\u3002",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
      "\u4F7F\u7528 hpm_search / hpm_read \u540E\u4F1A\u81EA\u52A8\u663E\u793A\u3002",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
      "\u539F\u751F\u5DE5\u5177\u7ED3\u679C\u7EE7\u7EED\u4FDD\u7559\u5728\u5BF9\u8BDD\u4E2D\u3002"
    ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-summary", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u672C\u8F6E\u6765\u6E90" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        turn.sources.length,
        " \u6761 \xB7 ",
        turn.sources.filter((s) => s.status === "read").length,
        " ",
        "\u6761\u5DF2\u8BFB\u53D6"
      ] })
    ] }),
    turn.sources.slice(0, limit).map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SourceCard, { item, index: i, openLocal }, item.source_id)),
    limit < turn.sources.length && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "xien-more", onClick: () => setLimit((n) => n + 5), children: "\u7EE7\u7EED\u5C55\u5F00\u6765\u6E90 \u2193" }),
    [...new Set(turn.warnings)].map((message, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "xien-notice", children: String(redact(message)) }, i))
  ] });
}
function saveTrace(turn) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(exportTrace(turn), null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `xien-trace-turn-${turn.number}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function Trace({ turn }) {
  if (!turn?.calls.length)
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-empty", children: [
      "\u672C\u8F6E\u5C1A\u65E0\u5DE5\u5177\u8C03\u7528\u3002",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
      "\u8FD9\u91CC\u53EA\u5C55\u793A\u5DF2\u89C2\u6D4B\u5230\u7684\u8C03\u7528\u8BB0\u5F55\u3002"
    ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-summary", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("strong", { children: [
        turn.calls.length,
        " \u6B21\u771F\u5B9E\u8C03\u7528"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "xien-button", onClick: () => saveTrace(turn), children: "\u5BFC\u51FA\u8131\u654F\u8BB0\u5F55 \u2193" })
    ] }),
    turn.calls.map((call, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "xien-call", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: String(index + 1).padStart(2, "0") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: call.name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: call.status === "running" ? "\u6267\u884C\u4E2D" : call.status === "error" ? "\u5F02\u5E38" : "\u5B8C\u6210" })
      ] }),
      call.parentId && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-location", children: [
        "\u7236\u8C03\u7528 ",
        call.parentId
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { children: "\u8F93\u5165" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: call.input || "\u8C03\u7528\u5934\u4E0D\u5728\u5DF2\u52A0\u8F7D\u5386\u53F2\u4E2D" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { children: "\u8F93\u51FA\u6458\u8981" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: call.output || "\u7B49\u5F85\u5DE5\u5177\u8FD4\u56DE" }),
      call.end !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-location", children: [
        Math.max(0, call.end - call.start),
        " ms"
      ] })
    ] }, call.id)),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "xien-notice", children: "\u8C03\u7528\u8F93\u5165\u8F93\u51FA\u5DF2\u8131\u654F\u3002\u6765\u6E90\u5185\u5BB9\u5C5E\u4E8E\u5916\u90E8\u8D44\u6599\uFF0C\u4E0D\u80FD\u89C6\u4E3A\u6267\u884C\u6307\u4EE4\u3002" })
  ] });
}
function Connections({ form }) {
  const state = (0, import_react.useSyncExternalStore)(form.subscribe.bind(form), form.getSnapshot.bind(form)), [draft, setDraft] = (0, import_react.useState)({}), [message, setMessage] = (0, import_react.useState)(""), [saving, setSaving] = (0, import_react.useState)(false);
  const fields = [
    ["chip", "\u9ED8\u8BA4\u82AF\u7247", "\u5982 HPM6200"],
    ["board", "\u9ED8\u8BA4\u677F\u5361", "\u6309\u5F53\u524D\u5DE5\u7A0B\u586B\u5199"],
    ["sdkVersion", "SDK \u7248\u672C", "\u5982 1.13.0"],
    ["sdkRoots", "\u672C\u5730 SDK \u76EE\u5F55", "\u6BCF\u884C\u4E00\u4E2A Host \u53EF\u8BBF\u95EE\u7684\u76EE\u5F55"],
    ["teamUrl", "\u56E2\u961F\u624B\u518C\u670D\u52A1\u5730\u5740", "https://\u2026"],
    ["teamToken", "\u4E2A\u4EBA\u8BBF\u95EE\u51ED\u636E", "\u5DF2\u4FDD\u5B58\u503C\u7531 Host \u4FDD\u7BA1\uFF1B\u7559\u7A7A\u4E0D\u4FEE\u6539"]
  ];
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const entries = Object.entries(draft).filter(
        ([key, value]) => key !== "teamToken" || value.trim()
      );
      if (!entries.length) {
        setMessage("\u6CA1\u6709\u9700\u8981\u4FDD\u5B58\u7684\u4FEE\u6539");
        return;
      }
      const ok = await form.mutate(
        entries.map(([key, value]) => ({
          op: "set",
          path: [key],
          value: key === "sdkRoots" ? value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : value
        }))
      );
      setMessage(ok ? "\u5DF2\u4FDD\u5B58\u5230\u5F53\u524D Host" : "Host \u672A\u63A5\u53D7\u4FEE\u6539\uFF0C\u8BF7\u5237\u65B0\u914D\u7F6E\u540E\u91CD\u8BD5");
      if (ok) setDraft({});
    } catch (e) {
      setMessage(String(redact(String(e))));
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "form",
    {
      className: "xien-config",
      onSubmit: (e) => {
        e.preventDefault();
        void save();
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u8D44\u6599\u8FDE\u63A5" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
          "\u76EE\u5F55\u7531 Harness Host \u8BFB\u53D6\u3002\u9879\u76EE\u53EF\u4F7F\u7528 ",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: ".hpm-knowledge.json" }),
          " \u6307\u5B9A",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: "sdkRoot" }),
          "\u3002"
        ] }),
        state.status !== "ready" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "xien-notice", children: state.status === "loading" ? "\u6B63\u5728\u8BFB\u53D6 Host \u914D\u7F6E\u2026" : "Host \u672A\u63D0\u4F9B\u6B64\u63D2\u4EF6\u914D\u7F6E\uFF1B\u8BF7\u68C0\u67E5\u63D2\u4EF6\u5DF2\u52A0\u8F7D\u4E14\u5F53\u524D\u7528\u6237\u6709\u8BBF\u95EE\u6743\u9650\u3002" }),
        fields.map(([key, label, placeholder]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
          label,
          key === "sdkRoots" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "textarea",
            {
              disabled: !state.writable || saving,
              placeholder,
              value: draft[key] ?? state.value?.sdkRoots?.join("\n") ?? "",
              onChange: (e) => setDraft({ ...draft, [key]: e.target.value })
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: key === "teamToken" ? "password" : "text",
              autoComplete: "off",
              disabled: !state.writable || saving,
              placeholder,
              value: draft[key] ?? (key === "teamToken" ? "" : String(state.value?.[key] ?? "")),
              onChange: (e) => setDraft({ ...draft, [key]: e.target.value })
            }
          )
        ] }, key)),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "submit",
            className: "xien-button xien-primary",
            disabled: state.status !== "ready" || !state.writable || saving || !Object.keys(draft).length,
            children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5230\u4E2A\u4EBA Host"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "status", children: message }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "xien-notice", children: "\u672A\u914D\u7F6E\u7684\u670D\u52A1\u4E0D\u4F1A\u663E\u793A\u4E3A\u5DF2\u8FDE\u63A5\u3002\u51ED\u636E\u4EC5\u53D1\u9001\u7ED9 Host\uFF0C\u4E0D\u5B58\u5165\u6D4F\u89C8\u5668\u672C\u5730\u5B58\u50A8\u6216\u8C03\u7528\u94FE\u5BFC\u51FA\u3002" })
      ]
    }
  );
}
function EvidencePanel(props) {
  const window = useWindow(props.events), snapshot = props.useSession((v) => v), waiting = props.useSessionStatus((v) => !!v.get(props.sessionId)?.pendingInteraction), info = props.useTabInfo();
  const turns = (0, import_react.useMemo)(() => projectTurns(window.entries), [window]), state = (0, import_react.useMemo)(() => workState(snapshot, window.entries, waiting), [snapshot, window, waiting]);
  const [tab, setTab] = (0, import_react.useState)("sources"), [selected, setSelected] = (0, import_react.useState)(), [error, setError] = (0, import_react.useState)("");
  const navigation = info.tab.navigation;
  (0, import_react.useEffect)(() => {
    const params = navigation.params;
    setSelected(typeof params?.turn === "number" ? params.turn : void 0);
    setTab("sources");
  }, [navigation.revision]);
  const turn = selected === void 0 ? turns.at(-1) : turns.find((t) => t.number === selected);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "xien-panel", "aria-label": "\u5DE5\u7A0B\u8BC1\u636E", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "xien-panel-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5DE5\u7A0B\u8BC1\u636E" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u968F\u4F1A\u8BDD\u5173\u8054" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(WorkBar, { state }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "xien-tabs", role: "tablist", "aria-label": "\u5DE5\u7A0B\u8BC1\u636E\u5185\u5BB9", children: [
      ["sources", "\u76F8\u5173\u8D44\u6599"],
      ["trace", "\u8C03\u7528\u94FE"],
      ["connection", "\u8D44\u6599\u8FDE\u63A5"]
    ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        role: "tab",
        id: `xien-tab-${props.sessionId}-${key}`,
        "aria-controls": `xien-content-${props.sessionId}`,
        "aria-selected": tab === key,
        onClick: () => setTab(key),
        children: [
          label,
          key === "sources" && !!turn?.sources.length && ` ${turn.sources.length}`
        ]
      },
      key
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        className: "xien-panel-body",
        role: "tabpanel",
        id: `xien-content-${props.sessionId}`,
        "aria-labelledby": `xien-tab-${props.sessionId}-${tab}`,
        children: [
          tab !== "connection" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "xien-turn-picker", children: [
            "\u56DE\u5408",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                value: selected ?? "latest",
                onChange: (e) => setSelected(e.target.value === "latest" ? void 0 : Number(e.target.value)),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "latest", children: "\u6700\u65B0\u4E00\u8F6E \xB7 \u81EA\u52A8\u8DDF\u968F" }),
                  [...turns].reverse().map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: t.number, children: [
                    t.number,
                    " \xB7 ",
                    t.question.slice(0, 40) || "\u5DE5\u7A0B\u95EE\u9898"
                  ] }, t.seq))
                ]
              }
            )
          ] }),
          selected !== void 0 && !turn && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "xien-notice", children: "\u8BE5\u56DE\u5408\u4E0D\u5728\u5DF2\u52A0\u8F7D\u5386\u53F2\u4E2D\uFF0C\u8BF7\u52A0\u8F7D\u66F4\u65E9\u8BB0\u5F55\u3002" }),
          tab === "sources" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Sources, { turn, openLocal: props.openLocal }) : tab === "trace" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Trace, { turn }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Connections, { form: props.form }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { role: "alert", className: "xien-inline-error", children: error }),
          tab !== "connection" && window.hasMore && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              className: "xien-more",
              disabled: snapshot.loadingOlder,
              onClick: () => {
                setError("");
                void props.loadOlder().catch((e) => setError(String(e)));
              },
              children: snapshot.loadingOlder ? "\u6B63\u5728\u52A0\u8F7D\u2026" : "\u52A0\u8F7D\u66F4\u65E9\u56DE\u5408 \u2193"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("footer", { className: "xien-panel-footer", children: "EVIDENCE BEFORE CONCLUSIONS" })
  ] });
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.xienUi = "theme";
    style.textContent = theme;
    document.head.appendChild(style);
    document.body.classList.add("xien-ui");
    return () => {
      style.remove();
      document.body.classList.remove("xien-ui");
    };
  });
  const face = (id) => ({
    events: ctx.sessions.binding(id)?.eventSource ?? noEvents,
    openEvidence: (turn) => {
      if (ctx.sidebarRight.mounted.getSnapshot() !== id)
        throw new Error("\u5F53\u524D\u4F1A\u8BDD\u5C1A\u672A\u6302\u8F7D\uFF0C\u8BF7\u5728\u6240\u5C5E\u4F1A\u8BDD\u4E2D\u91CD\u8BD5\u3002");
      ctx.sidebarRight.openTab(TAB, { params: { turn } });
    }
  });
  ctx.slots.inject(
    "sidebar.brand.mark",
    () => ctx.slots.register({ name: "sidebar.brand.mark", priority: -100 }, ({ size }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(BrandMark, { size: Math.max(size, 32) }))
  );
  ctx.slots.inject(
    "sidebar.brand.name",
    () => ctx.slots.register({ name: "sidebar.brand.name", priority: -100 }, BrandName)
  );
  ctx.slots.inject(
    "conversation.hero.brand.mark",
    () => ctx.slots.register({ name: "conversation.hero.brand.mark", priority: -100 }, BrandMark)
  );
  ctx.slots.inject(
    "conversation.input.dock",
    () => ctx.slots.register(
      { name: "conversation.input.dock", id: "xien-work-status", order: 90, inject: face },
      Status
    )
  );
  ctx.slots.inject(
    "conversation.session.header.utilities",
    () => ctx.slots.register(
      {
        name: "conversation.session.header.utilities",
        id: "xien-evidence",
        order: 90,
        inject: face
      },
      Header
    )
  );
  ctx.slots.inject(
    "conversation.chat.turnTail",
    () => ctx.slots.register(
      { name: "conversation.chat.turnTail", id: "xien-evidence-tail", order: 85, inject: face },
      Tail
    )
  );
  ctx.effect(
    () => ctx.sidebarRightTabs.register({
      id: TAB,
      kind: TAB,
      priority: "extension",
      title: () => "\u5DE5\u7A0B\u8BC1\u636E",
      guide: [
        {
          id: "xien-evidence",
          order: 50,
          title: () => "\u5DE5\u7A0B\u8BC1\u636E",
          description: () => "\u67E5\u770B\u672C\u8F6E\u8D44\u6599\u3001\u5DE5\u5177\u8BB0\u5F55\u548C\u8D44\u6599\u8FDE\u63A5"
        }
      ]
    })
  );
  ctx.slots.inject(
    "sidebar.right.pane.tab",
    () => ctx.slots.register(
      {
        name: "sidebar.right.pane.tab",
        key: TAB,
        inject: (id) => ({
          events: ctx.sessions.binding(id)?.eventSource ?? noEvents,
          form: ctx.configForms.get("xien-ui"),
          openLocal: (path) => {
            if (ctx.sidebarRight.mounted.getSnapshot() !== id)
              throw new Error("\u8BF7\u5148\u8FD4\u56DE\u6240\u5C5E\u4F1A\u8BDD\u518D\u6253\u5F00\u539F\u6587\u3002");
            ctx.sidebarRight.openResource(
              fileAddressFor(id, ctx.sessions.list.getSnapshot().byId[id]?.cwd, path)
            );
          },
          loadOlder: () => ctx.sessions.binding(id)?.session.loadOlder() ?? Promise.resolve()
        })
      },
      EvidencePanel
    )
  );
}
return module.exports;}});
