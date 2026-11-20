import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Owned replacement for the old Beacons link-in-bio page (kolt.at points here; hub issue 1413).
export const FOLLOW_LINKS = [
  ['X / Twitter', 'https://x.com/koltregaskes'],
  ['Bluesky', 'https://bsky.app/profile/koltregaskes.bsky.social'],
  ['Threads', 'https://www.threads.com/@koltregaskes'],
  ['Instagram', 'https://www.instagram.com/koltregaskes/'],
  ['YouTube', 'https://www.youtube.com/koltregaskes'],
  ['Music on Suno (as Axy Lusion)', 'https://suno.com/@axylusion'],
  ['GitHub', 'https://github.com/koltregaskes/'],
];
export const SUPPORT_LINKS = [
  ['Support on GoFundMe', 'https://www.gofundme.com/u/koltregaskes'],
];
export const UMBRELLA = { name: 'Elusion Works', url: 'https://elusionworks.com/' };
const listOf = (pairs) => pairs.map(([label, url]) => '<li><a href="' + escape(url) + '" rel="noopener">' + escape(label) + '</a></li>').join('');
export function renderLinksPage(template, { contactEmail }, projects = []) {
  const main = '<main class="content-main about-page" id="main-content"><section class="about-panel"><h1 class="page-title">Links</h1><p>Start here for writing, the dated news desk and the connected projects.</p><h2>On this site</h2><ul>' +
    [['Posts and essays','posts/'],['News desk','news/'],['About','about/'],['RSS feed','feed.xml']].map(([label,href]) => '<li><a href="../' + href + '">' + label + '</a></li>').join('') +
    '</ul><h2>Connected projects</h2><ul>' + [UMBRELLA, ...projects.filter(p => p.url !== UMBRELLA.url)].map(p => '<li><a href="' + escape(p.url) + '">' + escape(p.name) + '</a></li>').join('') +
    '</ul><h2>Follow</h2><ul>' + listOf(FOLLOW_LINKS) +
    '</ul><h2>Support</h2><ul>' + listOf(SUPPORT_LINKS) +
    '</ul><h2>Contact</h2><p><a href="mailto:' + escape(contactEmail) + '">Email ' + escape(contactEmail) + '</a></p></section></main>';
  return template.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, main)
    .replace(/<title>[\s\S]*?<\/title>/, "<title>Links - Kol's Korner</title>")
    .replace(/(<meta name="description" content=")[^"]*/, '$1Kol Tregaskes in one place: writing, news, projects, socials, music and contact')
    .replace(/(<link\b[^>]*rel="canonical"[^>]*href=")https:\/\/koltregaskes.com\/about\//, '$1https://koltregaskes.com/links/');
}
export async function writeLinksPage(projects) {
  const template = await fs.readFile('site/about/index.html', 'utf8');
  const config = JSON.parse(await fs.readFile('site-config.json', 'utf8'));
  await fs.mkdir('site/links', { recursive: true });
  await fs.writeFile('site/links/index.html', renderLinksPage(template, config, projects));
  // The designed home/news pages are preserved by the build. Add the same owned
  // destination to their existing contact footer without rewriting their layout.
  for (const file of ['site/index.html', 'site/news/index.html']) {
    let html = await fs.readFile(file, 'utf8');
    if (!html.includes('https://koltregaskes.com/links/')) html = html.replace(/(<a\b[^>]*href="mailto:[^>]+>)/, '<a href="https://koltregaskes.com/links/">Links</a> $1');
    await fs.writeFile(file, html);
  }
}
export async function checkLinksPage() {
  const html = await fs.readFile('site/links/index.html', 'utf8');
  const { contactEmail } = JSON.parse(await fs.readFile('site-config.json', 'utf8'));
  for (const required of ['>Links</h1>', 'https://elusionworks.com/', 'https://x.com/koltregaskes', 'https://suno.com/@axylusion', 'https://www.gofundme.com/u/koltregaskes', 'href="../posts/"', 'href="../news/"', 'href="../feed.xml"', 'mailto:' + contactEmail, 'application/ld+json', 'https://koltregaskes.com/links/']) {
    if (!html.includes(required)) throw new Error('Owned links contract missing: ' + required);
  }
  if (!(await fs.readFile('site/sitemap.xml', 'utf8')).includes('https://koltregaskes.com/links/')) throw new Error('Owned links route absent from sitemap');
  for (const file of ['site/index.html','site/news/index.html','site/about/index.html']) if (!(await fs.readFile(file,'utf8')).includes('https://koltregaskes.com/links/')) throw new Error('Owned links route not discoverable from ' + file);
  console.log('Owned links: route, contact, discovery and sitemap passed');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await checkLinksPage();
