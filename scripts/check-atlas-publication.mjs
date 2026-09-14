import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const allowed=new Set(['assets/atlas-data.json','assets/policy-data.json','assets/exemption-evidence.json','assets/sandbox-index.json','assets/sandbox-detail.json','assets/korea-explore.geojson','assets/municipalities.geojson','licenses/Three-MIT.txt','licenses/Pretendard-OFL.txt']);
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const full=join(dir,e.name);if(e.isSymbolicLink())throw new Error('Symlinks are not allowed in atlas publication');if(e.isDirectory())result.push(...await files(full));else if(e.isFile())result.push(full);}return result;}
const publicRoot=join(root,'public/atlas'),published=await files(publicRoot);
for(const file of published){if(!allowed.has(relative(publicRoot,file)))throw new Error('Unexpected atlas public artifact: '+relative(publicRoot,file));}
if(published.length!==allowed.size)throw new Error('Atlas public metadata or attribution is missing');
const marker=/\/Users\/|\/home\/|file:\/\/|localhost|127\.0\.0\.1|(?:apiKey|serviceKey|password|secret)\s*[=:]\s*["']?[^\s"']+/i;
for(const file of [...published,...await files(join(root,'src/atlas')),join(root,'src/pages/atlas.astro')]){
 if(file.endsWith('.woff2'))continue;
 if(marker.test(await readFile(file,'utf8')))throw new Error('Private/local marker in atlas publication: '+relative(root,file));
}
console.log('Atlas publication boundary passed: runtime and public metadata only.');
