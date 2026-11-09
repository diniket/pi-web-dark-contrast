// Test-only HTML decoration. The actual installed Pi Web assets/API remain upstream.
import http from 'node:http';
import net from 'node:net';
import { readFile } from 'node:fs/promises';
const upstreamPort=Number(process.env.PI_WEB_PREVIEW_WEB_PORT??8516);
const port=Number(process.env.PI_WEB_PREVIEW_PORT??8517);
const context=process.env.PI_WEB_PREVIEW_CONTEXT??JSON.stringify({project:{id:'redesign-fixture',name:'Pi Web Preview',path:'/home/marco/Progetti/pi-central-hub',createdAt:'2026-11-09T18:00:00.000Z'}});
const allowedHost=req=>['127.0.0.1','localhost'].includes((req.headers.host??'').split(':')[0]);
const server=http.createServer(async(req,res)=>{
  if(!allowedHost(req)){res.writeHead(403);res.end('Local preview only');return;}
  if(req.url==='/__redesign/baseline.css'){res.writeHead(200,{'Content-Type':'text/css','Cache-Control':'no-store'});res.end(await readFile(new URL('../assets/base-pi-web-dark.css',import.meta.url)));return;}
  if(req.url==='/__redesign/context.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(context);return;}
  if(['/__redesign/fixture.js','/__redesign/browser-checks.js'].includes(req.url)) {
    res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
    res.end(await readFile(new URL('./'+req.url.split('/').at(-1),import.meta.url))); return;
  }
  const upstream=http.request({host:'127.0.0.1',port:upstreamPort,path:req.url,method:req.method,headers:{...req.headers,'accept-encoding':'identity'}},response=>{
    if(response.headers['content-type']?.includes('text/html')) {
      const chunks=[];response.on('data',c=>chunks.push(c));response.on('end',()=>{
        const html=Buffer.concat(chunks).toString().replace('</body>','<script type="module" src="/__redesign/fixture.js"></script></body>');
        const headers={...response.headers}; delete headers['content-length'];delete headers['content-encoding'];
        res.writeHead(response.statusCode,headers);res.end(html);
      });
    } else {res.writeHead(response.statusCode,response.headers);response.pipe(res);}
  });
  upstream.on('error',()=>{res.writeHead(502);res.end('Preview upstream unavailable');});req.pipe(upstream);
});
server.on('upgrade',(req,socket,head)=>{
  if(!allowedHost(req)){socket.destroy();return;}
  const peer=net.connect(upstreamPort,'127.0.0.1',()=>{
    peer.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${Object.entries(req.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')}\r\n\r\n`);
    if(head.length)peer.write(head);socket.pipe(peer);peer.pipe(socket);
  });
  peer.on('error',()=>socket.destroy());socket.on('error',()=>peer.destroy());socket.on('close',()=>peer.destroy());
});
const sockets=new Set();
server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
server.listen(port,'127.0.0.1',()=>console.log(`PREVIEW_PROXY_READY :${port}`));
process.on('SIGTERM',()=>{for(const socket of sockets)socket.destroy();server.close(()=>process.exit());});
