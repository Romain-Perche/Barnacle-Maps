// Edge case 2: touch emulation. Tap empty map -> "Add stop here" popup at tap point; one-finger drag 100px -> centre moves. App on :8000.
const { chromium } = require('playwright'); const fs=require('fs'); const LF=process.env.LEAFLET_DIR||'/tmp/lf/x';
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({hasTouch:true,isMobile:true,viewport:{width:800,height:900}});const page=await ctx.newPage();
await page.addInitScript(()=>{let l;Object.defineProperty(window,'L',{configurable:true,get(){return l},set(v){l=v;v.Map.addInitHook(function(){window.__map=this;this.on('dragstart',()=>window.__drag=(window.__drag||0)+1)})}})});
await page.route('**/*',r=>{const u=r.request().url();
 if(u.includes('unpkg.com'))return r.fulfill({contentType:u.endsWith('.css')?'text/css':'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(LF+(u.endsWith('.png')?'/package/dist/images/':'/package/dist/')+u.split('/').pop())});
 if(u.includes('openstreetmap')||u.includes('nominatim'))return r.abort(); return r.continue();});
await page.goto('http://localhost:8000/');await page.waitForTimeout(1500);
const box=await page.locator('#map').boundingBox(); const x=Math.round(box.x+box.width/2), y=Math.round(box.y+box.height/2);
await page.touchscreen.tap(x,y); await page.waitForTimeout(500);
const pop=await page.evaluate(()=>{const t=document.querySelector('.leaflet-popup-tip-container');if(!t)return null;const e=t.getBoundingClientRect();return {x:e.x+e.width/2,y:e.y+e.height,text:document.querySelector('.leaflet-popup-content').innerText}});
console.log('TAP at',x,y,'popup',JSON.stringify(pop), pop&&Math.abs(pop.x-x)<=2&&/Add stop here/.test(pop.text)?'PASS':'FAIL');
await page.evaluate(()=>document.querySelector('.leaflet-popup-close-button')?.click());
const cdp=await ctx.newCDPSession(page); const before=await page.evaluate(()=>JSON.stringify(window.__map.getCenter()));
const pt=(px)=>[{x:px-100,y:y+200}];
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(x)});
for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(x+i*10)});await page.waitForTimeout(16);}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await page.waitForTimeout(500);
const after=await page.evaluate(()=>JSON.stringify(window.__map.getCenter())+' dragstarts='+window.__drag);
console.log('DRAG 100px centre',before,'->',after, !after.startsWith(before)?'PASS':'FAIL');
await b.close()})()
