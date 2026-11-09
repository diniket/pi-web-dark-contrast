// Isolated local preview. Never uses the hosting daemon/profile/configuration.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,symlink,stat} from 'node:fs/promises';
import {tmpdir,homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const packageRoot=fileURLToPath(new URL('../',import.meta.url));
const runtime=process.env.PI_WEB_PREVIEW_PACKAGE??join(homedir(),'.npm-global/lib/node_modules/@jmfederico/pi-web');
await stat(join(runtime,'dist/server/index.js'));
const base=await mkdtemp(join(tmpdir(),'pi-web-dark-contrast-preview-'));
const webPort=Number(process.env.PI_WEB_PREVIEW_WEB_PORT??8516);
const port=Number(process.env.PI_WEB_PREVIEW_PORT??8517);
if(![webPort,port].every(n=>Number.isInteger(n)&&n>1023&&n<=65535)||webPort===port)throw new Error('Distinct unprivileged preview ports required');
const project={id:'redesign-fixture',name:'Pi Web Preview',path:resolve(process.env.PI_WEB_PREVIEW_PROJECT??join(packageRoot,'..')),createdAt:'2026-11-09T18:00:00.000Z'};
await mkdir(join(base,'data/plugins'),{recursive:true});
await mkdir(join(base,'agent'),{recursive:true});
await symlink(packageRoot,join(base,'data/plugins/dark-contrast'));
if(process.env.PI_WEB_PREVIEW_OPENSPEC_PATH)await symlink(resolve(process.env.PI_WEB_PREVIEW_OPENSPEC_PATH),join(base,'data/plugins/openspec-status'));
await writeFile(join(base,'data/projects.json'),JSON.stringify({projects:[project]}));
await writeFile(join(base,'config.json'),JSON.stringify({host:'127.0.0.1',port:webPort,installationName:'Pi Web Redesign Preview',hostAccess:{mode:'restricted',hosts:['127.0.0.1','localhost']},defaultTheme:{themeId:'dark-contrast:dark-contrast',auto:false},plugins:{'dark-contrast':{enabled:true},git:{settings:{workspaceDiscoveryHooks:false}}}}));
// Deliberately do not forward provider credentials or inherited PI_WEB_* values.
const env=Object.fromEntries(['PATH','HOME','USER','LOGNAME','LANG','LC_ALL','TZ'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{PI_WEB_DATA_DIR:join(base,'data'),PI_WEB_CONFIG:join(base,'config.json'),PI_WEB_SESSIOND_SOCKET:join(base,'data/sessiond.sock'),PI_WEB_PORT:String(webPort),PI_CODING_AGENT_DIR:join(base,'agent'),PI_CODING_AGENT_SESSION_DIR:join(base,'empty-conversations'),PI_WEB_PI_PACKAGE_DIR:process.env.PI_WEB_PREVIEW_PI_PACKAGE??join(homedir(),'.pi/agent/install'),PI_WEB_PREVIEW_WEB_PORT:String(webPort),PI_WEB_PREVIEW_PORT:String(port),PI_WEB_PREVIEW_CONTEXT:JSON.stringify({project})});
const children=[spawn(process.execPath,[join(runtime,'dist/server/sessiond.js')],{env,stdio:'inherit'}),spawn(process.execPath,[join(runtime,'dist/server/index.js')],{env,stdio:'inherit'}),spawn(process.execPath,[fileURLToPath(new URL('./preview-proxy.mjs',import.meta.url))],{env,stdio:'inherit'})];
console.log(`Preview: http://127.0.0.1:${port}/\nIsolated state: ${base}\nCtrl+C stops only these preview processes.`);
let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
for(const child of children){child.on('error',e=>{console.error(e);process.exitCode=1;stop();});child.on('exit',code=>{if(!stopping){process.exitCode=code??1;stop();}});}
