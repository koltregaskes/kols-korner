import {test,expect} from '@playwright/test';
import {findHorizontalOverflow} from './overflow-check.mjs';
for(const width of [320,390]){
 test('overflow guard detects root-clipped content at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});await page.setContent('<style>html,body{margin:0;width:100%;overflow-x:hidden}.wide{width:600px;height:20px}</style><div class="wide">Offscreen content</div>');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await page.evaluate(findHorizontalOverflow)).length).toBeGreaterThan(0);
 });
 test('overflow guard accepts content inside a bounded clip at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});await page.setContent('<style>html,body{margin:0;width:100%;overflow-x:hidden}.clip{width:100px;overflow:hidden}.wide{width:600px;height:20px}</style><div class="clip"><div class="wide">Contained rail</div></div>');
  expect(await page.evaluate(findHorizontalOverflow)).toEqual([]);
 });
}
