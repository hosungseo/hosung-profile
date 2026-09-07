import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Allowlist only the interactive application and its public source metadata.
// Never recursively publish the research workspace, plans, captures or test drafts.
const root=fileURLToPath(new URL('../',import.meta.url));
const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/import-atlas.mjs /path/to/atlas-project');
const modules=['app.mjs','graph-model.mjs','swarm-scene.mjs','content-guide.mjs','content-view.mjs','support-model.mjs','support-view.mjs','enterprise-workspace.mjs','workspace-model.mjs'];
const styles=['style.css','content.css','support.css','enterprise.css'];
const data=['atlas-data.json','policy-data.json','exemption-evidence.json','korea-explore.geojson','municipalities.geojson'];
const privateMarker=/\/Users\/|\/home\/|localhost|127\.0\.0\.1|file:\/\/|(?:apiKey|serviceKey|password|secret)\s*[=:]\s*["']?[^\s"']+/i;
const contents=new Map();
for(const name of [...modules,...styles,'index.html',...data.map(f=>'assets/'+f)]){
 const text=await readFile(resolve(source,name),'utf8');
 if(privateMarker.test(text))throw new Error('Publication blocked by a private/local marker in '+name);
 contents.set(name,text);
}
await mkdir(resolve(root,'src/atlas/assets'),{recursive:true});
await mkdir(resolve(root,'public/atlas/assets'),{recursive:true});
for(const name of [...modules,...styles])await writeFile(resolve(root,'src/atlas',name),contents.get(name));
for(const name of data)await writeFile(resolve(root,'public/atlas/assets',name),contents.get('assets/'+name));
await copyFile(resolve(source,'assets/pretendard.woff2'),resolve(root,'src/atlas/assets/pretendard.woff2'));
let html=contents.get('index.html');
html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'');
html=html.replace(/<link rel="stylesheet" href="(?:style|content|support|enterprise)\.css">/g,'');
html=html.replace('<head>','<head><base href="/atlas/"><link rel="canonical" href="https://seohosung.com/atlas/">');
html=html.replace('<header><a class="brand"','<header><a class="site-back" href="/" aria-label="서호성 사이트로 돌아가기" title="사이트로 돌아가기">←</a><a class="brand"');
html=html.replace('<script type="module" src="app.mjs"></script>','<script src="../atlas/app.mjs"></script>');
const imports=[...styles,'site-integration.css'].map(name=>`import '../atlas/${name}';`).join('\n');
await writeFile(resolve(root,'src/pages/atlas.astro'),`---\n${imports}\n---\n`+html);
console.log(`Atlas imported: ${modules.length} modules, ${styles.length} styles, ${data.length} public metadata files and one font. Plans and user drafts excluded.`);
