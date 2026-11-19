// US2 scenario 5: the panel (#panel, top-left, z-index 1000) covers Leaflet's zoom control on main too; hide it, then hover +/−. App on :8000.
const { chromium } = require('playwright'); const fs=require('fs'); const LF=process.env.LEAFLET_DIR||'/tmp/lf/x';
(async()=>{const b=await chromium.launch();const page=await b.newPage({viewport:{width:1200,height:800}});
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('unpkg.com'))return r.fulfill({contentType:u.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync(LF+(u.endsWith('.png')?'/package/dist/images/':'/package/dist/')+u.split('/').pop())});if(u.includes('openstreetmap'))return r.abort();return r.continue();});
await page.goto('http://localhost:8000/');await page.waitForTimeout(1000);await page.addStyleTag({content:'#panel{display:none}'});
for(const s of ['.leaflet-control-zoom-in','.leaflet-control-zoom-out']){const c=await page.locator(s).boundingBox();await page.mouse.move(c.x+c.width/2,c.y+c.height/2);
console.log(s,await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e.className+' => '+getComputedStyle(e).cursor},[c.x+c.width/2,c.y+c.height/2]));}
await b.close()})()
