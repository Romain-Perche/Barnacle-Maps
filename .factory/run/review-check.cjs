// Review checks for SF-91: drag cursor, popup tip vs click, stop marker, keyboard, blocked cursor, ring visibility. App on :8000.
// Usage: NODE_PATH=/opt/playwright/node_modules node .factory/run/review-check.cjs
const { chromium } = require('playwright'); const fs=require('fs'); const LF=process.env.LEAFLET_DIR||'/tmp/lf/x';
const route=(page,block)=>page.route('**/*',r=>{const u=r.request().url();
 if(u.includes('unpkg.com'))return r.fulfill({contentType:u.endsWith('.css')?'text/css':'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(LF+(u.endsWith('.png')?'/package/dist/images/':'/package/dist/')+u.split('/').pop())});
 if(u.includes('nominatim'))return r.fulfill({contentType:'application/json',body:JSON.stringify([{display_name:'Place A',lat:'48.86',lon:'2.36'}])});
 if(u.includes('routing.openstreetmap.de'))return r.fulfill({contentType:'application/json',body:JSON.stringify({code:'Ok',routes:[{distance:2000,duration:1500,geometry:{coordinates:[[2.35,48.85],[2.36,48.86]]}},{distance:2400,duration:1700,geometry:{coordinates:[[2.35,48.85],[2.352,48.858],[2.36,48.86]]}}]})});
 if(block&&u.includes('map-cursor.svg'))return r.abort();
 if(u.includes('openstreetmap'))return r.abort(); return r.continue();});
const at=(page,x,y)=>page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e.tagName+'.'+(e.getAttribute('class')||'')+' => '+getComputedStyle(e).cursor},[x,y]);
(async()=>{const b=await chromium.launch();
for (const block of [false,true]){
 const ctx=await b.newContext({geolocation:{latitude:48.85,longitude:2.35},permissions:['geolocation'],viewport:{width:1200,height:800}});const page=await ctx.newPage();
 await page.addInitScript(()=>{let l;Object.defineProperty(window,'L',{configurable:true,get(){return l},set(v){l=v;v.Map.addInitHook(function(){window.__map=this})}})});
 let svgFailed=false; page.on('requestfailed',q=>{if(q.url().includes('map-cursor'))svgFailed=true});
 await route(page,block); await page.goto('http://localhost:8000/'); await page.waitForTimeout(1500);
 const tag=block?'BLOCKED':'NORMAL';
 // click without moving: compare tip bottom to click point
 const pts=[[600,300],[900,600],[500,650]]; for(const [x,y] of pts){
  await page.mouse.move(x,y); console.log(tag,'cursor at',x,y,await at(page,x,y)); await page.mouse.click(x,y); await page.waitForTimeout(300);
  const t=await page.evaluate(()=>{const e=document.querySelector('.leaflet-popup-tip');if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height, document.querySelector('.leaflet-popup-content').innerText]});
  console.log(tag,' click',x,y,'tip',JSON.stringify(t), t&&Math.abs(t[0]-x)<=2&&Math.abs(t[1]-y)<=2?'OK':'OFF');
  if(!block){ const w=await page.evaluate(()=>{const r=document.querySelector('.leaflet-popup-content-wrapper').getBoundingClientRect();return [r.x+5,r.y+5]}); console.log('  popup white area',await at(page,w[0],w[1]));}
  await page.evaluate(()=>window.__map.closePopup()); await page.waitForTimeout(300);
 }
 if(block){ console.log('BLOCKED svg request failed:',svgFailed); await ctx.close(); continue; }
 // drag
 await page.mouse.move(700,400); await page.mouse.down();
 for(let i=1;i<=5;i++){await page.mouse.move(700+i*15,400+i*5); console.log(' during drag',i,await at(page,700+i*15,400+i*5), 'html.cls', await page.evaluate(()=>document.documentElement.className));}
 await page.mouse.up(); console.log(' after release',await at(page,775,425));
 // add a stop via popup
 await page.mouse.click(600,300); await page.waitForSelector('.add-stop-here'); const bb=await page.locator('.leaflet-popup .add-stop-here').last().boundingBox();
 console.log(' add-stop-here btn',await at(page,bb.x+bb.width/2,bb.y+bb.height/2)); await page.locator('.leaflet-popup .add-stop-here').last().click(); await page.waitForTimeout(300);
 // search -> dest marker + routes
 await page.fill('#search-input','Place');await page.press('#search-input','Enter');await page.waitForSelector('#results button');
 const rb=await page.locator('#results button').first().boundingBox(); console.log(' search result',await at(page,rb.x+5,rb.y+5));
 await page.click('#results button');await page.waitForSelector('#routes li button');await page.waitForTimeout(500);
 for (const [n,s] of [['stop marker','.stop-marker'],['dest marker','img.leaflet-marker-icon'],['user dot','path.leaflet-interactive']]){const c=await page.locator(s).first().boundingBox(); console.log(' ',n, c?await at(page,c.x+c.width/2,c.y+c.height/2):'MISSING');}
 // route line: sample its middle point
 const mid=await page.evaluate(()=>{const ps=[...document.querySelectorAll('path.leaflet-interactive')];const p=ps[ps.length-1];const L=p.getTotalLength();const pt=p.getPointAtLength(L/2);const m=p.getScreenCTM();return [pt.x*m.a+m.e,pt.y*m.d+m.f]});
 await page.mouse.move(mid[0],mid[1]); console.log(' route line',await at(page,mid[0],mid[1])); await page.mouse.move(mid[0]+60,mid[1]-80); console.log(' off line',await at(page,mid[0]+60,mid[1]-80));
 // panel: route option, search box, everything
 const ro=await page.locator('#routes li button').nth(1).boundingBox(); console.log(' route option',await at(page,ro.x+10,ro.y+5));
 console.log(' panel cursors',await page.evaluate(()=>[...new Set([...document.querySelectorAll('#panel, #panel *')].map(e=>getComputedStyle(e).cursor))].join(',')));
 // zoom buttons, attribution
 for (const s of ['.leaflet-control-zoom-in','.leaflet-control-zoom-out','.leaflet-control-attribution a']){const c=await page.locator(s).first().boundingBox(); console.log(' ',s,await at(page,c.x+c.width/2,c.y+c.height/2));}
 // wheel zoom
 const z0=await page.evaluate(()=>window.__map.getZoom()); await page.mouse.move(650,250); await page.mouse.wheel(0,-300); await page.waitForTimeout(600);
 console.log(' wheel zoom',z0,'->',await page.evaluate(()=>window.__map.getZoom()),await at(page,650,250));
 // keyboard: tab to route 2, Enter
 await page.focus('#search-input'); let found=false;
 for(let i=0;i<15;i++){await page.keyboard.press('Tab'); const f=await page.evaluate(()=>{const a=document.activeElement;return {t:a.textContent.slice(0,30),o:getComputedStyle(a).outlineStyle+' '+getComputedStyle(a).outlineWidth}}); if(f.t.startsWith('Route 2')){console.log(' focused',JSON.stringify(f)); found=true;break;}}
 await page.keyboard.press('Enter'); await page.waitForTimeout(300);
 console.log(' after Enter pressed:',await page.evaluate(()=>[...document.querySelectorAll('#routes li button')].map(b=>b.getAttribute('aria-pressed')).join(',')));
 await ctx.close();}
// ring visibility: render the cursor svg on street/park/water colours (OSM palette), magnified
const p=await b.newPage({viewport:{width:600,height:140}}); const svg=fs.readFileSync('assets/map-cursor.svg','utf8');
await p.setContent(['#f2efe9','#c8facc','#aad3df','#1a3a5c'].map(c=>`<div style="display:inline-block;background:${c};padding:10px;zoom:3">${svg}</div>`).join(''));
await p.screenshot({path:'.factory/run/ring-on-backgrounds.png'});
const px=await p.evaluate(async()=>{return 'ok'}); await b.close(); console.log('screenshot saved');
})();
