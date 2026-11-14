import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {checkBoundary} from '../scripts/check-public-boundary.mjs';
test('uppercase HTML receives form and collection field checks',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kk-html-case-'));
 await fs.writeFile(path.join(dir,'X.HTML'),'<form><input type=email><input type=password></form>');
 const result=await checkBoundary(dir);
 assert.equal(result.html,1);assert.equal(result.js,0);
 assert.ok(result.errors.some(x=>x.includes('New form')));
 assert.ok(result.errors.some(x=>x.includes('collection/auth field')));
});
