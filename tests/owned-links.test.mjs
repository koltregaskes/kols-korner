import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLinksPage } from '../scripts/owned-links.mjs';
test('owned links has one main/heading and escapes its configured content', () => {
 const html=renderLinksPage('<link rel="canonical" href="https://koltregaskes.com/about/"><a href="https://koltregaskes.com/about/">About</a><title>About</title><meta name="description" content="Old"><main id="main-content">Old about</main>', {contactEmail:'test@example.com'}, [{name:'A < B',url:'https://example.com/?x=1&y=2'}]);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 for(const route of ['posts/','news/','feed.xml','about/']) assert.ok(html.includes('href="../'+route+'"'));
 assert.ok(html.includes('mailto:test@example.com'));
 assert.ok(html.includes('A &lt; B'));
 assert.ok(html.includes('x=1&amp;y=2'));
 assert.ok(!html.includes('Old about'));
 assert.ok(html.includes('href="https://koltregaskes.com/about/">About'));
 assert.ok(html.includes('rel="canonical" href="https://koltregaskes.com/links/"'));
});
