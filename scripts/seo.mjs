// Metadata is applied to every indexable output, including preserved HTML pages.
import fs from 'node:fs/promises';
import path from 'node:path';

const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(?:0*39|x0*27);|&apos;/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(([, name,, value]) => [name.toLowerCase(), decode(value)]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

export async function publicPages(directory = 'site') {
  const pages = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) pages.push(...await publicPages(file));
    else if (entry.name.endsWith('.html')) {
      const html = await fs.readFile(file, 'utf8');
      const head = html.split(/<\/head>/i)[0];
      const meta = [...head.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attrs(tag));
      if (meta.some(a => a.name === 'robots' && /noindex/i.test(a.content)) || meta.some(a => a['http-equiv']?.toLowerCase() === 'refresh')) continue;
      const relative = path.relative('site', file).split(path.sep).join('/');
      pages.push({ file, html, pathname: '/' + relative.replace(/(^|\/)index\.html$/, '$1') });
    }
  }
  return pages.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

export async function writeSeo({ siteUrl, siteName, siteOwner, items }) {
  const image = `${siteUrl}/media/social-default.png`;
  const byPath = new Map(items.filter(item => item.localPath).map(item => [item.localPath, item]));
  for (const page of await publicPages()) {
    const url = siteUrl + page.pathname;
    const item = byPath.get(page.pathname);
    let html = page.html.replace(/\s*<!-- SEO:start -->[\s\S]*?<!-- SEO:end -->/g, '');
    const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || siteName);
    const meta = [...html.split(/<\/head>/i)[0].matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attrs(tag));
    const description = meta.find(a => a.name === 'description')?.content || `${title}. AI, technology and ideas from ${siteName}.`;
    html = html.replace(/\s*<meta\b[^>]*>/gi, tag => {
      const a = attrs(tag);
      return /^(og:|twitter:)/.test(a.name || a.property || '') ? '' : tag;
    }).replace(/\s*<link\b[^>]*>/gi, tag => {
      const a = attrs(tag);
      return a.rel === 'canonical' || a.type === 'application/rss+xml' ? '' : tag;
    });
    const values = {
      'og:title': title, 'og:description': description, 'og:type': item ? 'article' : 'website',
      'og:url': url, 'og:site_name': siteName, 'og:locale': 'en_GB',
      'og:image': image, 'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630',
      'og:image:alt': `${siteName}: AI, technology and ideas`,
      'twitter:card': 'summary_large_image', 'twitter:creator': '@koltregaskes',
      'twitter:title': title, 'twitter:description': description, 'twitter:image': image,
      'twitter:image:alt': `${siteName}: AI, technology and ideas`
    };
    if (item?.date && Number.isFinite(Date.parse(item.date))) values['article:published_time'] = new Date(item.date).toISOString();
    const schema = {
      '@context': 'https://schema.org', '@type': item ? 'BlogPosting' : page.pathname === '/about/' ? 'AboutPage' : page.pathname === '/contact/' ? 'ContactPage' : /\/(posts|tags|news)\//.test(page.pathname) ? 'CollectionPage' : 'WebPage',
      '@id': `${url}#page`, url, name: title, description, image, inLanguage: 'en-GB',
      isPartOf: { '@id': `${siteUrl}/#website` }
    };
    if (item) {
      Object.assign(schema, { headline: item.title, mainEntityOfPage: url,
        author: { '@type': 'Person', '@id': `${siteUrl}/#person-kol`, name: siteOwner },
        publisher: { '@type': 'Organization', name: siteName, url: siteUrl + '/' } });
      if (item.date && Number.isFinite(Date.parse(item.date))) schema.datePublished = new Date(item.date).toISOString();
      if (item.updatedTime && Number.isFinite(Date.parse(item.updatedTime))) schema.dateModified = new Date(item.updatedTime).toISOString();
    }
    const tags = [`<link rel="canonical" href="${escape(url)}" />`,
      `<link rel="alternate" type="application/rss+xml" title="${escape(siteName)}" href="${escape(siteUrl)}/feed.xml" />`,
      ...Object.entries(values).map(([name, value]) => `<meta ${name.startsWith('twitter:') ? 'name' : 'property'}="${name}" content="${escape(value)}" />`),
      `<script type="application/ld+json" nonce="kk-jsonld">${json(schema)}</script>`];
    if (!meta.some(a => a.name === 'description')) tags.unshift(`<meta name="description" content="${escape(description)}" />`);
    html = html.replace(/<\/head>/i, `\n  <!-- SEO:start -->\n  ${tags.join('\n  ')}\n  <!-- SEO:end -->\n</head>`);
    await fs.writeFile(page.file, html.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, ''), 'utf8');
  }
}

export async function writeSitemap(siteUrl, items = []) {
  const modified = new Map(items.filter(i => i.localPath).map(i => [i.localPath, i.updatedTime || i.date]));
  const entries = (await publicPages()).map(page => {
    const date = modified.get(page.pathname);
    const lastmod = date && Number.isFinite(Date.parse(date)) ? `<lastmod>${new Date(date).toISOString()}</lastmod>` : '';
    return `  <url><loc>${escape(siteUrl + page.pathname)}</loc>${lastmod}</url>`;
  });
  await fs.writeFile('site/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`, 'utf8');
}
