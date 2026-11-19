// Extra checks: popup tip vs click point, route option cursor, blocked cursor image. App on :8000.
const { chromium } = require('playwright'); const fs=require('fs'); const LF=process.env.LEAFLET_DIR||'/tmp/lf/x';
(async()=>{const b=await chromium.launch();
for (const block of [false,true]) {
const ctx=await b.newContext({ignoreHTTPSErrors:true,geolocation:{latitude:48.85,longitude:2.35},permissions:['geolocation'],viewport:{width:1200,height:800}});const page=await ctx.newPage();
await page.route('**/*',r=>{const u=r.request().url();
 if(u.includes('unpkg.com'))return r.fulfill({contentType:u.endsWith('.css')?'text/css':'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(LF+(u.endsWith('.png')?'/package/dist/images/':'/package/dist/')+u.split('/').pop())});
 if(u.includes('nominatim'))return r.fulfill({contentType:'application/json',body:JSON.stringify([{display_name:'Place A',lat:'48.86',lon:'2.36'}])});
 if(u.includes('routing.openstreetmap.de'))return r.fulfill({contentType:'application/json',body:JSON.stringify({code:'Ok',routes:[{distance:2000,duration:1500,geometry:{coordinates:[[2.35,48.85],[2.36,48.86]]}},{distance:2400,duration:1700,geometry:{coordinates:[[2.35,48.85],[2.352,48.858],[2.36,48.86]]}}]})});
 if(block&&u.includes('map-cursor.svg'))return r.abort();
 if(u.includes('openstreetmap'))return r.abort(); return r.continue();});
await page.goto('http://localhost:8000/');await page.waitForTimeout(1500);
console.log(block?'BLOCKED':'NORMAL','map cursor',await page.evaluate(()=>getComputedStyle(document.getElementById('map')).cursor));
await page.mouse.click(800,500);
const t=await page.evaluate(()=>{const e=document.querySelector('.leaflet-popup-tip-container').getBoundingClientRect();return [e.x+e.width/2,e.y]});
console.log(' click 800,500 popup anchor',t);
if(!block){
await page.fill('#search-input','Place');await page.press('#search-input','Enter');await page.waitForSelector('#results button');await page.click('#results button');await page.waitForSelector('#routes li');
console.log(' routes html',await page.evaluate(()=>document.getElementById('routes').innerHTML.slice(0,300)));
console.log(' routes children cursor',await page.evaluate(()=>[...document.querySelectorAll('#routes *')].map(e=>e.tagName+':'+getComputedStyle(e).cursor).join(' ')));
await page.keyboard.press('Tab');
}
await ctx.close();}
await b.close()})()
