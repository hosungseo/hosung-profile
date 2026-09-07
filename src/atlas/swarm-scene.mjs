import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TYPES} from './graph-model.mjs';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const hash=s=>[...s].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
const unit=s=>(hash(s)%10000)/10000;
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
const area=ring=>Math.abs(ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p[0]*q[1]-q[0]*p[1]},0));
const inside=(point,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes};
function interior(features){
 const ring=features.flatMap(f=>polygons(f).map(p=>p[0])).sort((a,b)=>area(b)-area(a))[0];
 if(!ring)return null;
 const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),lo=[Math.min(...xs),Math.min(...ys)],hi=[Math.max(...xs),Math.max(...ys)];let best=ring[0],bestScore=-1;
 for(let i=1;i<12;i++)for(let j=1;j<12;j++){const p=[lo[0]+(hi[0]-lo[0])*i/12,lo[1]+(hi[1]-lo[1])*j/12];if(!inside(p,ring))continue;let d=Infinity;for(let k=0;k<ring.length;k++){const a=ring[k],b=ring[(k+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));d=Math.min(d,(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)}if(d>bestScore){best=p;bestScore=d}}
 return best;
}
function dispose(group){const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)mats.add(m)});for(const g of geos)g.dispose();for(const m of mats)m.dispose();group.clear()}
export function createSwarmScene({stage,labels,atlas,geo,municipal,onSelect,onHover,onMapSelect,reduced=false,capture=false}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:capture});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','지도 위의 특례·공공데이터·중앙 및 지방정부 사업 3D 연결망. 지역 선택과 검색으로도 탐색할 수 있습니다.');stage.prepend(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#03080d');scene.fog=new THREE.FogExp2('#03080d',.0012);
 const camera=new THREE.OrthographicCamera(-120,120,100,-100,.1,1500);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!reduced&&!capture;controls.dampingFactor=.07;controls.enablePan=true;controls.minZoom=.55;controls.maxZoom=2.6;controls.minPolarAngle=.25;controls.maxPolarAngle=1.38;controls.rotateSpeed=.42;controls.autoRotateSpeed=.32;
 scene.add(new THREE.HemisphereLight('#c7e7f1','#12242b',2.1));const light=new THREE.DirectionalLight('#bedadf',2);light.position.set(-80,160,70);scene.add(light);
 const map=new THREE.Group(),network=new THREE.Group(),atmosphere=new THREE.Group();scene.add(map,network,atmosphere);
 const texture=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.09,'#ffffffe6');g.addColorStop(.22,'#ffffff65');g.addColorStop(.5,'#ffffff15');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
 let glows=[],glowBatch=null;
 const glow=(p,color,size,opacity=.5)=>{const item={position:p.clone(),color:new THREE.Color(color),size,material:{opacity},visible:true};glows.push(item);return item};
 function createGlowBatch(){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(glows.length*3),3));geometry.setAttribute('aColor',new THREE.Float32BufferAttribute(glows.flatMap(g=>g.color.toArray()),3));geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(glows.map(g=>g.size),1));geometry.setAttribute('aOpacity',new THREE.Float32BufferAttribute(new Float32Array(glows.length),1));
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);geometry.attributes.aOpacity.setUsage(THREE.DynamicDrawUsage);
  const material=new THREE.ShaderMaterial({uniforms:{uTexture:{value:texture},uScale:{value:1}},vertexShader:'attribute vec3 aColor; attribute float aSize; attribute float aOpacity; uniform float uScale; varying vec3 vColor; varying float vOpacity; void main(){ vColor=aColor; vOpacity=aOpacity; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uScale; }',fragmentShader:'uniform sampler2D uTexture; varying vec3 vColor; varying float vOpacity; void main(){ float alpha=texture2D(uTexture,gl_PointCoord).a*vOpacity; if(alpha<0.003) discard; gl_FragColor=vec4(vColor,alpha); }',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  glowBatch=new THREE.Points(geometry,material);glowBatch.frustumCulled=false;network.add(glowBatch);
 }
 function updateGlows(){
  if(!glowBatch)return;const position=glowBatch.geometry.attributes.position,opacity=glowBatch.geometry.attributes.aOpacity;
  glows.forEach((g,i)=>{position.setXYZ(i,g.position.x,g.position.y,g.position.z);opacity.setX(i,g.visible?g.material.opacity:0)});position.needsUpdate=opacity.needsUpdate=true;glowBatch.material.uniforms.uScale.value=stage.clientHeight/(camera.top-camera.bottom)*camera.zoom*renderer.getPixelRatio();
 }
 const starPos=[];for(let i=0;i<700;i++)starPos.push((unit('x'+i)-.5)*700,unit('y'+i)*220-20,(unit('z'+i)-.5)*600);
 const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(starPos,3)),new THREE.PointsMaterial({color:'#6f9db4',size:.2,transparent:true,opacity:.36,sizeAttenuation:true}));atmosphere.add(stars);
 for(const radius of [78,105,140]){const points=Array.from({length:181},(_,i)=>V(Math.cos(i/180*Math.PI*2)*radius,-1.8,Math.sin(i/180*Math.PI*2)*radius));atmosphere.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#234351',transparent:true,opacity:.25})));}
 const grid=new THREE.GridHelper(330,33,'#152d38','#10222c');grid.position.y=-2;grid.material.transparent=true;grid.material.opacity=.09;atmosphere.add(grid);
 renderer.info.autoReset=false;
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.48,.50,.78);composer.addPass(bloom);composer.addPass(new OutputPass());
 let graph=null,renderNodes=[],renderEdges=[],mapObjects=[],pickObjects=[],selected=null,hovered=null,focusSet=new Set(),neighbors=new Set(),layers={topic:true,data:true,central:true,local:true},motion=!reduced,detailOpen=false,elapsed=0,last=0,raf=0,lastLabel=0,manualTime=null,transition=null,dragStart=null,expandedLabels=capture,focusStarted=0,contextTopic=null,supportMode=false,supportRole='',bundleData=new Set();
 const geoCache=new Map();
 function mapModel(region){
  if(geoCache.has(region||'national'))return geoCache.get(region||'national');
  const rr=atlas.regions.find(r=>r.name===region),fs=rr?municipal.features.filter(f=>rr.codes.includes(f.properties.code.slice(0,2))):geo.features;
  let project;
  if(rr){const points=fs.flatMap(f=>polygons(f).flatMap(p=>p[0]));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const lo=[Math.min(...xs),Math.min(...ys)],hi=[Math.max(...xs),Math.max(...ys)];const ratio=Math.cos((lo[1]+hi[1])/2*Math.PI/180);const scale=Math.min(133/((hi[0]-lo[0])*ratio),135/(hi[1]-lo[1]));project=p=>V((p[0]-(hi[0]+lo[0])/2)*ratio*scale,0,-(p[1]-(hi[1]+lo[1])/2)*scale)}else project=p=>V((p[0]-127.65)*29,0,-(p[1]-36.1)*34);
  const result={fs,project,rr};geoCache.set(region||'national',result);return result;
 }
 function drawMap(region){
  dispose(map);mapObjects=[];const model=mapModel(region);const {fs,project}=model;
  fs.forEach((f,index)=>{const geometries=[];for(const poly of polygons(f)){
   if(area(poly[0])<(region?.000018:.00035))continue;
   const shape=new THREE.Shape(poly[0].map(p=>{const v=project(p);return new THREE.Vector2(v.x,-v.z)}));for(const hole of poly.slice(1))shape.holes.push(new THREE.Path(hole.map(p=>{const v=project(p);return new THREE.Vector2(v.x,-v.z)})));
   const part=new THREE.ExtrudeGeometry(shape,{depth:region?.85:1.15,bevelEnabled:false});part.rotateX(-Math.PI/2);geometries.push(part);
  }
   if(!geometries.length)return;const geometry=mergeGeometries(geometries);for(const part of geometries)part.dispose();
   const material=new THREE.MeshStandardMaterial({color:region?['#122b35','#142e36','#10262f'][index%3]:['#152f39','#132a35','#16313a'][index%3],metalness:.25,roughness:.6,transparent:true,opacity:.96});
   const mesh=new THREE.Mesh(geometry,material);mesh.userData.base=material.color.clone();mesh.userData.code=f.properties.code;mesh.userData.mapRegion=region?null:atlas.regions.find(r=>r.codes.includes(f.properties.code))?.name;mesh.userData.city=region?f.properties.name:null;map.add(mesh);mapObjects.push(mesh);
   const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,45),new THREE.LineBasicMaterial({color:region?'#52818b':'#60949f',transparent:true,opacity:region?.42:.52,depthWrite:false}));map.add(outline);
  });
  return model;
 }
 function layout(model){
  const pts=new Map(),ts=graph.nodes.filter(n=>n.type==='topic'),ds=graph.nodes.filter(n=>n.type==='data'),supports=graph.nodes.filter(n=>['central','local'].includes(n.type));
  for(const n of graph.nodes.filter(n=>n.type==='region'))pts.set(n.id,model.project([n.ref.lon,n.ref.lat]).setY(graph.region?3:2.4));
  for(const n of graph.nodes.filter(n=>n.type==='city')){const fs=model.fs.filter(f=>n.ref.codes.includes(f.properties.code)),p=interior(fs);if(p)pts.set(n.id,model.project(p).setY(2.1));}
  ts.forEach((n,i)=>{
   const angle=i/ts.length*Math.PI*2+.3;
   if(graph.region){const locations=graph.edges.filter(e=>e.to===n.id&&e.kind==='location').map(e=>pts.get(e.from)).filter(Boolean);const centroid=locations.length?locations.reduce((p,v)=>p.add(v),V()).divideScalar(locations.length):V();pts.set(n.id,V(Math.cos(angle)*45+centroid.x*.22,24+(i%3)*13,Math.sin(angle)*43+centroid.z*.22));}
   else {const rs=graph.edges.filter(e=>e.to===n.id&&e.kind==='geography').map(e=>pts.get(e.from));const centroid=rs.length?rs.reduce((p,v)=>p.add(v),V()).divideScalar(rs.length):V();pts.set(n.id,V(centroid.x*.6+Math.cos(angle)*43,25+(i%4)*11,centroid.z*.6+Math.sin(angle)*43));}
  });
  ds.forEach((n,i)=>{const owners=graph.edges.filter(e=>e.to===n.id&&e.kind==='data').map(e=>pts.get(e.from));const base=owners.reduce((p,v)=>p.add(v),V()).divideScalar(owners.length||1);const a=unit(n.id)*Math.PI*2,dist=18+unit('dist'+n.id)*27;pts.set(n.id,base.add(V(Math.cos(a)*dist,8+unit('h'+n.id)*23,Math.sin(a)*dist)));});
  supports.forEach((n,i)=>{const same=supports.filter(x=>x.type===n.type),j=same.indexOf(n),a=j/Math.max(same.length,1)*Math.PI*.92+(n.type==='central'?-Math.PI/2:Math.PI/2);pts.set(n.id,V(Math.cos(a)*(graph.region?87:98),23+(j%4)*14,Math.sin(a)*(graph.region?64:78)));});
  // Relax only floating nodes. Geographic anchors remain fixed on the map.
  const floating=graph.nodes.filter(n=>['topic','data','central','local'].includes(n.type));const anchors=new Map(floating.map(n=>[n.id,pts.get(n.id).clone()]));
  for(let step=0;step<65;step++){
   for(let i=0;i<floating.length;i++){const a=floating[i],p=pts.get(a.id);for(let j=i+1;j<floating.length;j++){const b=floating[j],q=pts.get(b.id),d=p.clone().sub(q);const min=a.type==='data'&&b.type==='data'?8:13,dist=d.length();if(dist<min){if(dist<.01)d.set(1,.2,.3);d.normalize().multiplyScalar((min-dist)*.12);p.add(d);q.sub(d)}}p.lerp(anchors.get(a.id),.022);p.y=Math.max(15,Math.min(93,p.y));}
  }
  return pts;
 }
 function createNode(n,p){
  const color=TYPES[n.type].color;
  const size={region:1.1,city:.6,topic:1.85,data:.78,central:1.75,local:1.65}[n.type];
  const geometry=n.type==='topic'?new THREE.OctahedronGeometry(size):n.type==='central'?new THREE.TorusGeometry(size,.32,8,24):n.type==='local'?new THREE.TetrahedronGeometry(size):new THREE.SphereGeometry(size,12,10);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:n.type==='data'?.5:.65,metalness:.2,roughness:.3,transparent:true,opacity:1}));mesh.position.copy(p);mesh.userData.nodeId=n.id;if(n.type==='central')mesh.rotation.x=.55;network.add(mesh);pickObjects.push(mesh);
  const halo=glow(p,color,n.type==='topic'?6:n.type==='region'?5:3.5,n.type==='data'?.28:.45);
  if(n.type==='region'||n.type==='city'){const ring=new THREE.Mesh(new THREE.RingGeometry(size*1.8,size*2,40),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.5,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(p).setY(1.8);network.add(ring);}
  const label=document.createElement('button');label.type='button';label.className='node-label '+n.type;label.dataset.node=n.id;label.setAttribute('aria-label',TYPES[n.type].label+' · '+n.label);const key=document.createElement('i');key.className='key '+n.type;key.setAttribute('aria-hidden','true');if(!['region','city'].includes(n.type))label.append(key);const name=document.createElement('span');name.className='node-name';name.textContent=n.label;label.append(name);
  if(n.type==='region'&&!graph.region){const count=document.createElement('span');count.className='label-count';count.textContent=n.ref.topics.length?('주제 '+n.ref.topics.length):'미수록';label.classList.toggle('unlisted',!n.ref.topics.length);label.append(count)}
  if(['central','local'].includes(n.type)){const sub=document.createElement('span');sub.className='node-support-role';const profile=n.ref.supportProfile;sub.textContent=(n.ref.level==='central'?'중앙':n.ref.level==='sido'?'광역':n.ref.district||'시·군·구')+' · '+(profile?.roles.map(r=>r.short).slice(0,2).join('·')||'역할 미분류');label.append(sub);label.classList.toggle('municipal',n.ref.level==='gicho');label.classList.toggle('budget-record',n.ref.kind==='budget');label.setAttribute('aria-label',label.getAttribute('aria-label')+' · '+sub.textContent);}
  if(n.type==='data'){const rank=document.createElement('span');rank.className='data-rank';label.prepend(rank);}
  label.onclick=()=>onSelect(n.id);label.onmouseenter=()=>{hovered=n.id;style();onHover(n,label.getBoundingClientRect().x,label.getBoundingClientRect().y-12)};label.onmouseleave=()=>{hovered=null;style();onHover(null)};label.onfocus=()=>{hovered=n.id;style()};label.onblur=()=>{hovered=null;style()};labels.append(label);
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');labels.querySelector('svg').append(leader);return {n,p,mesh,halo,label,leader,visible:true};
 }
 function createEdge(e,points,index){
  const a=points.get(e.from),b=points.get(e.to);if(!a||!b)return null;
  const midpoint=a.clone().lerp(b,.5);midpoint.y+=e.kind==='geography'?5:6+unit(e.from+e.to)*10;midpoint.z+=(unit(e.to)-.5)*10;
  const curve=new THREE.QuadraticBezierCurve3(a,midpoint,b);const color=e.kind==='data'?TYPES.data.color:e.kind==='support'?TYPES[graph.nodes.find(n=>n.id===e.to).type].color:e.kind==='location'?'#69b7b3':TYPES.topic.color;
  const dashed=e.kind==='support'||e.kind==='data';const mat=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity:.26,dashSize:.8,gapSize:.65,depthWrite:false,blending:THREE.AdditiveBlending}):new THREE.LineBasicMaterial({color,transparent:true,opacity:.23,depthWrite:false,blending:THREE.AdditiveBlending});mat.toneMapped=false;
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)),mat);if(dashed)line.computeLineDistances();network.add(line);
  const particle=glow(a,color,e.kind==='support'?3:4.6,.85),trail=glow(a,color,2.4,.6);
  let beam=null;if(e.kind==='support'||(e.kind==='data'&&e.recommendation?.core)){beam=new THREE.Mesh(new THREE.TubeGeometry(curve,36,.14,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));beam.visible=false;network.add(beam);}
  return {e,curve,line,beam,particle,trail,phase:unit('edge'+index),visible:true};
 }
 function rebuild(next){
  graph=next;selected=null;hovered=null;dispose(network);glows=[];glowBatch=null;labels.replaceChildren();const leaderSVG=document.createElementNS('http://www.w3.org/2000/svg','svg');leaderSVG.classList.add('label-leaders');labels.append(leaderSVG);pickObjects=[];renderNodes=[];renderEdges=[];
  const model=drawMap(graph.region),points=layout(model);
  for(const n of graph.nodes){const p=points.get(n.id);if(p)renderNodes.push(createNode(n,p));}
  graph.edges.forEach((e,i)=>{const item=createEdge(e,points,i);if(item)renderEdges.push(item)});createGlowBatch();style();reset(false);measureLabels();updateLabels();
 }
 function allowed(n){return layers[n.type]!==false;}
 function style(){
  const key=selected,keyNode=graph?.nodes.find(n=>n.id===key),focusKey=contextTopic&&(keyNode?.type==='data'||(supportMode&&['central','local'].includes(keyNode?.type)))?'t:'+contextTopic:key;neighbors=new Set(key?[key]:[]);
  for(const e of graph?.edges||[])if(e.from===key||e.to===key){neighbors.add(e.from);neighbors.add(e.to)}
  focusSet=new Set(neighbors);
  if((keyNode?.type==='topic'||(contextTopic&&(keyNode?.type==='data'||(supportMode&&['central','local'].includes(keyNode?.type)))))&&!expandedLabels){
   focusSet=new Set([key,focusKey]);const supportCounts=new Map();
   for(const e of graph.edges){
    if(e.to===focusKey&&['geography','location'].includes(e.kind))focusSet.add(e.from);
    if(e.from===focusKey&&e.kind==='data'&&(e.recommendation?.core||(!supportMode&&bundleData.has(e.to.slice(2))))&&(!supportMode||e.recommendation.rank<=2))focusSet.add(e.to);
    if(e.from===focusKey&&e.kind==='support'){const p=graph.nodes.find(n=>n.id===e.to)?.ref,level=p?.level,count=supportCounts.get(level)||0;if((!supportMode||!supportRole||p?.supportProfile?.roleIds.includes(supportRole))&&count<(supportMode?2:1)){supportCounts.set(level,count+1);focusSet.add(e.to);}}
   }
  }else if(keyNode&&['data','central','local','city'].includes(keyNode.type)){
   for(const e of graph.edges)if(neighbors.has(e.from)||neighbors.has(e.to)){focusSet.add(e.from);focusSet.add(e.to)}
  }
  for(const r of renderNodes){
   const active=!key||focusSet.has(r.n.id),anchor=['region','city','topic'].includes(r.n.type);
   const shown=expandedLabels||key?(!key||focusSet.has(r.n.id)):anchor;
   r.visible=allowed(r.n)&&shown;r.mesh.visible=r.halo.visible=r.visible;
   const coreEdge=graph.edges.find(e=>e.to===r.n.id&&e.from===focusKey&&e.kind==='data'&&e.recommendation?.core);
   r.rank=coreEdge?.recommendation.rank||0;
   r.mesh.material.opacity=key?(active?1:.09):(r.n.type==='region'||graph.region?1:.30);
   r.mesh.material.emissiveIntensity=r.n.id===key?1.6:r.rank?1.1:.55;
   r.halo.material.opacity=r.n.id===key?.65:r.rank?.48:key?(active?.23:.01):anchor?.14:.05;
   r.mesh.scale.setScalar(r.n.id===key?1.6:r.rank?1.32:r.n.id===hovered?1.15:1);
   r.label.classList.toggle('selected',r.n.id===selected);r.label.classList.toggle('dimmed',!active);r.label.classList.toggle('core',!!r.rank);r.label.style.opacity='1';
   const picked=r.n.type==='data'&&bundleData.has(r.n.ref.id);r.label.classList.toggle('in-bundle',picked);const badge=r.label.querySelector('.data-rank');if(badge)badge.textContent=picked?'담음':r.rank?String(r.rank).padStart(2,'0'):'';
  }
  const nodeMap=new Map(renderNodes.map(n=>[n.n.id,n]));
  for(const [i,r] of renderEdges.entries()){
   const active=!key||(focusSet.has(r.e.from)&&focusSet.has(r.e.to)),direct=r.e.from===key||r.e.to===key||(supportMode&&r.e.from===focusKey&&r.e.kind==='support'&&focusSet.has(r.e.to));
   r.visible=!!nodeMap.get(r.e.from)?.visible&&!!nodeMap.get(r.e.to)?.visible;r.line.visible=r.visible;
   r.line.material.opacity=key?(direct?.70:active?.16:.01):(expandedLabels?.16:graph.region?.16:.045);
   if(r.beam){r.beam.visible=r.visible&&direct&&(r.e.kind!=='support'||supportMode);r.beam.material.opacity=.35;}
   r.particle.visible=r.visible&&motion&&active&&(key?direct:expandedLabels||i%22===0);r.trail.visible=r.particle.visible&&!!key;r.particle.material.opacity=direct?.85:.3;
  }
  for(const mesh of mapObjects){const cities=renderNodes.filter(n=>n.n.type==='city'&&focusSet.has(n.n.id));const on=hovered==='r:'+mesh.userData.mapRegion||cities.some(n=>n.n.ref.codes.includes(mesh.userData.code));mesh.material.color.copy(mesh.userData.base);if(on)mesh.material.color.lerp(new THREE.Color('#347e78'),.65);}
  lastLabel=0;
 }
 function measureLabels(){
  const hidden=renderNodes.map(r=>r.label.hidden);
  for(const r of renderNodes){r.label.hidden=false;r.label.style.visibility='hidden';}
  for(const r of renderNodes){const rect=r.label.getBoundingClientRect();r.metrics={width:rect.width,height:rect.height};}
  renderNodes.forEach((r,i)=>{r.label.hidden=hidden[i];r.label.style.visibility='';});
 }
 function reset(animate=true){const narrow=stage.clientWidth<650;const dest=!graph?.region?V(25,245,190):narrow?V(77,150,215):V(108,156,223),target=V(0,22,0);camera.zoom=graph?.region?1:.90;camera.updateProjectionMatrix();if(animate&&!reduced)transition={start:performance.now(),from:camera.position.clone(),to:dest,target:controls.target.clone(),end:target};else{camera.position.copy(dest);controls.target.copy(target);controls.update();transition=null}}
 function resize(){
  const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);composer.setSize(w,h);
  const aspect=w/h,span=aspect<.8?205/aspect:218;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
  if(detailOpen&&!document.body.classList.contains('story-mode')){const drawer=document.querySelector('#inspector').getBoundingClientRect();camera.setViewOffset(w,h,w>650?drawer.width*.48:0,w>650?0:Math.max(30,(h-drawer.top)*.32),w,h);}else camera.clearViewOffset();
  camera.updateProjectionMatrix();measureLabels();updateLabels();
 }
 function updateLabels(){
  if(!graph)return;camera.updateMatrixWorld();const w=stage.clientWidth,h=stage.clientHeight,narrow=w<650,key=selected,rectangles=[];
  // Exclude the actual UI bounds, so labels never sit under controls or reading panels.
  const reserved=[...document.querySelectorAll('header,.intro,.navigation,.layers,.view-options,.insight,.scene-tools,footer,#inspector,#reopen-detail,#path-guide,.scope-note,#story-card,.workspace-modes')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>({x:r.x-8,y:r.y-6,w:r.width+16,h:r.height+12}));
  const prioritized=[...renderNodes].sort((a,b)=>priority(b)-priority(a));
  const quotas={region:16,city:key?3:4,topic:expandedLabels?12:10,data:narrow?3:5,central:narrow?1:3,local:narrow?2:4},used={};
  function priority(r){return r.n.id===key?100:supportMode&&['central','local'].includes(r.n.type)?96:r.rank?94-r.rank:r.n.type==='city'&&neighbors.has(r.n.id)?95:r.n.type==='region'?90:r.n.type==='topic'?80:neighbors.has(r.n.id)?70:20+(hash(r.n.id)%9)}
  for(const r of prioritized){
   const v=r.p.clone().add(V(0,r.n.type==='region'?1:2.2,0)).project(camera),origin={x:(v.x*.5+.5)*w,y:(-v.y*.5+.5)*h};
   const isKey=r.n.id===key,related=neighbors.has(r.n.id);
   let show=r.visible&&v.z<1&&v.z>-1;
   if(key)show=show&&focusSet.has(r.n.id);
   else if(!expandedLabels)show=show&&(graph.region?['region','topic','city'].includes(r.n.type):r.n.type==='region');
   if(!isKey&&(used[r.n.type]||0)>=(quotas[r.n.type]||4))show=false;
   const {width,height}=r.metrics||{width:140,height:38};
   const candidates=[[-width/2,-height-7],[15,4],[-width-15,4],[-width/2,22],[15,-height-25],[-width-15,-height-25],[-width/2,-height-52],[-width/2,52],[-width/2,-height-86],[35,43],[-width-35,43],[30,-height-78],[-width-30,-height-78],[-width/2,82],[65,0],[-width-65,0]];
   let placed=null;
   if(show)for(const [dx,dy] of candidates){
    const px=origin.x+dx,py=origin.y+dy;
    if(px<12||px+width>w-12||py<76||py+height>h-32)continue;
    if([...reserved,...rectangles].some(a=>px<a.x+a.w+5&&px+width+5>a.x&&py<a.y+a.h+5&&py+height+5>a.y))continue;
    placed={x:px,y:py,w:width,h:height};break;
   }
   show=show&&!!placed;r.label.hidden=!show;r.leader.style.display=show?'':'none';
   if(show){const {x,y}=placed;r.label.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;rectangles.push(placed);r.leader.setAttribute('x1',origin.x);r.leader.setAttribute('y1',origin.y+8);r.leader.setAttribute('x2',Math.max(x,Math.min(x+width,origin.x)));r.leader.setAttribute('y2',y+height/2);used[r.n.type]=(used[r.n.type]||0)+1;}
  }
 }
 const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
 function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickObjects.filter(o=>o.visible),false)[0]||raycaster.intersectObjects(mapObjects,false)[0];}
 renderer.domElement.addEventListener('pointerdown',e=>{dragStart=[e.clientX,e.clientY];transition=null;});
 renderer.domElement.addEventListener('pointerup',e=>{if(dragStart&&Math.hypot(e.clientX-dragStart[0],e.clientY-dragStart[1])<6){const result=hit(e);if(result?.object.userData.nodeId)onSelect(result.object.userData.nodeId);else if(result?.object.userData.mapRegion)onMapSelect(result.object.userData.mapRegion);else if(result?.object.userData.city){const city=renderNodes.find(n=>n.n.type==='city'&&n.n.ref.codes.includes(result.object.userData.code));if(city)onSelect(city.n.id)}}dragStart=null;});
 renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;const result=hit(e);const id=result?.object.userData.nodeId|| (result?.object.userData.mapRegion?'r:'+result.object.userData.mapRegion:null);if(id!==hovered){hovered=id;style();renderer.domElement.style.cursor=id?'pointer':'grab';}if(id)onHover(graph.nodes.find(n=>n.id===id),e.clientX,e.clientY);else onHover(null)});
 renderer.domElement.addEventListener('pointerleave',()=>{hovered=null;style();onHover(null)});
 function frame(now){raf=requestAnimationFrame(frame);const delta=Math.min(.06,(now-last)/1000||0);last=now;if(motion)elapsed+=delta;const time=manualTime??elapsed;
  if(transition){const t=Math.min(1,(now-transition.start)/900),e=t*t*(3-2*t);camera.position.copy(transition.from).lerp(transition.to,e);controls.target.copy(transition.target).lerp(transition.end,e);if(t===1)transition=null}
  controls.update();
  for(const r of renderEdges)if(r.particle.visible){const rank=r.e.recommendation?.rank||0;const reveal=Math.max(0,Math.min(1,(elapsed-focusStarted-rank*.18)/.45));const t=(time*.16+r.phase)%1;r.particle.position.copy(r.curve.getPoint(t));r.trail.position.copy(r.curve.getPoint((t+.975)%1));if(r.beam&&selected){r.beam.material.opacity=.40*reveal;r.particle.material.opacity=.85*reveal;r.trail.material.opacity=.6*reveal;}}
  if(motion)for(const r of renderNodes)if(r.n.type==='topic'||r.n.type==='local'){r.mesh.rotation.y=time*.17+unit(r.n.id);r.mesh.rotation.z=Math.sin(time*.35+unit(r.n.id)*6)*.12;}
  updateGlows();if(now-lastLabel>60){updateLabels();lastLabel=now;}renderer.info.reset();composer.render();
 }
 new ResizeObserver(resize).observe(stage);resize();reset(false);raf=capture?0:requestAnimationFrame(frame);
 return {rebuild,setBundle:ids=>{const next=new Set(ids);if(next.size===bundleData.size&&[...next].every(id=>bundleData.has(id)))return;bundleData=next;style();measureLabels();updateLabels()},setFocus:(id,topic)=>{selected=id;contextTopic=topic||null;focusStarted=elapsed;style();measureLabels();updateLabels()},setSupportView:(value,role='')=>{supportMode=value;supportRole=role;style();measureLabels();updateLabels()},setLabelMode:value=>{expandedLabels=value;style();measureLabels();updateLabels()},setLayers:next=>{layers=next;style();updateLabels()},setMotion:value=>{motion=value;style()},setDetailOpen:value=>{detailOpen=value;resize();updateLabels()},setOrbit:value=>{controls.autoRotate=value},reset,zoom:factor=>{camera.zoom=Math.max(.55,Math.min(2.6,camera.zoom*factor));camera.updateProjectionMatrix();updateLabels()},seek:time=>{manualTime=time;const angle=.44+time*.014;camera.position.set(Math.sin(angle)*245,156,Math.cos(angle)*245);controls.target.set(0,22,0);controls.update();for(const r of renderEdges){const t=(time*.10+r.phase)%1;r.particle.position.copy(r.curve.getPoint(t));r.trail.position.copy(r.curve.getPoint((t+.975)%1));}for(const r of renderNodes)if(r.n.type==='topic'||r.n.type==='local'){r.mesh.rotation.y=time*.17+unit(r.n.id);r.mesh.rotation.z=Math.sin(time*.35+unit(r.n.id)*6)*.12;}updateGlows();updateLabels();renderer.info.reset();composer.render()},releaseSeek:()=>{manualTime=null},stats:()=>({webgl:true,nodes:renderNodes.length,edges:renderEdges.length,mapMeshes:mapObjects.length,visibleNodes:renderNodes.filter(n=>n.visible).length,visibleLabels:renderNodes.filter(n=>!n.label.hidden).length,expandedLabels,supportMode,supportRole,bundleData:[...bundleData],visibleData:renderNodes.filter(n=>n.visible&&n.n.type==='data').map(n=>n.n.ref.id),visibleSupports:renderNodes.filter(n=>n.visible&&['central','local'].includes(n.n.type)).map(n=>({id:n.n.id,level:n.n.ref.level,roles:n.n.ref.supportProfile?.roleIds||[],kind:n.n.ref.kind})),coreData:renderNodes.filter(n=>n.rank&&n.visible).map(n=>n.n.id),animatedPaths:renderEdges.filter(e=>e.particle.visible).length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,region:graph?.region,types:Object.fromEntries(Object.keys(TYPES).map(t=>[t,renderNodes.filter(n=>n.n.type===t).length])),mapVisible:map.visible}),destroy:()=>{cancelAnimationFrame(raf);controls.dispose();dispose(network);dispose(map);dispose(atmosphere);texture.dispose();composer.dispose();renderer.dispose()}};
}
