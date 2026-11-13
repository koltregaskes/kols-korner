import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function appWith(storage){
 const context=vm.createContext({localStorage:storage,document:{addEventListener(){}},console,Set,Date,URL});
 if(fs.existsSync('site/news/news-state.js'))vm.runInContext(fs.readFileSync('site/news/news-state.js','utf8'),context);
 vm.runInContext(fs.readFileSync('site/news/news-app.js','utf8')+'\nglobalThis.NewsApp=NewsApp;',context);
 context.NewsApp.prototype.init=()=>{};
 return new context.NewsApp();
}
test('corrupt local preferences cannot blank the public news desk',()=>assert.doesNotThrow(()=>appWith({getItem:()=>'{broken'})));
test('denied browser storage cannot blank the public news desk',()=>assert.doesNotThrow(()=>appWith({getItem:()=>{throw Error('storage denied')}})));

await import('../site/news/news-state.js');
const {assessFeed,saveStorage}=globalThis.KolsNewsState;
const now=Date.parse('2026-11-13T12:00:00Z');
const payload={site:"Kol's Korner",generated:'2026-11-13T11:00:00Z',articles:[{date:'2026-11-13T10:00:00Z'}]};
test('fresh, stale, empty and unavailable sources have distinct honest labels',()=>{
 assert.equal(assessFeed(payload,now).kind,'fresh');
 const old=assessFeed({...payload,articles:[{date:'2026-10-01T00:00:00Z'}]},now);assert.equal(old.kind,'stale');assert.match(old.message,/Latest source item: 2026-10-01/);
 const empty=assessFeed({...payload,articles:[]},now);assert.equal(empty.kind,'empty');assert.match(empty.message,/No matching stories/);
 assert.equal(assessFeed(null,now).kind,'unavailable');
 assert.equal(assessFeed({...payload,generated:'2027-01-01'},now).kind,'invalid');
});
test('failed preference persistence returns failure without throwing',()=>{assert.equal(saveStorage('test',[]),false)});
