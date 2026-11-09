import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const asset=name=>readFile(new URL('../assets/'+name,import.meta.url),'utf8');
const css=await asset('dark-contrast.css');
const tokens=await asset('tokens.css');
const baseline=await asset('base-pi-web-dark.css');
const manifest=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const entry=manifest.piWeb.plugins[0];
const theme=entry.themes[0];
const clean=s=>s.replace(/\/\*[\s\S]*?\*\//g,'');
const hosts=new Set(['pi-web-app','app-navigation-panel','app-panel-edge-control','project-list','workspace-list','session-list','chat-view','tool-execution-view','workspace-panel','app-mobile-main-tabs','prompt-editor','status-bar']);
test('real selectable CSS-first theme; no JavaScript module, server or dependencies',()=>{
 assert.equal(entry.id,'dark-contrast');assert.equal(entry.defaultEnabled,true);
 assert.equal(entry.module,undefined);assert.equal(entry.serverModule,undefined);
 assert.equal(manifest.dependencies,undefined);assert.equal(manifest.devDependencies,undefined);
 assert.equal(entry.themes.length,1);assert.equal(theme.id,'dark-contrast');
 assert.equal(theme.name,'Dark Contrast');assert.equal(theme.colorScheme,'dark');
 assert.equal(entry.browserRoot,'assets');assert.equal(entry.themePairs,undefined);
});
test('official Pi Web Dark plugin baseline is preserved byte-for-byte',()=>{
 assert.equal(createHash('sha256').update(baseline).digest('hex'),'88b39cf2e51b820dacbf1bfdc412c4f2acdb0cf18fcf9d96880e492137ff7692');
 assert.equal([...baseline.matchAll(/--pi-[\w-]+\s*:/g)].length,52);
});
test('every direct redesign selector is restricted to an audited core shadow host',()=>{
 const rules=[...clean(css).matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim()).filter(s=>!s.startsWith('@'));
 assert.ok(rules.length>35);
 for(const rule of rules)for(const s of rule.split(',')){
  const match=s.trim().match(/^:host\(([a-z-]+)\)\s+/);
  assert.ok(match,`Unscoped selector: ${s}`);assert.ok(hosts.has(match[1]),`Unaudited host: ${s}`);
 }
});
test('redesign does not overwrite official plugin variables or font inheritance',()=>{
 assert.doesNotMatch(clean(css+tokens),/--pi-[\w-]+\s*:/);
 assert.doesNotMatch(clean(css),/:host\([^)]*\)\s*\{/);
 assert.doesNotMatch(clean(css),/:root|:host-context|!important|@import/);
 assert.doesNotMatch(clean(tokens),/--(?!dc-)[\w-]+\s*:/);
 assert.doesNotMatch(clean(css),/\.panel-content|\.workspace-label-render|\.session-labels|pi-web-transcript-renderer|openspec/i);
});
test('CSS does not replace interaction, positioning, responsive grids or hidden states',()=>{
 assert.doesNotMatch(clean(css),/\b(display|position|pointer-events|grid-template-columns|grid-template-rows|visibility)\s*:/);
 assert.doesNotMatch(clean(css),/\[(hidden|inert)\]/);
 assert.match(css,/@media \(forced-colors: active\)/);assert.match(css,/:focus-visible/);
});
function luminance(hex){const rgb=hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
const palette=Object.fromEntries([...tokens.matchAll(/--dc-([\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const contrast=(a,b)=>{const [lo,hi]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (hi+.05)/(lo+.05);};
for(const [fg,bg] of [['text','bg'],['text','panel'],['secondary','sidebar'],['secondary','panel'],['secondary','bg'],['accent','bg'],['accent','panel'],['text','hover'],['error','sidebar'],['text','selection'],['bg','accent'],['success','panel'],['error','panel']]){
 test(`text contrast ${fg}/${bg} meets WCAG AA`,()=>assert.ok(contrast(palette[fg],palette[bg])>=4.5));
}
test('essential input boundary meets non-text 3:1 contrast',()=>{
 for(const bg of ['panel','bg'])assert.ok(contrast(palette['control-border'],palette[bg])>=3);
});
test('one atomic, package-local theme sheet, using host revisioned asset URLs',async()=>{
 assert.deepEqual(theme.stylesheets,[{id:'appearance',path:'theme.css',order:2000}]);
 const generated=await asset('theme.css');
 assert.ok(Buffer.byteLength(generated)<2*1024*1024);assert.doesNotMatch(clean(generated),/@import/);
 assert.ok(generated.includes(baseline));assert.ok(generated.includes(tokens));assert.ok(generated.includes(css));
 const declarations=[...generated.matchAll(/(--pi-[\w-]+)\s*:/g)].map(m=>m[1]);
 assert.equal(declarations.length,52);assert.equal(new Set(declarations).size,52);
});
