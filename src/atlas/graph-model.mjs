import {orderedRecommendations} from './content-guide.mjs';
import {createSupportModel,selectDiverse} from './support-model.mjs';
export const TYPES={region:{label:'지역',color:'#99d9c5'},city:{label:'시·군 위치',color:'#70acb0'},topic:{label:'규제특례 주제',color:'#edc58d'},data:{label:'공공데이터 목록',color:'#8bbaff'},central:{label:'중앙정부 지원 후보',color:'#b9a1ef'},local:{label:'지방정부 지원 후보',color:'#79dfbe'}};
export const levelLabel=level=>({central:'중앙정부',sido:'광역정부',gicho:'기초정부'}[level]||'소관 확인');
export const regionLinks=(zone,region)=>zone.links.filter(l=>!region||!l.regions||l.regions.includes(region));
export const topicRecommendations=(topic,region)=>topic.recommendations.filter(r=>!region||!r.regions||r.regions.includes(region));
const compact=s=>(s||'').replace(/\s+/g,'');
export function createModel(atlas,policy,municipal={features:[]}){
 const themes=new Map(atlas.themes.map(t=>[t.id,t])),datasets=new Map(atlas.datasets.map(d=>[d.id,d]));
 const support=createSupportModel(policy.programs,name=>atlas.regionAliases[name]||name),programs=support.programs;
 const normalizeRegion=name=>atlas.regionAliases[name]||name;
 const zonesFor=(region,topic)=>atlas.zones.filter(z=>(!region||z.regions.includes(region))&&regionLinks(z,region).some(l=>!topic||l.topic===topic));
 const themesFor=region=>atlas.themes.filter(t=>zonesFor(region,t.id).length);
 const match=support.match;
 const candidates=(region,topic)=>support.candidates(topic,region).map(row=>row.program);
 function selectSupports(region,ts){
  const chosen=new Map();
  const choose=(p,topic)=>{const selected=chosen.get(p.id)||{...p,selectedTopics:[]};if(topic&&!selected.selectedTopics.includes(topic))selected.selectedTopics.push(topic);chosen.set(p.id,selected)};
  for(const t of ts){
   for(const level of ['central','sido','gicho']){
    const pool=support.candidates(t,region,{level});
    for(const row of selectDiverse(pool,level==='gicho'?1:2))choose(row.program,t.id);
   }
  }
  if(region){
   for(const level of ['sido','gicho'])for(const p of support.list.filter(p=>p.region===region&&p.level===level&&p.kind==='annual'&&p.general).slice(0,2))choose(p,null);

  }
  const seen=new Set();
  return [...chosen.values()].filter(p=>{const key=compact(p.title)+p.agency;if(seen.has(key))return false;seen.add(key);return true}).slice(0,region?25:32);
 }
 function build(region,extraProgram){
  region=normalizeRegion(region);const ts=themesFor(region),nodes=[],edges=[];
  const add=n=>{if(!nodes.some(x=>x.id===n.id))nodes.push(n)};
  const edge=(from,to,kind,why,extra={})=>{if(from!==to&&!edges.some(e=>e.from===from&&e.to===to))edges.push({from,to,kind,why,...extra})};
  const rr=region?atlas.regions.filter(r=>r.name===region):atlas.regions;
  for(const r of rr)add({id:'r:'+r.name,type:'region',label:r.name,ref:r});
  for(const t of ts){
   add({id:'t:'+t.id,type:'topic',label:t.short,ref:t});
   for(const r of rr){if(zonesFor(r.name,t.id).length)edge('r:'+r.name,'t:'+t.id,'geography','해당 지역의 고시·사업개요에서 대응한 특례 주제')}
   for(const rec of orderedRecommendations(t,region)){
    const d=datasets.get(rec.id);if(!d)continue;
    add({id:'d:'+d.id,type:'data',label:d.short,ref:d});edge('t:'+t.id,'d:'+d.id,'data',rec.why,{recommendation:rec});
   }
  }
  if(region){
   const locations=atlas.locations.filter(l=>l.region===region&&l.topics.some(id=>ts.some(t=>t.id===id)));
   for(const city of new Set(locations.map(l=>l.municipality))){
    const locs=locations.filter(l=>l.municipality===city);const id='c:'+city;
    add({id,type:'city',label:city,ref:{name:city,locations:locs,codes:[...new Set(locs.flatMap(l=>l.codes))]}});
    for(const tid of new Set(locs.flatMap(l=>l.topics)))if(ts.some(t=>t.id===tid))edge(id,'t:'+tid,'location',locs.some(l=>l.topics.includes(tid)&&l.precision==='official-municipality')?'공식 자료의 시·군 위치 · 점은 시·군 대표 위치':'특구명에서 시·군 대응 · 정확한 실증 위치 미확인');
   }
  }
  const supports=selectSupports(region,ts);
  for(const id of (Array.isArray(extraProgram)?extraProgram:extraProgram?[extraProgram]:[])){
   if(!programs.has(id))continue;let p=supports.find(p=>p.id===id);if(!p){p={...programs.get(id),selectedTopics:[]};supports.push(p);}
   p.selectedTopics=[...new Set([...(p.selectedTopics||[]),...ts.filter(t=>match(p,t)&&match(p,t).kind!=='adjacent').map(t=>t.id)])];
  }
  for(const p of supports){
   const pid='p:'+p.id;add({id:pid,type:p.level==='central'?'central':'local',label:p.title,ref:p});
   const targets=ts.filter(t=>match(p,t)?.kind==='sector'||p.selectedTopics?.includes(t.id));
   for(const t of targets){const m=match(p,t);if(m&&m.kind!=='adjacent')edge('t:'+t.id,pid,'support',m.why,{match:m});}
   if(p.region&&rr.some(r=>r.name===p.region))edge('r:'+p.region,pid,'government',`${levelLabel(p.level)} 소관 · ${p.agency}`);
   if(region&&p.level==='gicho'&&p.district){
    const codes=atlas.regions.find(r=>r.name===region).codes;
    const fs=municipal.features.filter(f=>codes.includes(f.properties.code.slice(0,2))&&(f.properties.name===p.district||f.properties.name.startsWith(p.district)));
    if(fs.length){const cityId='c:'+p.district;add({id:cityId,type:'city',label:p.district,ref:{name:p.district,locations:[],codes:fs.map(f=>f.properties.code)}});edge(cityId,pid,'jurisdiction',`${p.district} 소관 지원사업 · 점은 행정구역 대표 위치이며 실증 장소가 아님`);}
   }
  }
  return {region,nodes,edges,topics:ts,supports,available:policy.programs.filter(p=>!region||!p.region||p.region===region).length};
 }
 return {themes,datasets,programs,support,normalizeRegion,zonesFor,themesFor,match,candidates,build};
}
