"use client";
/* eslint-disable */
// @ts-nocheck

import * as React from "react";

const __ds_scope = {};

// components/feedback/Tooltip.jsx
(() => {
const {
  useState
} = React;
function Tooltip({
  label,
  children,
  side = "top",
  forceOpen
}) {
  const [on, setOn] = useState(false);
  const show = on || forceOpen;
  const pos = side === "top" ? {
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  } : side === "bottom" ? {
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  } : side === "start" ? {
    right: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)"
  } : {
    left: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)"
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    },
    onMouseEnter: () => setOn(true),
    onMouseLeave: () => setOn(false),
    onFocus: () => setOn(true),
    onBlur: () => setOn(false)
  }, children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    className: "hti-fade-in",
    style: {
      position: "absolute",
      zIndex: 60,
      background: "var(--hti-ink)",
      color: "#fff",
      borderRadius: "var(--radius-sm)",
      padding: "6px 10px",
      font: "var(--type-body-sm)",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      ...pos
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})();

// components/forms/FieldLabel.jsx
(() => {
function FieldLabel({
  children,
  htmlFor,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      display: "block",
      font: "var(--type-label)",
      color: "var(--gray-700)",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { FieldLabel });
})();

// components/forms/RadioGroup.jsx
(() => {
const {
  useState
} = React;
function RadioCard({
  option,
  selected,
  onSelect
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    role: "radio",
    "aria-checked": selected,
    tabIndex: 0,
    onClick: onSelect,
    onKeyDown: e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onSelect();
      }
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: 12,
      borderRadius: "var(--radius-control)",
      border: "2px solid " + (selected ? "var(--color-primary)" : hover ? "var(--teal-300)" : "var(--border-default)"),
      background: selected ? "var(--color-primary-soft)" : hover ? "var(--teal-50)" : "#fff",
      padding: "12px 16px",
      cursor: "pointer",
      outline: "none",
      transition: "all var(--dur-base)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: "50%",
      border: "2px solid " + (selected ? "var(--color-primary)" : "var(--gray-300)"),
      background: selected ? "var(--color-primary)" : "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: "all var(--dur-base)"
    }
  }, selected && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#fff"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: selected ? "var(--color-primary-hover)" : "var(--gray-600)"
    }
  }, option.label), option.description && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 2,
      font: "var(--type-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, option.description)));
}
function RadioGroup({
  options = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      ...style
    }
  }, options.map(o => /*#__PURE__*/React.createElement(RadioCard, {
    key: o.value,
    option: o,
    selected: value === o.value,
    onSelect: () => onChange && onChange(o.value)
  })));
}
Object.assign(__ds_scope, { RadioGroup });
})();

// components/layout/Card.jsx
(() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  padding = "md",
  elevation = "lg",
  tone = "white",
  style,
  ...rest
}) {
  const pad = {
    none: 0,
    sm: 16,
    md: 24,
    lg: 32
  }[padding];
  const bg = {
    white: "#fff",
    subtle: "var(--surface-subtle)",
    brand: "var(--color-primary-soft)"
  }[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: bg,
      borderRadius: tone === "white" ? "var(--radius-card)" : "var(--radius-control)",
      boxShadow: tone === "white" ? "var(--shadow-" + elevation + ")" : "none",
      padding: pad,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})();

// components/layout/SectionHeader.jsx
(() => {
function SectionHeader({
  title,
  description,
  divider = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 12,
      marginBottom: 4,
      borderBottom: divider ? "1px solid var(--border-subtle)" : "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-h2)",
      color: "var(--text-brand)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, description));
}
Object.assign(__ds_scope, { SectionHeader });
})();

// components/layout/SummaryItem.jsx
(() => {
function SummaryItem({
  label,
  value,
  ltr,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "8px 0",
      borderBottom: last ? "none" : "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    dir: ltr ? "ltr" : undefined,
    style: {
      font: "var(--type-label)",
      color: "var(--text-brand)",
      textAlign: "end"
    }
  }, value));
}
Object.assign(__ds_scope, { SummaryItem });
})();

// components/lib/Icon.jsx
(() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Thin Lucide wrapper: renders the icon's SVG paths from the CDN-loaded lucide global, or a named inline fallback set.
const P = {
  "calendar": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  "check-circle": '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  "eye-off": '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  "loader-2": '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  "alert-circle": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
  "more-horizontal": '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  "pencil": '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  "trash-2": '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  "filter": '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  "home": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "bell": '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "list": '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>'
};
function Icon({
  name,
  size = 20,
  className,
  style,
  spin,
  ...rest
}) {
  const d = P[name] || P["info"];
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className: [className, spin ? "hti-spin" : ""].filter(Boolean).join(" "),
    style: {
      flexShrink: 0,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: d
    }
  }, rest));
}
const ICON_NAMES = Object.keys(P);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})();

// components/data/Calendar.jsx
(() => {
const {
  useState
} = React;
const HE_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const HE_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function NavBtn({
  icon,
  onClick,
  label
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--radius-sm)",
      border: "none",
      background: h ? "var(--color-primary-soft)" : "transparent",
      color: h ? "var(--color-primary)" : "var(--gray-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }));
}
function DayBtn({
  d,
  selected,
  today,
  outside,
  disabled,
  available,
  onClick
}) {
  const [h, setH] = useState(false);
  const bg = selected ? "var(--color-primary)" : h && !disabled ? "var(--color-primary-soft)" : today ? "var(--color-accent-soft)" : "transparent";
  const color = selected ? "#fff" : disabled ? "var(--gray-300)" : outside ? "var(--gray-400)" : h ? "var(--color-primary-hover)" : "var(--text-primary)";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: "100%",
      aspectRatio: "1",
      borderRadius: "var(--radius-sm)",
      border: today && !selected ? "1px solid var(--green-300)" : "1px solid transparent",
      background: bg,
      color,
      font: "var(--type-body-sm)",
      fontWeight: selected || today ? 500 : 400,
      cursor: disabled ? "default" : "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      transition: "background-color var(--dur-fast)"
    }
  }, d.getDate(), available && !selected && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: "50%",
      background: "var(--color-primary)"
    }
  }));
}
function Calendar({
  value,
  onChange,
  month,
  onMonthChange,
  minDate,
  disabledWeekdays = [6],
  availableDates = [],
  today = new Date(),
  style
}) {
  const [inner, setInner] = useState(month || (value ? new Date(value.getFullYear(), value.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)));
  const view = month || inner;
  const setView = d => {
    onMonthChange ? onMonthChange(d) : setInner(d);
  };
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  const avail = availableDates.map(x => typeof x === "string" ? new Date(x) : x);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      padding: 12,
      background: "#fff",
      borderRadius: "var(--radius-control)",
      border: "1px solid var(--border-default)",
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(NavBtn, {
    icon: "chevron-right",
    label: "\u05D7\u05D5\u05D3\u05E9 \u05E7\u05D5\u05D3\u05DD",
    onClick: () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-h3)",
      color: "var(--text-brand)",
      whiteSpace: "nowrap"
    }
  }, HE_MONTHS[view.getMonth()], " ", /*#__PURE__*/React.createElement("span", {
    dir: "ltr"
  }, view.getFullYear())), /*#__PURE__*/React.createElement(NavBtn, {
    icon: "chevron-left",
    label: "\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0",
    onClick: () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 2,
      marginBottom: 4
    }
  }, HE_DAYS.map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      textAlign: "center",
      font: "var(--type-caption)",
      color: "var(--text-tertiary)",
      padding: "4px 0"
    }
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 2
    }
  }, cells.map((d, i) => {
    const outside = d.getMonth() !== view.getMonth();
    const disabled = minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) || disabledWeekdays.includes(d.getDay());
    return /*#__PURE__*/React.createElement(DayBtn, {
      key: i,
      d: d,
      outside: outside,
      disabled: disabled,
      selected: sameDay(d, value),
      today: sameDay(d, today),
      available: avail.some(a => sameDay(a, d)),
      onClick: () => onChange && onChange(d)
    });
  })));
}
function TimeSlots({
  slots = [],
  value,
  onChange,
  columns = 3,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(" + columns + ", 1fr)",
      gap: 8,
      ...style
    }
  }, slots.map(s => {
    const on = s === value;
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      type: "button",
      dir: "ltr",
      onClick: () => onChange && onChange(s),
      style: {
        height: 40,
        borderRadius: "var(--radius-sm)",
        border: "2px solid " + (on ? "var(--color-primary)" : "var(--border-default)"),
        background: on ? "var(--color-primary)" : "#fff",
        color: on ? "#fff" : "var(--text-primary)",
        font: "var(--type-tabular)",
        cursor: "pointer"
      }
    }, s);
  }));
}
Object.assign(__ds_scope, { Calendar, TimeSlots });
})();

// components/data/Tabs.jsx
(() => {
const {
  useState
} = React;
function Tab({
  t,
  active,
  onClick,
  variant
}) {
  const [h, setH] = useState(false);
  if (variant === "pills") return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "tab",
    "aria-selected": active,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 36,
      padding: "0 14px",
      borderRadius: 999,
      border: "none",
      background: active ? "var(--color-primary)" : h ? "var(--color-primary-soft)" : "transparent",
      color: active ? "#fff" : h ? "var(--color-primary-hover)" : "var(--gray-600)",
      font: "var(--type-label)",
      fontSize: 14,
      cursor: "pointer"
    }
  }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 16
  }), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      background: active ? "rgba(255,255,255,.25)" : "var(--gray-200)",
      borderRadius: 999,
      padding: "0 6px",
      fontSize: 12,
      minWidth: 18,
      textAlign: "center"
    }
  }, t.count));
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "tab",
    "aria-selected": active,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 44,
      padding: "0 4px",
      marginBottom: -1,
      border: "none",
      borderBottom: "2px solid " + (active ? "var(--color-primary)" : "transparent"),
      background: "transparent",
      color: active ? "var(--text-brand)" : h ? "var(--text-primary)" : "var(--gray-600)",
      font: "var(--type-label)",
      cursor: "pointer",
      transition: "color var(--dur-base), border-color var(--dur-base)"
    }
  }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 18
  }), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      background: active ? "var(--color-primary-soft-2)" : "var(--gray-100)",
      color: active ? "var(--teal-800)" : "var(--gray-600)",
      borderRadius: 999,
      padding: "0 6px",
      fontSize: 12,
      minWidth: 18,
      textAlign: "center"
    }
  }, t.count));
}
function Tabs({
  tabs = [],
  value,
  onChange,
  variant = "underline",
  style
}) {
  const [inner, setInner] = useState(tabs[0] && tabs[0].value);
  const v = value !== undefined ? value : inner;
  const set = x => {
    setInner(x);
    onChange && onChange(x);
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      gap: variant === "pills" ? 4 : 24,
      borderBottom: variant === "pills" ? "none" : "1px solid var(--border-default)",
      padding: variant === "pills" ? 4 : 0,
      background: variant === "pills" ? "var(--surface-subtle)" : "transparent",
      borderRadius: variant === "pills" ? 999 : 0,
      width: variant === "pills" ? "fit-content" : "100%",
      ...style
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement(Tab, {
    key: t.value,
    t: t,
    active: t.value === v,
    variant: variant,
    onClick: () => set(t.value)
  })));
}
Object.assign(__ds_scope, { Tabs });
})();

// components/feedback/Alert.jsx
(() => {
const ICON = {
  error: "alert-circle",
  success: "check-circle",
  warning: "alert-triangle",
  info: "info"
};
function Alert({
  tone = "error",
  children,
  title,
  icon = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: tone === "error" ? "alert" : "status",
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--status-" + tone + "-border)",
      background: "var(--status-" + tone + "-bg)",
      color: "var(--status-" + tone + "-fg)",
      padding: 12,
      font: "var(--type-body-sm)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICON[tone],
    size: 18,
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 2
    }
  }, title), children));
}
Object.assign(__ds_scope, { Alert });
})();

// components/feedback/Badge.jsx
(() => {
function Badge({
  tone = "neutral",
  children,
  icon,
  dot,
  size = "md",
  style
}) {
  const t = {
    neutral: ["var(--gray-100)", "var(--gray-700)"],
    brand: ["var(--color-primary-soft-2)", "var(--teal-800)"],
    purple: ["var(--purple-100)", "var(--purple-700)"],
    success: ["var(--green-100)", "var(--green-800)"],
    error: ["var(--red-100)", "var(--red-600)"],
    warning: ["var(--amber-100)", "var(--amber-600)"],
    info: ["var(--blue-100)", "var(--blue-600)"],
    solid: ["var(--color-primary)", "#fff"]
  }[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: t[0],
      color: t[1],
      borderRadius: 999,
      padding: size === "sm" ? "2px 8px" : "4px 10px",
      font: "var(--type-body-sm)",
      fontWeight: 500,
      fontSize: size === "sm" ? 12 : 14,
      lineHeight: 1.3,
      whiteSpace: "nowrap",
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "currentColor"
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), children);
}
Object.assign(__ds_scope, { Badge });
})();

// components/feedback/EmptyState.jsx
(() => {
function EmptyState({
  icon = "calendar",
  title,
  description,
  action,
  tone = "neutral",
  style
}) {
  const c = tone === "success" ? ["var(--green-100)", "var(--green-600)"] : tone === "brand" ? ["var(--color-primary-soft)", "var(--color-primary)"] : ["var(--gray-100)", "var(--gray-500)"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 8,
      padding: 24,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: c[0],
      color: c[1],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 40
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-h2)",
      fontSize: 24,
      color: "var(--text-brand)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-secondary)"
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      width: "100%"
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})();

// components/feedback/Pill.jsx
(() => {
function Pill({
  icon,
  children,
  tone = "brand",
  style
}) {
  const t = tone === "brand" ? {
    background: "var(--color-primary-soft)",
    color: "var(--text-brand)"
  } : tone === "purple" ? {
    background: "var(--purple-50)",
    color: "var(--purple-600)"
  } : {
    background: "var(--gray-100)",
    color: "var(--gray-700)"
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: 999,
      padding: "8px 16px",
      font: "var(--type-label)",
      whiteSpace: "nowrap",
      ...t,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  }), children);
}
Object.assign(__ds_scope, { Pill });
})();

// components/feedback/ProgressSteps.jsx
(() => {
function ProgressSteps({
  steps = 2,
  current = 1,
  complete = false,
  labels,
  style
}) {
  const items = [];
  for (let i = 1; i <= steps; i++) {
    const done = complete || current > i;
    const active = current >= i;
    items.push(/*#__PURE__*/React.createElement("div", {
      key: "s" + i,
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: labels ? 72 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: "var(--type-body-sm)",
        fontWeight: 500,
        background: active ? "var(--color-primary)" : "var(--gray-200)",
        color: active ? "#fff" : "var(--gray-500)",
        transition: "background-color var(--dur-base)"
      }
    }, done ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 18,
      strokeWidth: "2.5"
    }) : i), labels && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-caption)",
        fontWeight: active ? 500 : 400,
        color: active ? "var(--text-brand)" : "var(--text-tertiary)",
        whiteSpace: "nowrap"
      }
    }, labels[i - 1])));
    if (i < steps) items.push(/*#__PURE__*/React.createElement("div", {
      key: "l" + i,
      style: {
        width: 48,
        height: 4,
        borderRadius: 999,
        background: complete || current > i ? "var(--color-primary)" : "var(--gray-200)",
        marginTop: labels ? 14 : 0,
        marginInline: labels ? -20 : 0,
        transition: "background-color var(--dur-base)"
      }
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: labels ? "flex-start" : "center",
      justifyContent: "center",
      gap: 8,
      ...style
    }
  }, items);
}
Object.assign(__ds_scope, { ProgressSteps });
})();

// components/forms/Checkbox.jsx
(() => {
const {
  useState
} = React;
function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  indeterminate,
  style
}) {
  const [hover, setHover] = useState(false);
  const on = checked || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? "var(--opacity-disabled)" : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 20,
      height: 20,
      borderRadius: 6,
      border: "2px solid " + (on ? "var(--color-primary)" : hover ? "var(--teal-400)" : "var(--gray-300)"),
      background: on ? "var(--color-primary)" : "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      flexShrink: 0,
      marginTop: 2,
      transition: "all var(--dur-base)"
    }
  }, indeterminate ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 2,
      background: "#fff",
      borderRadius: 1
    }
  }) : checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    strokeWidth: "3"
  }) : null), (label || description) && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-tertiary)",
      marginTop: 2
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})();

// components/data/Table.jsx
(() => {
const {
  useState
} = React;
function Row({
  row,
  cols,
  selectable,
  selected,
  onSelect,
  onClick,
  dense
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("tr", {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    onClick: onClick,
    style: {
      background: selected ? "var(--color-primary-soft)" : h ? "var(--surface-subtle)" : "#fff",
      cursor: onClick ? "pointer" : "default",
      transition: "background-color var(--dur-fast)"
    }
  }, selectable && /*#__PURE__*/React.createElement("td", {
    style: {
      padding: dense ? "8px 12px" : "12px 16px",
      width: 44,
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    checked: selected,
    onChange: onSelect
  })), cols.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    dir: c.ltr ? "ltr" : undefined,
    style: {
      padding: dense ? "8px 12px" : "12px 16px",
      borderBottom: "1px solid var(--border-subtle)",
      font: c.ltr ? "var(--type-tabular)" : "var(--type-body-sm)",
      color: "var(--text-primary)",
      textAlign: c.align || "start",
      whiteSpace: c.nowrap ? "nowrap" : "normal",
      width: c.width
    }
  }, c.render ? c.render(row) : row[c.key])));
}
function Table({
  columns = [],
  rows = [],
  rowKey = "id",
  selectable,
  selectedKeys = [],
  onSelectionChange,
  onRowClick,
  sortKey,
  sortDir = "asc",
  onSort,
  dense,
  emptyText = "אין נתונים להצגה",
  style
}) {
  const allSel = rows.length > 0 && rows.every(r => selectedKeys.includes(r[rowKey]));
  const someSel = !allSel && rows.some(r => selectedKeys.includes(r[rowKey]));
  const toggleAll = () => onSelectionChange && onSelectionChange(allSel ? [] : rows.map(r => r[rowKey]));
  const toggle = k => onSelectionChange && onSelectionChange(selectedKeys.includes(k) ? selectedKeys.filter(x => x !== k) : [...selectedKeys, k]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-control)",
      border: "1px solid var(--border-default)",
      overflow: "hidden",
      background: "#fff",
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "var(--surface-subtle)"
    }
  }, selectable && /*#__PURE__*/React.createElement("th", {
    style: {
      padding: dense ? "8px 12px" : "12px 16px",
      width: 44,
      borderBottom: "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    checked: allSel,
    indeterminate: someSel,
    onChange: toggleAll
  })), columns.map(c => {
    const active = sortKey === c.key;
    return /*#__PURE__*/React.createElement("th", {
      key: c.key,
      onClick: c.sortable && onSort ? () => onSort(c.key, active && sortDir === "asc" ? "desc" : "asc") : undefined,
      style: {
        padding: dense ? "8px 12px" : "12px 16px",
        textAlign: c.align || "start",
        font: "var(--type-body-sm)",
        fontWeight: 500,
        color: active ? "var(--text-brand)" : "var(--text-secondary)",
        borderBottom: "1px solid var(--border-default)",
        cursor: c.sortable ? "pointer" : "default",
        whiteSpace: "nowrap",
        userSelect: "none",
        width: c.width
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4
      }
    }, c.title, c.sortable && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-down",
      size: 14,
      style: {
        opacity: active ? 1 : 0.35,
        transform: active && sortDir === "desc" ? "rotate(180deg)" : "none",
        transition: "transform var(--dur-base)"
      }
    })));
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length + (selectable ? 1 : 0),
    style: {
      padding: 32,
      textAlign: "center",
      color: "var(--text-tertiary)",
      font: "var(--type-body)"
    }
  }, emptyText)) : rows.map(r => /*#__PURE__*/React.createElement(Row, {
    key: r[rowKey],
    row: r,
    cols: columns,
    dense: dense,
    selectable: selectable,
    selected: selectedKeys.includes(r[rowKey]),
    onSelect: () => toggle(r[rowKey]),
    onClick: onRowClick ? () => onRowClick(r) : undefined
  })))));
}
Object.assign(__ds_scope, { Table });
})();

// components/forms/IconButton.jsx
(() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function IconButton({
  icon,
  label,
  size = "md",
  variant = "subtle",
  disabled,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const px = {
    sm: 32,
    md: 36,
    lg: 44
  }[size];
  const v = {
    subtle: {
      background: hover ? "var(--gray-200)" : "var(--gray-100)",
      color: hover ? "var(--color-primary)" : "var(--gray-500)"
    },
    ghost: {
      background: hover ? "var(--color-primary-soft)" : "transparent",
      color: hover ? "var(--color-primary)" : "var(--gray-500)"
    },
    primary: {
      background: hover ? "var(--color-primary-hover)" : "var(--color-primary)",
      color: "#fff"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    title: label,
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: px,
      height: px,
      borderRadius: "var(--radius-sm)",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? "var(--opacity-disabled)" : 1,
      ...v,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === "sm" ? 16 : size === "lg" ? 22 : 18
  }));
}
Object.assign(__ds_scope, { IconButton });
})();

// components/feedback/Dialog.jsx
(() => {
function Dialog({
  open,
  onClose,
  title,
  description,
  tone = "default",
  children,
  footer,
  width = 512,
  inline,
  style
}) {
  if (!open) return null;
  const titleColor = tone === "error" ? "var(--red-600)" : "var(--text-brand)";
  return /*#__PURE__*/React.createElement("div", {
    className: "hti-fade-in",
    style: {
      position: inline ? "absolute" : "fixed",
      inset: 0,
      zIndex: 50,
      background: "var(--surface-overlay)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    className: "hti-zoom-in",
    onClick: e => e.stopPropagation(),
    style: {
      position: "relative",
      width: "100%",
      maxWidth: width,
      background: "#fff",
      borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-xl)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      ...style
    }
  }, onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "\u05E1\u05D2\u05D5\u05E8",
    variant: "ghost",
    size: "sm",
    onClick: onClose,
    style: {
      position: "absolute",
      top: 16,
      left: 16
    }
  }), (title || description) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      textAlign: "start",
      paddingInlineEnd: onClose ? 32 : 0
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-h2)",
      fontSize: 24,
      color: titleColor
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-secondary)"
    }
  }, description)), children, footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      flexWrap: "wrap"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})();

// components/feedback/Toast.jsx
(() => {
const ICON = {
  success: "check-circle",
  error: "alert-circle",
  info: "info",
  warning: "alert-triangle"
};
function Toast({
  tone = "success",
  title,
  description,
  onClose,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "hti-slide-down",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      width: 360,
      maxWidth: "100%",
      background: "#fff",
      borderRadius: "var(--radius-control)",
      boxShadow: "var(--shadow-xl)",
      border: "1px solid var(--border-subtle)",
      padding: "14px 16px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: "var(--status-" + tone + "-bg)",
      color: "var(--status-" + tone + "-fg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICON[tone],
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "\u05E1\u05D2\u05D5\u05E8",
    variant: "ghost",
    size: "sm",
    onClick: onClose
  }));
}
Object.assign(__ds_scope, { Toast });
})();

// components/forms/TextInput.jsx
(() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function TextInput({
  label,
  error,
  hint,
  iconStart,
  iconEnd,
  onIconEndClick,
  disabled,
  filled,
  className,
  style,
  inputStyle,
  ...props
}) {
  const [focus, setFocus] = useState(false);
  const [hover, setHover] = useState(false);
  const border = error ? "var(--border-error)" : focus ? "var(--border-focus)" : hover && !disabled ? "var(--border-focus)" : filled ? "transparent" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-field)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement(__ds_scope.FieldLabel, null, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      opacity: disabled ? "var(--opacity-muted)" : 1
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, iconStart && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 14,
      top: "50%",
      transform: "translateY(-50%)",
      color: focus ? "var(--color-primary)" : "var(--text-placeholder)",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconStart,
    size: 20
  })), /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      props.onFocus && props.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      props.onBlur && props.onBlur(e);
    }
  }, props, {
    style: {
      width: "100%",
      height: "var(--control-md)",
      borderRadius: "var(--radius-control)",
      border: "2px solid " + border,
      background: disabled ? "var(--gray-50)" : filled && !focus ? "var(--gray-50)" : "#fff",
      padding: "0 " + (iconStart ? 44 : 16) + "px 0 " + (iconEnd ? 44 : 16) + "px",
      font: "var(--type-body)",
      color: "var(--text-primary)",
      outline: "none",
      cursor: disabled ? "not-allowed" : "text",
      ...inputStyle
    }
  })), iconEnd && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onIconEndClick,
    tabIndex: onIconEndClick ? 0 : -1,
    style: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      padding: 2,
      color: "var(--text-placeholder)",
      display: "flex",
      cursor: onIconEndClick ? "pointer" : "default"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd,
    size: 20
  }))), error ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-error)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { TextInput });
})();

// components/forms/ToggleButton.jsx
(() => {
const {
  useState
} = React;
function ToggleButton({
  label,
  icon,
  checked,
  onToggle,
  disabled,
  style
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": !!checked,
    disabled: disabled,
    onClick: onToggle,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: 8,
      borderRadius: "var(--radius-control)",
      border: "2px solid " + (checked ? "var(--color-primary)" : hover ? "var(--teal-300)" : "var(--border-default)"),
      background: checked ? "var(--color-primary-soft)" : hover ? "var(--teal-50)" : "#fff",
      padding: "0 16px",
      height: "var(--control-lg)",
      font: "var(--type-label)",
      color: checked ? "var(--color-primary-hover)" : "var(--gray-600)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? "var(--opacity-disabled)" : 1,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "start"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 36,
      height: 20,
      borderRadius: 999,
      background: checked ? "var(--color-primary)" : "var(--gray-300)",
      position: "relative",
      transition: "background-color var(--dur-base) var(--ease-out)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "var(--shadow-toggle)",
      transform: checked ? "translateX(-16px)" : "translateX(0)",
      transition: "transform var(--dur-base) var(--ease-out)"
    }
  })));
}
Object.assign(__ds_scope, { ToggleButton });
})();

// components/layout/PageHeader.jsx
(() => {
function PageHeader({
  userName,
  onLogout,
  logoSrc = "assets/logo-horizontal-tagline-teal-1200.png",
  logoHeight = 56,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "16px 24px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "\u05D4\u05D9\u05D9\u05D8\u05E7 \u05E1\u05D5\u05DB\u05E0\u05D5\u05EA \u05DC\u05D1\u05D9\u05D8\u05D5\u05D7",
    style: {
      height: logoHeight,
      width: "auto",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      whiteSpace: "nowrap"
    }
  }, userName && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--gray-600)"
    }
  }, "\u05E9\u05DC\u05D5\u05DD, ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "var(--text-brand)"
    }
  }, userName)), onLogout && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "log-out",
    label: "\u05DC\u05D4\u05EA\u05E0\u05EA\u05E7",
    onClick: onLogout
  })));
}
Object.assign(__ds_scope, { PageHeader });
})();

// components/lib/Spinner.jsx
(() => {
function Spinner({
  size = 32,
  color = "var(--color-primary)",
  thickness = 4,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "hti-spin",
    role: "status",
    "aria-label": "\u05D8\u05D5\u05E2\u05DF",
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      border: thickness + "px solid " + color,
      borderTopColor: "transparent",
      flexShrink: 0,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Spinner });
})();

// components/forms/Button.jsx
(() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const H = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 60
};
const PX = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28
};
const FS = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 18
};
function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  disabled,
  iconStart,
  iconEnd,
  children,
  style,
  onClick,
  type = "button",
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const off = disabled || loading;
  const base = {
    display: fullWidth ? "flex" : "inline-flex",
    width: fullWidth ? "100%" : undefined,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: H[size],
    padding: "0 " + PX[size] + "px",
    borderRadius: "var(--radius-control)",
    border: "2px solid transparent",
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: FS[size],
    lineHeight: 1,
    cursor: off ? "not-allowed" : "pointer",
    opacity: off ? "var(--opacity-disabled)" : 1,
    transform: press && !off ? "scale(var(--press-scale))" : "none",
    whiteSpace: "nowrap",
    transition: "transform var(--dur-fast), background-color var(--dur-base), border-color var(--dur-base), color var(--dur-base)"
  };
  const v = {
    primary: {
      background: hover && !off ? "var(--color-primary-hover)" : "var(--color-primary)",
      color: "var(--color-on-primary)",
      borderColor: "transparent"
    },
    secondary: {
      background: hover && !off ? "var(--color-secondary-hover)" : "var(--color-secondary)",
      color: "var(--color-on-secondary)",
      borderColor: "transparent"
    },
    outline: {
      background: "#fff",
      color: hover && !off ? "var(--color-primary-hover)" : "var(--gray-600)",
      borderColor: hover && !off ? "var(--color-primary)" : "var(--border-default)"
    },
    ghost: {
      background: hover && !off ? "var(--color-primary-soft)" : "transparent",
      color: hover && !off ? "var(--color-primary-hover)" : "var(--gray-600)",
      borderColor: "transparent"
    },
    destructive: {
      background: hover && !off ? "var(--red-600)" : "var(--red-500)",
      color: "#fff",
      borderColor: "transparent"
    },
    link: {
      background: "transparent",
      color: "var(--text-link)",
      borderColor: "transparent",
      textDecoration: hover ? "underline" : "none",
      height: "auto",
      padding: 0,
      fontFamily: "var(--font-body)",
      fontWeight: 400,
      fontSize: 14
    }
  }[variant];
  const iconSize = size === "sm" ? 16 : 20;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: off,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      ...base,
      ...v,
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: iconSize - 2,
    thickness: 2,
    color: variant === "outline" || variant === "ghost" || variant === "link" ? "var(--color-primary)" : "#fff"
  }) : iconStart ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconStart,
    size: iconSize
  }) : null, children && /*#__PURE__*/React.createElement("span", null, children), !loading && iconEnd ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd,
    size: iconSize
  }) : null);
}
Object.assign(__ds_scope, { Button });
})();

// components/forms/SearchableSelect.jsx
(() => {
const {
  useState,
  useRef,
  useEffect
} = React;
function SearchableSelect({
  options = [],
  value,
  onChange,
  label,
  placeholder = "בחר...",
  loadingPlaceholder = "טוען...",
  emptyPlaceholder = "אין אפשרויות",
  noResultsText = "לא נמצאו תוצאות",
  searchPlaceholder = "הקלד לחיפוש...",
  disabled,
  loading,
  error,
  style,
  defaultOpen = false
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(-1);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const off = disabled || loading;
  const border = error ? "var(--border-error)" : open || hover && !off ? "var(--border-focus)" : "var(--border-default)";
  const box = {
    width: "100%",
    height: "var(--control-md)",
    borderRadius: "var(--radius-control)",
    border: "2px solid " + border,
    background: disabled ? "var(--gray-50)" : "#fff",
    padding: "0 16px",
    font: "var(--type-body)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: off ? "not-allowed" : "pointer",
    outline: "none"
  };
  const pick = v => {
    onChange && onChange(v);
    setOpen(false);
    setQ("");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-field)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement(__ds_scope.FieldLabel, null, label), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: "relative",
      opacity: disabled ? "var(--opacity-muted)" : 1
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, !open ? /*#__PURE__*/React.createElement("div", {
    role: "combobox",
    "aria-expanded": false,
    tabIndex: off ? -1 : 0,
    onClick: () => !off && setOpen(true),
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        !off && setOpen(true);
      }
    },
    style: box
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: selected ? "var(--text-primary)" : "var(--text-placeholder)"
    }
  }, loading ? loadingPlaceholder : options.length === 0 ? emptyPlaceholder : selected ? selected.label : placeholder), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, loading && /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: 20,
    thickness: 2
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 20,
    style: {
      color: hover && !off ? "var(--color-primary)" : "var(--text-placeholder)"
    }
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: q,
    onChange: e => {
      setQ(e.target.value);
      setHi(-1);
    },
    placeholder: searchPlaceholder,
    onKeyDown: e => {
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHi(p => Math.min(p + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHi(p => Math.max(p - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hi >= 0 && filtered[hi]) pick(filtered[hi].value);else if (filtered.length === 1) pick(filtered[0].value);
      }
    },
    style: {
      ...box,
      cursor: "text",
      paddingLeft: 40,
      borderColor: "var(--border-focus)"
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 20,
    style: {
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%) rotate(180deg)",
      color: "var(--color-primary)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    role: "listbox",
    style: {
      position: "absolute",
      zIndex: 50,
      marginTop: 4,
      maxHeight: 240,
      width: "100%",
      overflow: "auto",
      borderRadius: "var(--radius-control)",
      border: "2px solid var(--border-focus)",
      background: "#fff",
      boxShadow: "var(--shadow-lg)"
    }
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px",
      textAlign: "center",
      color: "var(--text-tertiary)"
    }
  }, noResultsText) : filtered.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: o.value,
    role: "option",
    "aria-selected": o.value === value,
    onClick: () => pick(o.value),
    onMouseEnter: () => setHi(i),
    style: {
      padding: "12px 16px",
      cursor: "pointer",
      background: i === hi ? "var(--color-primary-soft)" : "transparent",
      color: o.value === value ? "var(--color-primary-hover)" : "var(--text-primary)",
      fontWeight: o.value === value ? 500 : 400,
      transition: "background var(--dur-fast)"
    }
  }, o.label))))), error && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-error)"
    }
  }, error));
}
Object.assign(__ds_scope, { SearchableSelect });
})();


export const Tooltip = __ds_scope.Tooltip;
export const FieldLabel = __ds_scope.FieldLabel;
export const RadioGroup = __ds_scope.RadioGroup;
export const Card = __ds_scope.Card;
export const SectionHeader = __ds_scope.SectionHeader;
export const SummaryItem = __ds_scope.SummaryItem;
export const Icon = __ds_scope.Icon;
export const ICON_NAMES = __ds_scope.ICON_NAMES;
export const Calendar = __ds_scope.Calendar;
export const TimeSlots = __ds_scope.TimeSlots;
export const Tabs = __ds_scope.Tabs;
export const Alert = __ds_scope.Alert;
export const Badge = __ds_scope.Badge;
export const EmptyState = __ds_scope.EmptyState;
export const Pill = __ds_scope.Pill;
export const ProgressSteps = __ds_scope.ProgressSteps;
export const Checkbox = __ds_scope.Checkbox;
export const Table = __ds_scope.Table;
export const IconButton = __ds_scope.IconButton;
export const Dialog = __ds_scope.Dialog;
export const Toast = __ds_scope.Toast;
export const TextInput = __ds_scope.TextInput;
export const ToggleButton = __ds_scope.ToggleButton;
export const PageHeader = __ds_scope.PageHeader;
export const Spinner = __ds_scope.Spinner;
export const Button = __ds_scope.Button;
export const SearchableSelect = __ds_scope.SearchableSelect;
