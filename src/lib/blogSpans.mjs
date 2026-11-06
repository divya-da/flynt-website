// FD-1080 — turns one Sanity text block's spans into HTML for the blog page.
// A span's `marks` holds decorators (strong/em/code) and the keys of the
// block's `markDefs` — a link is a markDef of `_type: 'link'` with an `href`.
// Before this, link marks were ignored and every link showed as plain text.

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export function spansToHtml(children = [], markDefs = []) {
  return children.map(span => {
    let t = span.text || ''
    const marks = span.marks || []
    if (marks.includes('strong')) t = `<strong>${t}</strong>`
    if (marks.includes('em')) t = `<em>${t}</em>`
    if (marks.includes('code')) t = `<code>${t}</code>`
    const link = markDefs.find(def => def._type === 'link' && def.href && marks.includes(def._key))
    if (link) t = `<a href="${escapeAttr(link.href)}">${t}</a>`
    return t
  }).join('')
}
