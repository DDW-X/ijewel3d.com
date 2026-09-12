import {
  aw as g,
  az as w,
  r as f,
  e0 as y,
  ax as R,
  aB as C,
  aY as D,
  ay as x,
  av as O,
  j as o,
} from "./index-DlnbDoYP.js";
import { a as $ } from "./chunk-CV4BWJDJ-oXyklWrC.js";
function A(c) {
  const {
      as: a,
      ref: n,
      name: l,
      description: e,
      className: s,
      classNames: r,
      isFocusable: t = !1,
      avatarProps: i = {},
      ...m
    } = c,
    N = { isFocusable: !1, ...i },
    v = a || "div",
    j = typeof v == "string",
    h = g(n),
    { isFocusVisible: F, isFocused: U, focusProps: b } = w({}),
    p = f.useMemo(() => t || a === "button", [t, a]),
    u = f.useMemo(() => y(), []),
    d = R(r == null ? void 0 : r.base, s),
    M = f.useCallback(
      () => ({
        ref: h,
        tabIndex: p ? 0 : -1,
        "data-focus-visible": x(F),
        "data-focus": x(U),
        className: u.base({ class: d }),
        ...C(D(m, { enabled: j }), p ? b : {}),
      }),
      [p, u, d, b, m],
    );
  return {
    Component: v,
    className: s,
    slots: u,
    name: l,
    description: e,
    classNames: r,
    baseStyles: d,
    avatarProps: N,
    getUserProps: M,
  };
}
var P = O((c, a) => {
  const {
    Component: n,
    name: l,
    slots: e,
    classNames: s,
    description: r,
    avatarProps: t,
    getUserProps: i,
  } = A({ ...c, ref: a });
  return o.jsxs(n, {
    ...i(),
    children: [
      o.jsx($, { ...t }),
      o.jsxs("div", {
        className: e.wrapper({ class: s == null ? void 0 : s.wrapper }),
        children: [
          o.jsx("span", {
            className: e.name({ class: s == null ? void 0 : s.name }),
            children: l,
          }),
          o.jsx("span", {
            className: e.description({
              class: s == null ? void 0 : s.description,
            }),
            children: r,
          }),
        ],
      }),
    ],
  });
});
P.displayName = "HeroUI.User";
var I = P;
export { I as u };
