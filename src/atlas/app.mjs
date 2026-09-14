import {createModel,TYPES,levelLabel,topicRecommendations,regionLinks} from './graph-model.mjs';
import {createSwarmScene} from './swarm-scene.mjs';
import {orderedRecommendations} from './content-guide.mjs';
import {topicContent,datasetContent,storyContent} from './content-view.mjs';
import {SUPPORT_ROLES} from './support-model.mjs';
import {supportPanelContent,supportLanesContent,supportDetailProfile,comparisonContent} from './support-view.mjs';
import {createEnterpriseWorkspace} from './enterprise-workspace.mjs';
import {caseDetail,caseSearchItems,casesForRegion} from './cases-view.mjs';
const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?escape(u.href):'#'}catch{return '#'}};
const query=new URLSearchParams(location.search),film=query.has('film'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(film)document.body.classList.add('film');
async function load(path){const response=await fetch(path);if(!response.ok)throw new Error(`${path}: ${response.status}`);return response.json();}
try{
 const [D,P,GEO,MUNICIPAL,E,S]=await Promise.all(['assets/atlas-data.json','assets/policy-data.json','assets/korea-explore.geojson','assets/municipalities.geojson','assets/exemption-evidence.json','assets/sandbox-index.json'].map(load));
 let SD=null;const caseDetailData=async()=>{SD??=await load('assets/sandbox-detail.json');return SD;};
 await document.fonts.ready;
 const model=createModel(D,P,MUNICIPAL),state={region:null,topic:null,data:null,program:null,city:null,case:null,sb:null,story:query.has('share'),supportMode:query.get('mode')==='support',supportRole:SUPPORT_ROLES.some(r=>r.id===query.get('role'))?query.get('role'):'',supportKind:query.get('supportKind')==='budget'?'budget':'annual',motion:!reduced,auto:false,tour:false,expandedLabels:film};
 const comparison={active:false,topic:'food',regions:['전북','강원','경북'],needed:['capital','pilot','market'],keyword:''};
 let graph,scene,workspace,selectedId=null,detailOpen=false,tourFrame=0,lastTourPhase='';
 const layers={topic:true,data:true,central:true,local:true};
 for(const r of D.regions){const option=document.createElement('option');option.value=r.name;option.textContent=r.name;$('#region-select').append(option)}
 const kindLabel=p=>p.kind==='annual'?'연간 지원안내':'재정 예산사업';
 const sourceLink=(url,title)=>`<a href="${safeURL(url)}" target="_blank" rel="noopener">${escape(title)} ↗</a>`;
 const relatedButton=(id,label,sub='')=>`<button class="relation-link" data-select="${escape(id)}">${escape(label)} ↗${sub?`<small>${escape(sub)}</small>`:''}</button>`;
 const nodeById=id=>graph.nodes.find(n=>n.id===id);
 const interpretations={
  'farm-machines':'사고·안전과 농경지·기상 자료를 함께 보면 실증 설계에 필요한 검토 항목을 구체화할 수 있습니다. 농기계·스마트농업 관련 지원과 분야 공통 창업지원의 대상·업력·소재지 조건을 대조하는 것이 다음 단계입니다.',
  food:'시설 공유라는 제도적 여지에 제조·원료·식품안전 데이터를 연결하면 소규모 식품 창업의 준비 경로를 설계할 수 있습니다. 지역의 식품기업 육성과 중앙의 농식품 사업화를 함께 검토합니다.',
  clinical:'시험·실시기관·지역 의료자원을 연결하면 분산형 임상 운영의 협력 대상을 탐색할 수 있습니다. 바이오 창업지원이 임상 승인이나 환자 데이터 접근을 대신하지는 않습니다.',
  marine:'해양 관측·항로·기상 데이터를 실증 운영 검토에 사용하고 해양 분야 창업지원을 대조하는 경로입니다. 실해역 운항과 안전 판단에는 별도 실증 자료가 필요합니다.',
  'ev-charging':'충전기·주차·통행 데이터를 함께 살피면 충전 서비스의 입지 가설을 세울 수 있습니다. 모빌리티 지원사업과 지역의 운영 조건을 대조하되 충전기 소유자의 참여는 별도로 확인합니다.',
  'green-energy':'발전·전력·지역 에너지 정보를 결합해 실증 모델을 검토하는 경로입니다. 설비 계측자료와 거래 참여 조건은 공개 목록만으로 확정할 수 없습니다.'
 };
 function interpretation(t){const shared=D.regions.filter(r=>model.zonesFor(r.name,t.id).length).length;return interpretations[t.id]||`${shared}개 탐색 지역에서 대응된 주제입니다. ${t.combination}. 지역별 적용 대상과 지방정부의 지원 요건을 대조해야 실행 가능한 조합을 좁힐 수 있습니다.`;}
 function updateURL(replace=false){const p=new URLSearchParams(location.search);for(const key of ['region','topic','data','program','city','case','sb'])state[key]?p.set(key,state[key]):p.delete(key);state.story?p.set('share',''):p.delete('share');state.supportMode?p.set('mode','support'):p.delete('mode');state.supportRole?p.set('role',state.supportRole):p.delete('role');state.supportKind==='budget'?p.set('supportKind','budget'):p.delete('supportKind');if(comparison.active){p.set('compare',comparison.regions.join(','));p.set('compareTopic',comparison.topic);p.set('needs',comparison.needed.join(','));comparison.keyword?p.set('cq',comparison.keyword):p.delete('cq');}else{for(const k of ['compare','compareTopic','needs','cq'])p.delete(k);}const url=location.pathname+(p.size?'?'+p:'');if(url!==location.pathname+location.search)history[replace?'replaceState':'pushState'](null,'',url);}
 function clearSelection(){state.topic=state.data=state.program=state.city=state.case=state.sb=null;selectedId=null;setDetail(false);}
 function setDetail(open){detailOpen=open;if(!open){document.body.classList.remove('detail-expanded');document.querySelectorAll('.navigation,.layers,.view-options').forEach(el=>el.inert=false);$('#expand-detail').setAttribute('aria-expanded','false');$('#expand-detail').textContent='크게 읽기';}$('#inspector').hidden=!open;$('#reopen-detail').hidden=open||!selectedId;document.body.classList.toggle('detail-open',open);scene?.setDetailOpen(open);}
 function selectRegion(name,{noURL=false,instant=false}={}){
  cancelTour();const region=name?model.normalizeRegion(name):null;if(region&&!D.regions.some(r=>r.name===region))return;
  state.region=region;clearSelection();graph=model.build(region);scene?.rebuild(graph);scene?.setLayers(layers);if(instant)scene?.reset(false);$('#region-select').value=region||'';renderOverview();if(!noURL)updateURL();
 }
 function selectNode(id,{noURL=false}={}){
  cancelTour();let n=nodeById(id);if(!n)return;
  if(n.type==='region'){selectRegion(n.ref.name,{noURL});return;}
  const previousTopic=state.topic;state.topic=state.data=state.program=state.city=null;
  if(n.type==='topic')state.topic=n.ref.id;
  if(n.type==='data'){state.data=n.ref.id;state.topic=(graph.edges.find(e=>e.to===id&&e.from==='t:'+previousTopic&&e.kind==='data')||graph.edges.find(e=>e.to===id&&e.kind==='data'))?.from.slice(2)||null;}
  if(['central','local'].includes(n.type)){state.program=n.ref.id;state.topic=previousTopic&&model.support.match(n.ref,model.themes.get(previousTopic))?previousTopic:graph.edges.find(e=>e.to===id&&e.kind==='support')?.from.slice(2)||null;}
  if(n.type==='city')state.city=n.ref.name;
  if(state.topic!==previousTopic)state.case=null;selectedId=id;if(layers[n.type]===false){layers[n.type]=true;syncLayers();}scene?.setFocus(id,state.topic);scene?.setSupportView(state.supportMode,state.supportRole);setDetail(true);renderOverview();renderDetail(n);if(n.type==='topic'&&state.supportMode)$('#tab-support')?.click();if(!noURL)updateURL();$('#live-status').textContent=`선택: ${TYPES[n.type].label}, ${n.label}. 연결 근거가 열렸습니다.`;
 }
 function selectTopic(id,options){if(!id){clearSelection();scene?.setFocus(null);renderOverview();updateURL();return}if(!nodeById('t:'+id)){const r=D.regions.find(r=>model.zonesFor(r.name,id).length);if(r)selectRegion(r.name,{noURL:true});}selectNode('t:'+id,options);}
 function selectData(id,options){if(!nodeById('d:'+id)){const t=D.themes.find(t=>t.recommendations.some(r=>r.id===id)),r=t&&D.regions.find(r=>model.zonesFor(r.name,t.id).length);if(r)selectRegion(r.name,{noURL:true});}selectNode('d:'+id,options);}
 function selectProgram(id,options){const p=model.programs.get(id);if(!p)return;const topic=options?.topic||state.topic;if(p.region&&p.region!==state.region)selectRegion(p.region,{noURL:true});if(topic&&model.zonesFor(state.region,topic).length)state.topic=topic;if(!nodeById('p:'+id)){graph=model.build(state.region,id);scene?.rebuild(graph);scene?.setLayers(layers);}selectNode('p:'+id,options);}
 function renderOverview(){
  const r=state.region,t=model.themes.get(state.topic),n=nodeById(selectedId),counts=Object.fromEntries(Object.keys(layers).map(type=>[type,graph.nodes.filter(n=>n.type===type).length]));
  $('#view-kicker').textContent=r?`ATLAS · ${r}의 실증 준비`:'ATLAS · 창업기업을 위한 특례·데이터 탐색';
  $('#view-title').textContent=r?`${r}의 특례에, 필요한 데이터를.`:'내 실증에 맞는 특례와 데이터를 찾으세요.';
  $('#view-desc').textContent=r?'개별 특례의 조건을 확인하고, 쓸 자료를 내 묶음에 담으세요.':'지역 → 특례의 허용·조건 → 데이터 선택 → 사용 결과와 부족한 데이터';
  $('#metrics').innerHTML=`<span><strong>${r?graph.topics.length:D.themes.length}</strong>특례 주제</span><span><strong>${casesForRegion(S,r).length.toLocaleString()}</strong>승인과제${r?' 언급':''}</span><span><strong>${counts.data}</strong>연결 데이터</span><span><strong>${counts.central+counts.local}</strong>표시 사업</span>`;
  $('#scene-scale').textContent=r?`${r} / 시·군 대표 위치 · 2013 배경지도`:'대한민국 / 16개 탐색 지역';
  $('#graph-count').textContent=`${graph.nodes.length} NODES · ${graph.edges.length} LINKS`;
  for(const [type,count] of Object.entries(counts))$('#count-'+type).textContent=count;
  const topicSelect=$('#topic-select');topicSelect.disabled=!r||!graph.topics.length;
  topicSelect.innerHTML=`<option value="">${!r?'지역을 먼저 선택하세요':graph.topics.length?'주제 선택':'주제 자료 확인 중'}</option>`+graph.topics.map(topic=>`<option value="${topic.id}">${escape(topic.short)}</option>`).join('');
  topicSelect.value=state.topic||'';$('#clear-selection').hidden=!selectedId;
  document.body.classList.toggle('region-view',!!r);
  $('#stage-hint').textContent=r?'시·군 대표 위치 · 점 선택 / 드래그 회전':'주제 수는 특례 건수가 아닙니다 · 미수록 ≠ 특례 없음';
  $('#scope-note').textContent=t?'핵심 자료 우선 · 전체 자료는 상세의 자료 탭에서 확인':r?(graph.topics.length?'금색 ◆ 주제 → 개별 특례 설명 → 파란 ● 자료 목록':'주제 큐레이션 미수록 · 특례가 없다는 뜻이 아닙니다.'):'16개 탐색 지역 · 21개 편집 주제 · 86개 자료 목록';
  $('#path-guide').hidden=!t;$('#share-button').disabled=!t;$('#support-mode-button').disabled=!t;document.body.classList.toggle('support-mode',state.supportMode&&!!t);$('#support-mode-button').setAttribute('aria-pressed',String(state.supportMode));$('#data-mode-button').setAttribute('aria-pressed',String(!state.supportMode));
  if(!t&&state.story)setStory(false,false);
  if(t)renderPath(topicContent({atlas:D,evidence:E,model,graph,topic:t,region:r,caseId:state.case,cases:S}),t);
  if(t){
   const locations=D.locations.filter(l=>(!r||l.region===r)&&l.topics.includes(t.id)&&l.precision==='official-municipality');
   const place=[...new Set(locations.map(l=>l.municipality))].slice(0,3).join('·');
   $('#insight-kicker').textContent=`연결 해석 · 사업가설${place?' / '+place:''}`;
   $('#insight-title').textContent=t.output;
   $('#insight-text').textContent=interpretation(t);
  }else if(n&&['central','local'].includes(n.type)){
   $('#insight-kicker').textContent=`실행 수단 / ${levelLabel(n.ref.level)} · ${kindLabel(n.ref)}`;
   $('#insight-title').textContent=n.ref.title;
   $('#insight-text').textContent=n.ref.kind==='budget'?'지역이 어떤 창업활동에 예산을 편성했는지 살펴보는 자료입니다. 연결된 특례에 대한 지원 확정이나 기업당 지원금은 아닙니다.':n.ref.support+' · '+n.ref.availability;
  }else if(r){
   const special=graph.topics.filter(t=>D.locations.some(l=>l.region===r&&l.topics.includes(t.id)&&l.precision==='official-municipality')).map(t=>t.short).slice(0,2);
   $('#insight-kicker').textContent=`지역의 차이를 실행의 차이로 / ${r}`;
   $('#insight-title').textContent=special.length?`${special.join(' · ')}에서, 지역의 창업 경로를 찾아보세요.`:'이 지역의 제도와 창업지원은 어떻게 만날까요?';
   $('#insight-text').textContent=graph.topics.length?'같은 중앙 지원도 지역의 실증 장소·데이터·지방정부 사업과 조합하면 검토할 실행 경로가 달라집니다. 점을 선택하면 연결 이유와 남은 조건이 드러납니다.':'이 지역은 특례 주제 큐레이션을 추가 확인 중입니다. 검색에서 지역 지원사업을 먼저 살펴볼 수 있습니다.';
  }else{
   $('#insight-kicker').textContent='탐색에서 나의 실증 준비로';$('#insight-title').textContent='특례의 조건을 읽고, 쓸 데이터를 직접 골라보세요.';$('#insight-text').textContent='담은 자료와 사용 결과를 묶고, 부족한 항목은 수요 초안으로 남깁니다. 중앙·지역 지원과 지역 비교도 함께 탐색할 수 있습니다.';
  }
  workspace?.refresh();
 }
 function renderPath(content,t){
  $('#path-guide').hidden=!t||!content.current;
  if(state.supportMode){$('#path-guide').innerHTML=supportLanesContent(model,t,state.region,state.supportRole);bindSupportActions($('#path-guide'));}else $('#path-guide').innerHTML=`<div class="path-heading"><span>특례 → DATA → IDEA</span><b>먼저 볼 자료 ${content.core.length}</b></div><div class="path-items">${content.core.map(rec=>`<button data-path="d:${escape(rec.id)}"><span>${String(rec.rank).padStart(2,'0')} · ${escape(rec.group)}</span><b>${escape(model.datasets.get(rec.id).short)}</b></button>`).join('')}</div><p>${escape(content.current?.result||t.output)} <span>· 활용 가설</span></p>`;
  $('#path-guide').querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>selectData(b.dataset.path.slice(2)));
  if(!state.supportMode)$('#path-guide').insertAdjacentHTML('beforeend','<button class="bundle-action" data-open-workspace="data">이 특례의 데이터 묶음 만들기 <span>담은 자료 <b data-bundle-count>0</b> →</span></button>');
  $('#story-card').innerHTML=storyContent(t,content,model,state.region);
 }
 function setStory(value,writeURL=true){
  state.story=!!value&&!!state.topic;document.body.classList.toggle('story-mode',state.story);
  $('#story-card').hidden=!state.story;$('#exit-story').hidden=!state.story;$('#share-button').setAttribute('aria-pressed',String(state.story));
  if(state.story){state.expandedLabels=false;$('#label-mode').setAttribute('aria-pressed','false');$('#label-mode').textContent='전체 연결 보기';scene?.setLabelMode(false);}
  scene?.setDetailOpen(detailOpen&&!state.story);if(writeURL)updateURL();
 }
 function renderDetail(n){
  state.sb=null;
  $('#detail-type').textContent=TYPES[n.type].label+' / '+(state.region||'전국 연결');
  let html=`<h2>${escape(n.label)}</h2>`;
  if(n.type==='topic'){
   const content=topicContent({atlas:D,evidence:E,model,graph,topic:n.ref,region:state.region,caseId:state.case,cases:S});
   state.case=content.current?.id||null;html=content.html;renderPath(content,n.ref);
  }
  if(n.type==='data'){
   const recs=graph.edges.filter(e=>e.to===n.id&&e.kind==='data'&&(!state.topic||e.from==='t:'+state.topic)).sort((a,b)=>(b.from==='t:'+state.topic)-(a.from==='t:'+state.topic));
   html=datasetContent(n.ref,recs,model);
  }
  if(['central','local'].includes(n.type)){
   const p=n.ref,edges=graph.edges.filter(e=>e.to===n.id&&e.kind==='support');
   html+=supportDetailProfile(p,state.topic?model.support.match(p,model.themes.get(state.topic)):null);
   html+=`<span class="tag">${levelLabel(p.level)}</span><span class="tag">${kindLabel(p)}</span><p class="meta">${escape(p.agency)}${p.region?' / '+escape(p.region):' / 전국 대상 여부는 세부 공고 확인'}${p.operator?'<br>수행기관: '+escape(p.operator):''}</p><p class="lead">${escape(p.summary)}</p><h3>지원 내용</h3><p>${escape(p.support)}</p><h3>대상과 확인할 조건</h3><p>${escape(p.target)}</p><p>${escape(p.availability)}</p><p class="meta">연간 계획 일정: ${escape(p.schedule||'개별 공고 확인')}<br>이 안내만으로 현재 접수 중이라고 판단하지 않습니다.</p>`;
   if(p.kind==='budget')html+=`<h3>2026년 재정 기록</h3><p class="lead">편성액 ${p.budget==null?'미수록':new Intl.NumberFormat('ko-KR').format(p.budget)+'원'}</p><p class="meta">사업 전체 예산입니다. 기업당 지원금·신청 가능 금액이 아니며 다른 사업과 합산하지 않습니다.</p>`;
   html+='<h3>특례와의 연결 이유</h3>'+(edges.length?edges.map(e=>`<p class="policy-statement">${escape(e.why)}</p>${relatedButton(e.from,nodeById(e.from).label)}`).join(''):'<p>이 사업과 대응되는 특례 주제는 아직 없습니다. 소관기관 자료로 검색한 항목입니다.</p>');
   html+=`<p class="meta">분야·지역을 통한 검토 후보입니다. 해당 특례에 대한 직접 지원, 중복 수혜, 참여 자격은 확인되지 않았습니다.</p><h3>근거 자료</h3>${sourceLink(p.url,p.sourceLabel)}<p class="meta">수록 기준 ${escape(p.sourceDate)} · 원천 식별자 ${escape(p.sourceId)}${p.kind==='budget'?'<br>재정 포털 원천 링크이며 개별 모집공고 링크가 아닙니다.':''}</p>`;
  }
  if(n.type==='city'){
   html+='<p class="meta">지도 위 점은 시·군 대표 위치입니다. 실제 시설 좌표나 특구 구역이 아닙니다.</p>';
   html+=n.ref.locations.map(l=>`<h3>${escape(l.label)}</h3><span class="tag">${l.precision==='official-municipality'?'공식 자료의 시·군 위치':'특구 명칭으로 시·군 대응'}</span><p>${escape(l.note||l.basis)}</p>${l.sources.map(s=>sourceLink(s.url,s.title)).join('<br>')}`).join('');
   html+='<h3>이 지역과 연결된 특례·사업</h3>'+graph.edges.filter(e=>e.from===n.id).map(e=>relatedButton(e.to,nodeById(e.to).label,e.why)).join('');
  }
  $('#detail-body').innerHTML=html;$('#detail-body').scrollTop=0;document.body.classList.remove('support-panel-active');
  if(n.type==='topic')$('#tab-panel-data')?.insertAdjacentHTML('afterbegin','<button class="bundle-action" data-open-workspace="data">쓸 자료를 골라 내 묶음에 담기 <span>선택·사용·수요 →</span></button>');
  if(n.type==='data'&&state.region&&state.topic)$('#detail-body h2')?.insertAdjacentHTML('afterend',`<button class="bundle-action" data-open-workspace="data" data-add-data="${escape(n.ref.id)}">이 자료를 내 묶음에 담기 <span>조건 대조 →</span></button>`);
  if(n.type==='topic'){renderSupportPanel();$('#tab-support').textContent='지원 '+model.support.candidates(n.ref,state.region,{kind:state.supportKind}).length;}
  $('#detail-body').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>selectNode(b.dataset.select));
  $('#detail-body').querySelectorAll('[data-sandbox]').forEach(b=>b.onclick=()=>openCase(b.dataset.sandbox));
  const picker=$('#case-select');if(picker)picker.onchange=()=>{state.case=picker.value;renderDetail(n);updateURL();};
  workspace?.refresh();
  const tabs=[...$('#detail-body').querySelectorAll('[data-tab]')];
  const activate=button=>{document.body.classList.toggle('support-panel-active',button.dataset.tab==='support');for(const tab of tabs){const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$('#tab-panel-'+tab.dataset.tab).hidden=!active;}$('#detail-body').scrollTop=0;};
  tabs.forEach((button,index)=>{button.onclick=()=>activate(button);button.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();activate(tabs[next]);tabs[next].focus();}}});
 }
 async function openCase(seq,{noURL=false}={}){
  const c=S.cases.find(c=>String(c.seq)===String(seq));if(!c)return;
  state.sb=String(seq);
  const topic=state.topic&&model.themes.get(state.topic);
  const back=topic?`<button class="bundle-action" data-back-topic>← ${escape(topic.short)} 주제로 돌아가기 <span>승인과제 목록</span></button>`:'';
  const render=detail=>{$('#detail-type').textContent='개별 특례 / '+(c.regions[0]||'전국·지역 미확인');$('#detail-body').innerHTML=back+caseDetail(c,S,detail,{themes:model.themes,region:state.region});$('#detail-body').scrollTop=0;$('#detail-body').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{state.sb=null;selectTopic(b.dataset.select.slice(2));});$('#detail-body').querySelector('[data-back-topic]')?.addEventListener('click',()=>{state.sb=null;const n=nodeById('t:'+state.topic);if(n){renderDetail(n);$('#tab-cases')?.click();}else clearSelection();updateURL();});};
  render(null);document.body.classList.remove('support-panel-active');setDetail(true);if(!noURL)updateURL();
  try{const all=await caseDetailData();if(state.sb===String(seq))render(all[String(seq)]||{});}catch{const p=$('#sb-conditions');if(p)p.textContent='조건 본문을 불러오지 못했습니다. 포털 링크에서 확인합니다.';}
 }
 function renderSupportPanel(){
  const t=model.themes.get(state.topic),panel=$('#tab-panel-support');if(!t||!panel)return;
  const openFilters=panel.querySelector('.support-filter-control')?.open,openMethod=panel.querySelector('.support-method')?.open;panel.innerHTML=supportPanelContent(model,t,state.region,{role:state.supportRole,kind:state.supportKind});if(openFilters)panel.querySelector('.support-filter-control').open=true;if(openMethod)panel.querySelector('.support-method').open=true;bindSupportActions(panel);
 }
 function refreshSupportScene(){
  const t=model.themes.get(state.topic);if(!t)return;
  const plan=model.support.composition(t,state.region,{needed:state.supportRole?[state.supportRole]:[]});
  const extras=Object.values(plan.levels).flat().map(r=>r.program.id);if(state.program)extras.push(state.program);
  graph=model.build(state.region,extras);scene?.rebuild(graph);scene?.setLayers(layers);scene?.setFocus(selectedId,state.topic);scene?.setSupportView(state.supportMode,state.supportRole);scene?.setDetailOpen(detailOpen);renderOverview();
 }
 function setSupportMode(value,write=true){
  state.supportMode=!!value;document.body.classList.toggle('support-mode',state.supportMode&&!!state.topic);
  $('#support-mode-button').setAttribute('aria-pressed',String(state.supportMode));$('#data-mode-button').setAttribute('aria-pressed',String(!state.supportMode));
  if(state.topic){refreshSupportScene();selectTopic(state.topic,{noURL:true});}
  if(write)updateURL();
 }
 function setSupportRole(role){
  if(role&&!SUPPORT_ROLES.some(r=>r.id===role))return;state.supportRole=role;
  refreshSupportScene();if(state.program){selectTopic(state.topic,{noURL:true});}renderSupportPanel();updateURL();
 }
 function bindSupportActions(root){
  root.querySelectorAll('[data-support-select]').forEach(b=>b.onclick=()=>selectProgram(b.dataset.supportSelect));
  root.querySelectorAll('[data-support-role],[data-lane-role]').forEach(b=>b.onclick=()=>{const role=b.dataset.supportRole??b.dataset.laneRole;setSupportRole(role);root.querySelector(`[data-support-role="${role}"],[data-lane-role="${role}"]`)?.focus({preventScroll:true});});
  root.querySelectorAll('[data-support-kind]').forEach(b=>b.onclick=()=>{state.supportKind=b.dataset.supportKind;renderSupportPanel();$('#tab-support').textContent='지원 '+model.support.candidates(model.themes.get(state.topic),state.region,{kind:state.supportKind}).length;updateURL();});
  root.querySelectorAll('[data-open-compare]').forEach(b=>b.onclick=()=>openComparison());
  root.querySelectorAll('[data-open-support]').forEach(b=>b.onclick=()=>{state.supportMode=true;selectTopic(state.topic);$('#tab-support')?.click();});
 }
 function initComparison(){
  $('#compare-topic').innerHTML=D.themes.map(t=>`<option value="${t.id}">${escape(t.short)}</option>`).join('');
  for(let i=1;i<=3;i++)$('#compare-region-'+i).innerHTML=(i===3?'<option value="">2개 지역만 비교</option>':'')+D.regions.map(r=>`<option value="${escape(r.name)}">${escape(r.name)}</option>`).join('');
  $('#compare-needs').insertAdjacentHTML('beforeend',SUPPORT_ROLES.map(r=>`<label><input type="checkbox" name="compare-need" value="${r.id}"><span>${escape(r.short)}</span></label>`).join(''));
  $('#compare-topic').onchange=()=>{comparison.topic=$('#compare-topic').value;renderComparison();updateURL();};
  for(let i=1;i<=3;i++)$('#compare-region-'+i).onchange=()=>{comparison.regions=[...new Set([1,2,3].map(i=>$('#compare-region-'+i).value).filter(Boolean))];renderComparison();updateURL();};
  $('#compare-needs').onchange=()=>{comparison.needed=[...document.querySelectorAll('[name="compare-need"]:checked')].map(e=>e.value);renderComparison();updateURL();};
  let searchTimer;$('#compare-keyword').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{comparison.keyword=$('#compare-keyword').value.trim();renderComparison();updateURL(true);},180);};
  $('#close-comparison').onclick=()=>closeComparison();
  $('#comparison').addEventListener('close',()=>{if(comparison.active){comparison.active=false;updateURL();}});
 }
 function syncComparisonControls(){
  $('#compare-topic').value=comparison.topic;$('#compare-keyword').value=comparison.keyword;
  [1,2,3].forEach(i=>$('#compare-region-'+i).value=comparison.regions[i-1]||'');
  for(const el of document.querySelectorAll('[name="compare-need"]'))el.checked=comparison.needed.includes(el.value);
 }
 function renderComparison(){
  const t=model.themes.get(comparison.topic);if(!t)return;
  $('#comparison-status').textContent=comparison.regions.length<2?'서로 다른 지역을 2곳 이상 선택하세요.':'같은 주제·필요 기능으로 비교합니다. 키워드는 원문에 포함된 단어로 좁힙니다.';
  if(comparison.regions.length<2){$('#comparison-body').innerHTML='';return;}
  $('#comparison-body').innerHTML=comparisonContent({atlas:D,evidence:E,model,topic:t,regions:comparison.regions,needed:comparison.needed,keyword:comparison.keyword});
  $('#comparison-body').querySelectorAll('[data-support-select]').forEach(b=>b.onclick=()=>{const topic=comparison.topic;closeComparison(false);selectProgram(b.dataset.supportSelect,{topic});});
  $('#comparison-body').querySelectorAll('[data-region-explore]').forEach(b=>b.onclick=()=>{const topic=comparison.topic,region=b.dataset.regionExplore;closeComparison(false);selectRegion(region,{noURL:true});if(model.zonesFor(region,topic).length)selectTopic(topic);else updateURL();});
 }
 function openComparison(write=true){
  cancelTour();if(write){comparison.topic=state.topic||comparison.topic;const defaults=[state.region||'전북',...comparison.regions,'강원','경북'];comparison.regions=[...new Set(defaults)].slice(0,3);if(state.supportRole)comparison.needed=[state.supportRole];}
  comparison.active=true;syncComparisonControls();renderComparison();if(!$('#comparison').open)$('#comparison').showModal();if(write)updateURL();
 }
 function closeComparison(write=true){comparison.active=false;$('#comparison').close();if(write)updateURL();}
 function restoreComparison(p){
  const regions=[...new Set((p.get('compare')||'').split(',').map(model.normalizeRegion).filter(r=>D.regions.some(x=>x.name===r)))].slice(0,3);
  if(regions.length>=2){comparison.regions=regions;comparison.topic=model.themes.has(p.get('compareTopic'))?p.get('compareTopic'):state.topic||'food';comparison.needed=(p.get('needs')||'').split(',').filter(id=>SUPPORT_ROLES.some(r=>r.id===id));comparison.keyword=(p.get('cq')||'').slice(0,80);openComparison(false);}else if($('#comparison').open)closeComparison(false);
 }
 initComparison();$('#support-mode-button').onclick=()=>setSupportMode(true);$('#data-mode-button').onclick=()=>setSupportMode(false);$('#compare-button').onclick=()=>openComparison();
 function syncLayers(){for(const b of document.querySelectorAll('[data-layer]'))b.setAttribute('aria-pressed',String(layers[b.dataset.layer]));scene?.setLayers(layers);}
 function hover(n,x,y){const el=$('#tooltip');el.hidden=!n;if(!n)return;el.innerHTML=`${escape(n.label)}<small>${escape(TYPES[n.type].label)}${n.type==='central'||n.type==='local'?' · '+escape(kindLabel(n.ref)):''} · 클릭해 연결 이유 보기</small>`;const rect=el.getBoundingClientRect();el.style.left=Math.min(innerWidth-rect.width-12,Math.max(12,x+16))+'px';el.style.top=Math.min(innerHeight-rect.height-12,Math.max(80,y+18))+'px';}
 try{scene=createSwarmScene({stage:$('#stage'),labels:$('#canvas-labels'),atlas:D,geo:GEO,municipal:MUNICIPAL,reduced,capture:query.has('capture'),onSelect:selectNode,onHover:hover,onMapSelect:selectRegion});$('#loading').remove();}
 catch(error){console.error(error);$('#loading').textContent='3D 화면을 열지 못했습니다. 지역 선택·검색으로 연결 자료를 확인할 수 있습니다.';$('#loading').className='error';}
 function restore(){const p=new URLSearchParams(location.search);state.supportMode=p.get('mode')==='support';state.supportRole=SUPPORT_ROLES.some(r=>r.id===p.get('role'))?p.get('role'):'';state.supportKind=p.get('supportKind')==='budget'?'budget':'annual';state.story=p.has('share');selectRegion(p.get('region'),{noURL:true,instant:true});if(p.get('program'))selectProgram(p.get('program'),{noURL:true,topic:p.get('topic')});else if(p.get('data')){state.topic=p.get('topic');selectData(p.get('data'),{noURL:true});}else if(p.get('topic'))selectTopic(p.get('topic'),{noURL:true});else if(p.get('city'))selectNode('c:'+p.get('city'),{noURL:true});if(p.get('case')&&state.topic){state.case=p.get('case');if(!state.data&&!state.program)renderDetail(nodeById('t:'+state.topic));}setStory(p.has('share'),false);if(state.supportMode&&state.topic){refreshSupportScene();if(!state.program&&!state.data)$('#tab-support')?.click();}if(p.get('sb'))openCase(p.get('sb'),{noURL:true});restoreComparison(p);updateURL(true);}
 $('#options-button').onclick=()=>{const open=document.body.classList.toggle('options-open');$('#options-button').setAttribute('aria-expanded',String(open));};
 $('#share-button').onclick=()=>setStory(!state.story);$('#exit-story').onclick=()=>setStory(false);
 $('#region-select').onchange=e=>selectRegion(e.target.value);
 $('#topic-select').onchange=e=>selectTopic(e.target.value||null);
 $('#clear-selection').onclick=()=>{selectTopic(null);$('#topic-select').focus()};
 $('#label-mode').onclick=()=>{state.expandedLabels=!state.expandedLabels;$('#label-mode').setAttribute('aria-pressed',String(state.expandedLabels));$('#label-mode').textContent=state.expandedLabels?'핵심 연결만 보기':'전체 연결 보기';scene?.setLabelMode(state.expandedLabels)};$('#home-button').onclick=()=>selectRegion(null);$('.brand').onclick=e=>{e.preventDefault();selectRegion(null)};
 $('#expand-detail').onclick=()=>{const expanded=document.body.classList.toggle('detail-expanded');document.querySelectorAll('.navigation,.layers,.view-options').forEach(el=>el.inert=expanded);$('#expand-detail').setAttribute('aria-expanded',String(expanded));$('#expand-detail').textContent=expanded?'지도와 함께':'크게 읽기';scene?.setDetailOpen(true)};
 $('#close-detail').onclick=()=>{setDetail(false);$('#reopen-detail').focus()};$('#reopen-detail').onclick=()=>setDetail(true);
 $('#reset-camera').onclick=()=>scene?.reset();$('#zoom-in').onclick=()=>scene?.zoom(1.2);$('#zoom-out').onclick=()=>scene?.zoom(1/1.2);
 $('#motion-button').setAttribute('aria-pressed',String(state.motion));$('#motion-button').onclick=()=>{state.motion=!state.motion;$('#motion-button').setAttribute('aria-pressed',String(state.motion));scene?.setMotion(state.motion)};
 $('#orbit-button').onclick=()=>{cancelTour();state.auto=!state.auto;$('#orbit-button').setAttribute('aria-pressed',String(state.auto));scene?.setOrbit(state.auto)};
 for(const b of document.querySelectorAll('[data-layer]'))b.onclick=()=>{layers[b.dataset.layer]=!layers[b.dataset.layer];syncLayers()};
 $('#sources-button').onclick=()=>$('#sources').showModal();$('#close-sources').onclick=()=>$('#sources').close();$('#sources').onclick=e=>{if(e.target===$('#sources')&&e.clientX<$('#sources').getBoundingClientRect().left)$('#sources').close()};
 const searchItems=[...D.regions.map(r=>({id:'r:'+r.name,type:'region',label:r.name,search:r.name+' '+(r.name==='광주·전남'?'광주 전남 전남광주':''),sub:'지역의 전체 연결망'})),...D.themes.map(t=>({id:'t:'+t.id,type:'topic',label:t.short,search:t.title+' '+t.short+' '+t.trigger,sub:'특례 주제 · 지역별 적용 조건 확인'})),...D.datasets.map(d=>({id:'d:'+d.id,type:'data',label:d.title,search:d.title+' '+d.short+' '+d.provider,sub:d.provider+' · '+d.kind})),...P.programs.map(p=>({id:'p:'+p.id,type:p.level==='central'?'central':'local',label:p.title,search:p.title+' '+p.agency+' '+(p.region||(p.level==='central'?'중앙 전국':'지역 미확인'))+' '+levelLabel(p.level),sub:[p.region||(p.level==='central'?'중앙':'지역 미확인'),p.agency,kindLabel(p)].join(' · ')})),...caseSearchItems(S)];
 $('#search').addEventListener('input',()=>{const raw=$('#search').value.trim(),el=$('#search-results');el.hidden=!raw;if(!raw)return;const terms=raw.toLowerCase().split(/\s+/),found=searchItems.filter(x=>terms.every(q=>x.search.replace(/\s+/g,'').toLowerCase().includes(q.replace(/\s+/g,''))));el.innerHTML=`<p>${found.length.toLocaleString()}개 결과${found.length>40?' · 처음 40개 표시, 지역·사업명으로 좁혀보세요':''}</p>`+found.slice(0,40).map(x=>`<button data-result="${escape(x.id)}"><i class="key ${x.type}"></i><span>${escape(x.label)}<small>${escape(x.sub)}</small></span></button>`).join('');el.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{const id=b.dataset.result;el.hidden=true;$('#search').value='';if(id.startsWith('r:'))selectRegion(id.slice(2));if(id.startsWith('t:'))selectTopic(id.slice(2));if(id.startsWith('d:'))selectData(id.slice(2));if(id.startsWith('p:'))selectProgram(id.slice(2));if(id.startsWith('s:'))openCase(id.slice(2));});});
 $('#search').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();$('#search-results button')?.focus()}if(e.key==='Escape'){e.stopPropagation();$('#search-results').hidden=true;}};
 document.addEventListener('keydown',e=>{if(document.querySelector('#enterprise-workspace[open]'))return;if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus()}if(e.key==='Escape'){if($('#sources').open||$('#comparison').open)return;$('#search-results').hidden=true;if(detailOpen){setDetail(false);$('#reopen-detail').focus()}else if(selectedId){clearSelection();scene?.setFocus(null);renderOverview();updateURL();}}});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.navigation'))$('#search-results').hidden=true;});
 function cancelTour(){if(!state.tour)return;state.tour=false;cancelAnimationFrame(tourFrame);$('#tour-button').innerHTML='▶ <span>둘러보기</span>';scene?.releaseSeek();}
 function seek(seconds){
  const phase=seconds<3?'national':seconds<7?'regional':seconds<11?'topic':seconds<13?'support':'return';
  if(phase!==lastTourPhase){const touring=state.tour;state.tour=false;if(phase==='national'||phase==='return')selectRegion(null,{noURL:true,instant:true});if(phase==='regional')selectRegion('강원',{noURL:true,instant:true});if(phase==='topic'){if(state.region!=='강원')selectRegion('강원',{noURL:true,instant:true});selectTopic('clinical',{noURL:true})}if(phase==='support'){const edge=graph.edges.find(e=>e.from==='t:clinical'&&e.kind==='support');if(edge)selectNode(edge.to,{noURL:true});}setDetail(false);state.tour=touring;lastTourPhase=phase;}
  scene?.seek(seconds);
 }
 $('#tour-button').onclick=()=>{if(state.tour){cancelTour();updateURL();return}lastTourPhase='';state.tour=true;$('#tour-button').innerHTML='Ⅱ <span>멈추기</span>';const start=performance.now();const tick=now=>{if(!state.tour)return;const t=(now-start)/1000;seek(t);if(t>=16){cancelTour();updateURL();return}tourFrame=requestAnimationFrame(tick)};tourFrame=requestAnimationFrame(tick);};
 workspace=createEnterpriseWorkspace({atlas:D,evidence:E,model,state,onOpen:()=>{cancelTour();if(state.story)setStory(false);},onChange:ids=>scene?.setBundle(ids),onNavigate:r=>{selectRegion(r.region,{noURL:true});selectTopic(r.topic,{noURL:true});state.case=r.caseId;renderDetail(nodeById('t:'+r.topic));updateURL();}});
 window.addEventListener('popstate',restore);restore();workspace.refresh();
 window.atlas={ready:true,webgl:!!scene,seek,selectRegion,selectTopic,selectData,selectProgram,state,getStats:()=>scene?.stats()||{webgl:false},getGraph:()=>({region:graph.region,nodes:graph.nodes.map(n=>({id:n.id,type:n.type,label:n.label})),edges:graph.edges.map(e=>({from:e.from,to:e.to,kind:e.kind,why:e.why}))}),catalogueCounts:{datasets:D.datasets.length,programs:P.programs.length,annual:P.programs.filter(p=>p.kind==='annual').length,budget:P.programs.filter(p=>p.kind==='budget').length}};
}catch(error){console.error(error);$('#loading').textContent='자료를 불러오지 못했습니다. 서버 연결을 확인하고 새로고침해주세요.';}
