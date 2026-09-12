import { A as z, a as B } from "./chunk-CV4BWJDJ-oXyklWrC.js";
import {
  aw as F,
  r as d,
  bg as H,
  bh as I,
  ax as C,
  bi as L,
  av as O,
  j as g,
} from "./index-DlnbDoYP.js";
function U(u = {}) {
  const {
      as: l,
      ref: i,
      max: a = 5,
      total: t,
      size: r,
      color: o,
      radius: e,
      children: p,
      isBordered: n,
      isDisabled: h,
      isGrid: s,
      renderCount: b,
      className: m,
      classNames: c,
      ...N
    } = u,
    j = F(i),
    M = l || "div",
    R = d.useMemo(
      () => ({
        size: r,
        color: o,
        radius: e,
        isGrid: s,
        isBordered: n,
        isDisabled: h,
      }),
      [r, o, e, s, n, h],
    ),
    A = d.useMemo(() => H({ className: m, isGrid: s }), [m, s]),
    v = I(p),
    x = a ? v.slice(0, a) : v,
    G = t || (a != null ? v.length - a : -1),
    E = x.map((_, f) => {
      const w = f === 0,
        D = f === x.length - 1,
        y = {
          className: C(
            w ? "ms-0" : s ? "" : "-ms-2",
            D && G < 1 ? "hover:-translate-x-0" : "",
          ),
        };
      return d.cloneElement(_, L(y));
    });
  return {
    Component: M,
    context: R,
    remainingCount: G,
    clones: E,
    renderCount: b,
    getAvatarGroupProps: () => ({
      ref: j,
      className: A.base({ class: C(c == null ? void 0 : c.base, m) }),
      role: "group",
      ...N,
    }),
    getAvatarGroupCountProps: () => ({
      className: A.count({ class: c == null ? void 0 : c.count }),
    }),
  };
}
var P = O((u, l) => {
  const {
    Component: i,
    clones: a,
    context: t,
    remainingCount: r,
    getAvatarGroupCountProps: o,
    getAvatarGroupProps: e,
    renderCount: p = (n) => g.jsx(B, { ...o(), name: `+${n}` }),
  } = U({ ...u, ref: l });
  return g.jsx(i, {
    ...e(),
    children: g.jsxs(z, { value: t, children: [a, r > 0 && p(r)] }),
  });
});
P.displayName = "HeroUI.AvatarGroup";
var q = P;
export { q as a };
