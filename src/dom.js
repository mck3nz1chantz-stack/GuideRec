export function h(tag, props, kids) {
  const node = document.createElement(tag);
  const fields = props || {};
  for (const [key, val] of Object.entries(fields)) {
    if (val == null || val === false) continue;
    if (key === "class") node.className = String(val);
    else if (key === "text") node.textContent = String(val);
    else if (key === "checked" || key === "selected" || key === "disabled") node[key] = Boolean(val);
    else if (key === "value") node.value = String(val);
    else if (key === "style") node.setAttribute("style", String(val));
    else if (key === "htmlFor") node.htmlFor = String(val);
    else if (key.startsWith("on") && typeof val === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (val === true) node.setAttribute(key, "");
    else node.setAttribute(key, String(val));
  }
  append(node, kids);
  return node;
}

export function append(node, kids) {
  if (kids == null) return node;
  const list = Array.isArray(kids) ? kids : [kids];
  for (const kid of list) {
    if (kid == null || kid === false) continue;
    if (typeof kid === "string" || typeof kid === "number") node.append(document.createTextNode(String(kid)));
    else node.append(kid);
  }
  return node;
}
