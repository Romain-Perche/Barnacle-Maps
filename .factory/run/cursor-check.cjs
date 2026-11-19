// Usage: NODE_PATH=/opt/playwright/node_modules node .factory/run/cursor-check.js  (app on :8000)
const { chromium } = require('playwright');
const LF = process.env.LEAFLET_DIR || '/tmp/lf/x';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ geolocation:{latitude:48.85,longitude:2.35}, permissions:['geolocation'], viewport:{width:1200,height:800}, ignoreHTTPSErrors:true });
  const page = await ctx.newPage();
  const blockCursor = process.env.BLOCK === '1';
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('unpkg.com')) return r.fulfill({contentType: u.endsWith('.css')?'text/css':'application/javascript', headers:{'access-control-allow-origin':'*'}, body: require('fs').readFileSync(LF+(u.endsWith('.png')?'/package/dist/images/':'/package/dist/')+u.split('/').pop())});
    if (u.includes('tile.openstreetmap.org')) return r.fulfill({contentType:'image/png', body:png});
    if (u.includes('nominatim')) return r.fulfill({contentType:'application/json', body:JSON.stringify([{display_name:'Place A',lat:'48.86',lon:'2.36'},{display_name:'Place B',lat:'48.84',lon:'2.34'}])});
    if (u.includes('routing.openstreetmap.de')) return r.fulfill({contentType:'application/json', body:JSON.stringify({code:'Ok',routes:[{distance:2000,duration:1500,geometry:{coordinates:[[2.35,48.85],[2.355,48.855],[2.36,48.86]]}},{distance:2400,duration:1700,geometry:{coordinates:[[2.35,48.85],[2.352,48.858],[2.36,48.86]]}}]})});
    if (blockCursor && u.includes('map-cursor.svg')) return r.abort();
    return r.continue();
  });
  page.on('console',m=>console.log('console',m.text()));page.on('requestfailed',q=>console.log('fail',q.url()));await page.goto('http://localhost:8000/');
  await page.waitForSelector('.leaflet-interactive', {state:'attached', timeout:10000}).catch(()=>{});
  const cur = async (sel, pos) => page.evaluate(([s,p]) => {
    let el = s ? document.querySelector(s) : document.elementFromPoint(p[0], p[1]);
    return el ? el.tagName+'.'+el.className+' => '+getComputedStyle(el).cursor : 'none';
  }, [sel, pos]);
  console.log('empty map', await cur(null,[800,500]));
  console.log('zoom +', await cur('.leaflet-control-zoom-in'));
  console.log('attribution', await cur('.leaflet-control-attribution a'));
  console.log('user dot', await cur('path.leaflet-interactive'));
  console.log('search box', await cur('#search-input'));
  await page.fill('#search-input','Place'); await page.press('#search-input','Enter');
  await page.waitForSelector('#results button');
  console.log('result btn', await cur('#results button'));
  await page.click('#results button');
  await page.waitForSelector('#routes li',{timeout:10000}).catch(()=>console.log('no routes'));
  console.log('route option', await cur('#routes li'));
  console.log('dest marker', await cur('.leaflet-marker-icon'));
  const n = await page.locator('path.leaflet-interactive').count(); console.log('paths', n);
  for (let i=0;i<n;i++) console.log(' path',i, await page.evaluate(i=>{const e=document.querySelectorAll('path.leaflet-interactive')[i];return getComputedStyle(e).cursor},i));
  // click map without moving
  await page.mouse.move(800,500); await page.mouse.click(800,500);
  const tip = await page.evaluate(()=>{const t=document.querySelector('.leaflet-popup-tip').getBoundingClientRect();return [t.x+t.width/2,t.y+t.height/2]});
  console.log('popup tip', tip);
  console.log('popup btn', await cur('.add-stop-here'));
  console.log('popup wrapper', await cur('.leaflet-popup-content-wrapper'));
  console.log('popup tip cursor', await cur('.leaflet-popup-tip'));
  await page.mouse.move(700,400); await page.mouse.down(); await page.mouse.move(750,420,{steps:5});
  console.log('dragging', await page.evaluate(()=>document.body.className+' | '+getComputedStyle(document.getElementById('map')).cursor));
  await page.mouse.up();
  console.log('after drag', await cur(null,[750,420]));
  await page.mouse.move(650,300); await page.mouse.wheel(0,-300); await page.waitForTimeout(500);
  console.log('after wheel', await cur(null,[650,300]));
  await page.screenshot({path:'/tmp/s.png'});
  await b.close();
})();
