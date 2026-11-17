import fs from 'node:fs/promises';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pageRoutes = {privacy:'/privacy.html', terms:'/terms/', cookies:'/cookies/', accessibility:'/accessibility/', contact:'/contact/'};

// Shared renderer; factual fields and the owner's review list live beside the pack.
export async function writeLaunchPages({head, header, footer, siteUrl, siteName, owner}) {
  const c = JSON.parse(await fs.readFile('launch/pages.json', 'utf8'));
  if (c.siteUrl !== siteUrl || c.siteName !== siteName || c.owner !== owner) throw new Error('Update launch/pages.json to match this site before building');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.reviewDate)) throw new Error('Pages need a review date');
  for (const email of [c.contactEmail,c.fallbackEmail]) if (!/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(email)) throw new Error('Pages need a valid email address');
  const e = escape, mail = email => `<a href="mailto:${e(email)}">${e(email)}</a>`;
  const section = (title, text) => `<section><h2>${title}</h2>${text}</section>`;
  const p = text => `<p>${text}</p>`;
  const storage = `<ul>${c.storage.map(s=>`<li><code>${e(s.key)}</code>: ${e(s.purpose)}.</li>`).join('')}</ul>`;
  const contact = p(`Email ${mail(c.contactEmail)} for questions, corrections, privacy requests or access problems. Forwarding for that address still needs checking. Until it is confirmed, use ${mail(c.fallbackEmail)}.`);
  const pages = {
    privacy: ['Privacy notice',
      p(`I run ${e(c.siteName)} at ${e(c.siteUrl)}. This notice covers this site, not my other websites.`) +
      section('Visits and analytics', p(e(c.analyticsStatus)) + p('I found no collector request during the recorded browser visits. That check cannot show what a hosting provider keeps in its server logs.')) +
      section('Hosting and fonts', p(`The current build is set up for ${e(c.hosting)}. Cloudflare is planned; this notice needs another check when the host changes. Hosting providers receive connection details, including your IP address and the page requested.`) + p(`Pages load fonts from ${e(c.fontService)}. Your browser contacts ${c.fontOrigins.map(e).join(' and ')} and sends connection details to fetch them. See <a href="https://developers.google.com/fonts/faq/privacy">Google Fonts privacy information</a> and <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's privacy statement</a>.`)) +
      section('Your browser', p('Theme choices, saved articles and flags stay in local storage on this device. They are not sent to me. The current site code sets no cookies. See the <a href="/cookies/">cookies and storage statement</a>.')) +
      section('Email and newsletters', p('There is no account, signup form or contact form. The email newsletter has not launched. If you email me, the providers involved handle your address and message so I can read and reply. The email provider and retention period still need confirming.')) +
      section('Questions and privacy requests', contact + p('Ask what information I hold about you, or ask for a correction or removal. I will check what applies to your request. You can also <a href="https://ico.org.uk/make-a-complaint/">raise a concern with the ICO</a>.')) +
      section('Other websites', p('External links take you to services with their own privacy rules. This build uses ordinary links rather than embedded social players.'))],
    terms: ['Terms of use',
      p(`${e(c.siteName)} is my personal site for writing, AI news and projects.`) +
      section('Using the site', p('Read, share links and tell me when something is wrong. Please do not disrupt the site, try to access private systems or pass off someone else’s work as your own.')) +
      section('Content and reuse', p('My writing belongs to me unless a page says otherwise. Linked articles, images and other third-party work belong to their owners. Ask before republishing material; a link here does not grant permission to reuse it.')) +
      section('Accuracy and availability', p('I try to keep things accurate and correct errors. News and tools change, and the site can be unavailable. Check the original source before relying on a claim. Nothing here replaces advice suited to your circumstances.')) +
      section('Links and corrections', p('A link is a route to another site, not a promise about its content or service.') + contact)],
    cookies: ['Cookies and browser storage',
      p('The current site code does not set cookies. This is not a guarantee about every response from the final hosting provider.') +
      section('What stays on your device', storage + p('These entries use local storage, which is different from cookies. They remain until you clear this site’s data or change them. They do not sync between devices. Clearing them resets your theme, saved articles and flags.')) +
      section('Counting visits', p(e(c.analyticsStatus)) + p('Cookieless does not automatically mean anonymous or exempt from consent. Any counter needs its own check before it is enabled.')) +
      section('Third-party connections', p('Google Fonts receives requests for typefaces. Following an external link opens a separate website with its own storage rules. See the <a href="/privacy.html">privacy notice</a>.')) +
      section('Check or clear storage', p('Use your browser’s site settings to inspect or clear cookies and site data for this domain. The news page is designed to keep working when storage is unavailable.'))],
    accessibility: ['Accessibility statement',
      p(`I want ${e(c.siteName)} to be usable with a keyboard, at high zoom and with assistive technology.`) +
      section('What is built in', p('Pages have a skip link, labelled navigation, headings and visible keyboard focus. Text can resize with your browser. You can choose a light or dark theme where the theme control is available.')) +
      section('What still needs checking', p('This is not a claim of full WCAG 2.2 AA compliance. Automated checks cover part of accessibility. Manual screen-reader checks and final-host checks across all routes still need completing. Older articles and third-party destinations may have barriers that are not yet recorded.')) +
      section('Report a problem', p('Tell me which page caused trouble, what you were trying to do and, if useful, your browser or assistive technology. Please leave out sensitive personal information. I can discuss another way to provide the content.') + contact)],
    contact: ['Contact and support',
      contact +
      section('Corrections and help', p('Send the page link and a short description of the problem. For accessibility issues, tell me what stopped you using the page. This is a personal site; there is no staffed help desk or promised response time.')) +
      section('Keep up with the site', p('The email newsletter has not launched and there is no signup here. You can use the <a href="/feed.xml">RSS feed</a>, read <a href="/posts/">posts</a> or browse <a href="/news/">news</a>. RSS is not email delivery.')) +
      section('Supporting the work', p('There is no payment or donation journey on this page. Any future newsletter or financial support service needs a separate decision before launch.'))]
  };
  for (const [key,[title,body]] of Object.entries(pages)) {
    const route = pageRoutes[key], base = key === 'privacy' ? '.' : '..';
    const date = new Date(c.reviewDate+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
    const html = `<!doctype html><html lang="en-GB" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} - ${e(c.siteName)}</title><meta name="description" content="${e(title)} for ${e(c.siteName)}. Template for Kol to check."><link rel="canonical" href="${e(c.siteUrl+route)}">${head(base)}<link rel="stylesheet" href="${base}/assets/launch-pages.css"></head><body>${header(base+'/','contact')}<main id="main-content" class="launch-page"><p class="section-eyebrow">${e(c.siteName)}</p><h1>${title}</h1><p>Last reviewed: <time datetime="${c.reviewDate}">${date}</time></p><aside class="template-note" aria-label="Template status"><p><strong>Template for Kol to check. Not legal advice.</strong></p></aside>${body}<section class="confirm-fields"><h2>Kol must confirm</h2><ul>${c.confirm[key].map(field=>`<li>${e(field)}.</li>`).join('')}</ul></section><nav aria-label="Site information">${Object.entries(pages).map(([id,[name]])=>`<a href="${pageRoutes[id]}"${id===key?' aria-current="page"':''}>${name}</a>`).join(' ')}</nav></main>${footer()}<script src="${base}/site.js"></script></body></html>`;
    const file = key === 'privacy' ? 'site/privacy.html' : `site/${key}/index.html`;
    await fs.mkdir(file.slice(0,file.lastIndexOf('/')), {recursive:true});
    await fs.writeFile(file,html+'\n');
  }
}
