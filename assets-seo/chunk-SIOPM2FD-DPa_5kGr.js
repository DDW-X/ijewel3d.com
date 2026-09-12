import {
  j as a,
  b6 as N,
  b5 as B,
  b7 as H,
  au as w,
  bA as T,
  bB as V,
  bC as K,
  aL as O,
  aM as S,
  bJ as y,
  aw as z,
  az as J,
  r as D,
  aQ as Q,
  aB as U,
  ay as L,
  av as W,
  bK as q,
} from "./index-DlnbDoYP.js";
var G = (e) =>
  a.jsxs("svg", {
    "aria-hidden": "true",
    fill: "none",
    focusable: "false",
    height: "1em",
    shapeRendering: "geometricPrecision",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "1.5",
    viewBox: "0 0 24 24",
    width: "1em",
    ...e,
    children: [
      a.jsx("path", {
        d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6",
      }),
      a.jsx("path", { d: "M15 3h6v6" }),
      a.jsx("path", { d: "M10 14L21 3" }),
    ],
  });
function X(e, s) {
  let {
      elementType: r = "a",
      onPress: o,
      onPressStart: t,
      onPressEnd: i,
      onClick: c,
      isDisabled: l,
      ...h
    } = e,
    d = {};
  r !== "a" && (d = { role: "link", tabIndex: l ? void 0 : 0 });
  let { focusableProps: k } = N(e, s),
    { pressProps: b, isPressed: $ } = B({
      onClick: c,
      onPress: o,
      onPressStart: t,
      onPressEnd: i,
      isDisabled: l,
      ref: s,
    }),
    x = H(h, { labelable: !0, isLink: r === "a" }),
    m = w(k, b),
    f = T(),
    P = V(e);
  return {
    isPressed: $,
    linkProps: w(x, P, {
      ...m,
      ...d,
      "aria-disabled": l || void 0,
      "aria-current": e["aria-current"],
      onClick: (u) => {
        var p;
        ((p = b.onClick) == null || p.call(b, u),
          K(u, f, e.href, e.routerOptions));
      },
    }),
  };
}
function Y(e) {
  var s, r, o, t;
  const i = O(),
    [c, l] = S(e, y.variantKeys),
    {
      ref: h,
      as: d,
      children: k,
      anchorIcon: b,
      isExternal: $ = !1,
      showAnchorIcon: x = !1,
      autoFocus: m = !1,
      className: f,
      onPress: P,
      onPressStart: u,
      onPressEnd: p,
      onClick: E,
      ...n
    } = c,
    R = d || "a",
    C = z(h),
    j =
      (r =
        (s = e == null ? void 0 : e.disableAnimation) != null
          ? s
          : i == null
            ? void 0
            : i.disableAnimation) != null
        ? r
        : !1,
    { linkProps: v } = X(
      {
        ...n,
        onPress: P,
        onPressStart: u,
        onPressEnd: p,
        onClick: E,
        isDisabled: e.isDisabled,
        elementType: `${d}`,
      },
      C,
    ),
    { isFocused: A, isFocusVisible: g, focusProps: I } = J({ autoFocus: m });
  $ &&
    ((n.rel = (o = n.rel) != null ? o : "noopener noreferrer"),
    (n.target = (t = n.target) != null ? t : "_blank"));
  const _ = D.useMemo(
      () => y({ ...l, disableAnimation: j, className: f }),
      [Q(l), j, f],
    ),
    F = D.useCallback(
      () => ({
        ref: C,
        className: _,
        "data-focus": L(A),
        "data-disabled": L(e.isDisabled),
        "data-focus-visible": L(g),
        ...U(I, v, n, { href: v.href }),
      }),
      [_, A, g, I, v, n],
    );
  return {
    Component: R,
    children: k,
    anchorIcon: b,
    showAnchorIcon: x,
    getLinkProps: F,
  };
}
var M = W((e, s) => {
  const {
    Component: r,
    children: o,
    showAnchorIcon: t,
    anchorIcon: i = a.jsx(G, { className: q }),
    getLinkProps: c,
  } = Y({ ref: s, ...e });
  return a.jsx(r, {
    ...c(),
    children: a.jsxs(a.Fragment, { children: [o, t && i] }),
  });
});
M.displayName = "HeroUI.Link";
var ee = M;
export { ee as l };
