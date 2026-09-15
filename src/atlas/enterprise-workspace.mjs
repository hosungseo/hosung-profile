import {regulationCards,orderedRecommendations,dataBrief} from './content-guide.mjs';
import {STORAGE_KEY,USAGE,AVAILABILITY,workspaceKey,emptyDraft,cleanDraft,hasNeed,validateDraft,exportDraft,requestSummary,REQUEST_URL} from './workspace-model.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?esc(u.href):'#'}catch{return '#'}};
const SAVE_FAIL='이 브라우저에 저장할 수 없습니다. 내려받기로 보관하세요.',rescueButton='<button class="workspace-secondary workspace-rescue" id="workspace-save-rescue" data-action="export">지금 내려받기 ↓</button>';
const options=(items,value)=>Object.entries(items).map(([k,v])=>`<option value="${k}" ${value===k?'selected':''}>${esc(v)}</option>`).join('');
export function createEnterpriseWorkspace({atlas,evidence,model,state,onChange,onNavigate,onOpen}){
 let step='data',active=null,memory=Object.create(null),storageProblem='',returnFocus=null;
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.version!==1||!parsed.records||typeof parsed.records!=='object'||Array.isArray(parsed.records))throw new Error();memory=parsed.records;}}
 catch{storageProblem=SAVE_FAIL;}
 const dialog=document.createElement('dialog');dialog.id='enterprise-workspace';dialog.setAttribute('aria-labelledby','workspace-title');document.body.append(dialog);
 const getContext=()=>{
  const topic=model.themes.get(state.topic);if(!state.region||!topic)return null;
  const cards=regulationCards(atlas,evidence,topic,state.region),current=cards.find(c=>c.id===state.case)||cards[0];
  return current?{region:state.region,topic,current,recs:orderedRecommendations(topic,state.region)}:null;
 };
 function getDraft(context){const rec=memory[workspaceKey(context)];return cleanDraft(rec?.draft,new Set(context.recs.map(r=>r.id)));}
 function write(){
  if(!active)return;
  active.draft.updatedAt=new Date().toISOString();
  const c=active.context,key=workspaceKey(c),record={region:c.region,topic:c.topic.id,caseId:c.current.id,label:c.region+' · '+c.current.title,draft:active.draft};
  memory[key]=record;
  if(!storageProblem)try{
   const latest=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":1,"records":{}}');
   if(latest.version!==1||!latest.records||typeof latest.records!=='object'||Array.isArray(latest.records))throw new Error();
   memory={...latest.records,[key]:record};localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,records:memory}));
  }catch{storageProblem=SAVE_FAIL;}
  const status=dialog.querySelector('#workspace-save-status');if(status){status.textContent=storageProblem||'이 브라우저에 저장됨 · 기관 미제출';status.classList.toggle('storage-error',!!storageProblem);if(storageProblem&&!dialog.querySelector('#workspace-save-rescue'))status.insertAdjacentHTML('afterend',rescueButton);}
  refresh();
 }
 function refresh(){
  const c=getContext(),d=c?getDraft(c):emptyDraft();
  const button=document.querySelector('#workspace-button');if(button)button.textContent='내 데이터 묶음'+(c?' '+d.selected.length:'');
  for(const el of document.querySelectorAll('[data-bundle-count]'))el.textContent=String(d.selected.length);
  onChange?.(d.selected,c);
 }
 function renderSaved(){
  const rows=Object.entries(memory).filter(([,r])=>r&&typeof r.region==='string'&&model.themes.has(r.topic)&&atlas.regions.some(a=>a.name===r.region)&&regulationCards(atlas,evidence,model.themes.get(r.topic),r.region).some(c=>c.id===r.caseId));
  if(!rows.length)return '';
  return `<label class="workspace-saved">저장한 특례별 묶음<select id="workspace-record-select"><option value="">다른 묶음 열기 (${rows.length})</option>${rows.map(([k,r])=>`<option value="${esc(k)}">${esc(r.label)}</option>`).join('')}</select></label>`;
 }
 function dataPanel(c,d){
  return `<div class="workspace-section-heading"><div><h3>이 실증에 쓸 자료를 골라보세요</h3><p>추천은 주제 기준입니다. 선택한 개별 특례의 조건과 직접 대조하세요.</p></div><button class="workspace-secondary" data-action="add-core">핵심 자료 한 번에 담기</button></div>
   <div class="workspace-data-list">${c.recs.map(r=>{const data=model.datasets.get(r.id),b=dataBrief(data,r),checked=d.selected.includes(r.id);return `<article class="workspace-data-card ${checked?'is-picked':''}"><div class="workspace-data-top"><label><input type="checkbox" data-pick="${esc(r.id)}" ${checked?'checked':''}><span><small>${r.core?'먼저 볼 자료':'추가 참고'} · ${esc(b.group)}</small><b>${esc(data.short)}</b></span></label><a href="${url(data.url)}" target="_blank" rel="noopener" aria-label="${esc(data.short)} 원문 열기">원문 ↗</a></div><p>${esc(b.question)}</p><div class="workspace-fields">${b.fields.length?b.fields.slice(0,5).map(f=>`<span>${esc(f)}</span>`).join(''):'<span>제공 항목 미확인</span>'}</div><details><summary>범위·이용조건·한계 확인</summary><dl><dt>제공기관</dt><dd>${esc(data.provider)}</dd><dt>범위·갱신</dt><dd>${esc(data.coverage||'지역 미확인')} / ${esc(data.cycle||'주기 미확인')}</dd><dt>이용조건</dt><dd>${esc([data.license,data.cost].filter(Boolean).join(' · ')||'미확인')}</dd><dt>연결 확인</dt><dd>${esc(b.join)}</dd><dt>한계</dt><dd>${esc(r.limit||data.limit||'추가 확인 필요')}</dd></dl></details><span class="workspace-verification">${data.metaMatched||data.verifiedAt?'목록·메타정보 확인':'목록 수록 · 대조 미확인'} · 실제 응답·결합 미검증</span></article>`}).join('')}</div>
   <p class="workspace-caption">자료를 담는 것은 원천 데이터를 내려받거나 이용 권한을 확보한 것이 아닙니다.</p>`;
 }
 function usagePanel(c,d){
  return `<h3>직접 써본 결과를 남겨주세요</h3><p class="workspace-caption">사용 전에는 평가를 만들지 않습니다. 아래 기록은 사용자 자기보고이며 특공대의 검증 단계와 별개입니다.</p>${d.selected.length?d.selected.map(id=>{const data=model.datasets.get(id),f=d.feedback[id]||{status:'untried',note:''};return `<article class="workspace-usage-card"><h4>${esc(data.short)}</h4><label>사용 상태<select data-usage="${esc(id)}">${options(USAGE,f.status)}</select></label><label>무엇에 썼고, 무엇이 부족했나요?<textarea data-feedback="${esc(id)}" maxlength="1000" rows="3" placeholder="예: 기관 위치를 대조했지만 실증 참여 여부는 확인할 수 없었음">${esc(f.note)}</textarea></label></article>`}).join(''):'<div class="workspace-empty"><p>아직 담은 자료가 없습니다.</p><button class="workspace-secondary" data-step="data">자료 고르기 →</button></div>'}`;
 }
 const field=(name,label,value,placeholder='',rows=2)=>`<label class="workspace-field ${['problem','fields'].includes(name)?'wide':''}">${label}<textarea id="need-${name}" data-need="${name}" rows="${rows}" maxlength="${['problem','fields'].includes(name)?2000:600}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
 function needPanel(c,d){
  const n=d.need;
  return `<h3>기존 자료로 해결되지 않는 부분은 무엇인가요?</h3><p class="workspace-caption">목록에서 못 찾았다고 미개방인 것은 아닙니다. 필요한 데이터부터 적고, 확인되지 않은 보유기관·공개 상태는 미확인으로 남기세요.</p>
  <div class="workspace-need-grid">${field('problem','현재 자료의 한계·해결할 문제 *',n.problem,'비어 있는 실증 판단은 무엇인가요?')}${field('fields','필요한 데이터 항목 *',n.fields,'예: 기관별 실증 수행 역량, 집계 운영지표')}${field('scope','지역·기간·상세 수준',n.scope,'어느 지역, 어느 기간, 어느 단위인가요?')}${field('cycle','갱신주기',n.cycle,'예: 매일 갱신, 월별 집계')}${field('format','제공 방식',n.format,'예: CSV, API, 비식별 집계')}
  <label class="workspace-field">필요 시점<input type="date" id="need-date" data-need="date" value="${esc(n.date)}"><small>미정이면 비워두세요.</small></label>
  <label class="workspace-field wide">현재 상태에 대한 작성자 판단<select id="need-availability" data-need="availability">${options(AVAILABILITY,n.availability)}</select></label>
  ${field('holder','보유기관 · 미확인이면 빈칸',n.holder,'확인한 기관만 기재')}${field('evidence','보유·공개 상태 확인 근거',n.evidence,'확인한 원문 주소·문서명·확인일 등')}</div>
  <p class="workspace-caption">기관 검토 전 수요 초안입니다. 실증 조건과 데이터 제공 근거는 별도로 확인해야 합니다.</p>`;
 }
 function render(){
  const c=active?.context,d=active?.draft;
  dialog.innerHTML=`<div class="workspace-head"><div><span class="workspace-eyebrow">특공대 / MY DATA</span><h2 id="workspace-title">내 데이터 묶음</h2></div><button id="close-workspace" aria-label="내 데이터 묶음 닫기">×</button></div>
   <div class="workspace-layout">${c?`<aside class="workspace-context" aria-label="묶음의 개별 특례"><span class="workspace-region">${esc(c.region)} / ${esc(c.topic.short)}</span><h3>${esc(c.current.title)}</h3><p>${esc(c.current.zoneName)}</p><details><summary>선택한 특례의 조건·근거</summary><p><b>허용·실증</b><br>${esc(c.current.after)}</p><p><b>남는 조건</b><br>${esc(c.current.conditions)}</p><p>${esc(c.current.period)}</p><a href="${url(c.current.source)}" target="_blank" rel="noopener">특례 원문 ↗</a><p>현재 효력·신규 참여 자격은 별도 확인</p></details>
   <label class="workspace-goal">내 실증·사업화 과제 *<textarea id="workspace-goal" maxlength="600" rows="3" placeholder="예: 무인 농작업 전 위험 조건을 확인하는 서비스를 실증한다">${esc(d.goal)}</textarea></label><div class="workspace-count"><strong id="workspace-selected-count">${d.selected.length}</strong><span>직접 담은 자료<br>활용 여부는 별도 기록</span></div>${renderSaved()}<p class="workspace-privacy">개별 특례별로 저장됩니다. 이 브라우저에서만 보관하며 기관에 전송하지 않습니다.</p></aside>`:''}
   <section class="workspace-main" aria-label="자료 선택과 수요 기록">${c?`<div class="workspace-tabs" role="tablist" aria-label="데이터 활용 흐름">${[['data','1 자료 고르기'],['usage','2 사용 결과'],['need','3 부족한 데이터']].map(([id,name])=>`<button role="tab" id="workspace-tab-${id}" aria-selected="${step===id}" aria-controls="workspace-panel" tabindex="${step===id?0:-1}" data-step="${id}">${name}</button>`).join('')}</div><div id="workspace-panel" role="tabpanel" aria-labelledby="workspace-tab-${step}" tabindex="0">${step==='data'?dataPanel(c,d):step==='usage'?usagePanel(c,d):needPanel(c,d)}</div>`:`<div class="workspace-empty"><h3>먼저 지역과 특례를 골라주세요</h3><p>특례 설명을 읽고 자료를 담으면, 그 특례에 맞는 데이터 묶음과 수요 초안을 만들 수 있습니다.</p>${renderSaved()}<button class="workspace-primary" data-action="explore">지도로 돌아가 탐색하기 →</button></div>`}</section></div>
   <div class="workspace-footer"><p id="workspace-save-status" role="status" class="${storageProblem?'storage-error':''}">${esc(storageProblem||(d?.updatedAt?'이 브라우저에 저장됨 · 기관 미제출':'아직 작성 전 · 입력하면 이 브라우저에 저장됩니다'))}</p>${storageProblem&&c?rescueButton:''}<p id="workspace-error" role="alert"></p>${c?'<button class="workspace-primary" data-action="export">묶음·수요 초안 내려받기 ↓</button>':''}</div>${c?`<div class="workspace-handoff" aria-label="초안의 다음 단계"><b>이 초안으로 할 수 있는 것</b><p>이 사이트는 초안을 접수하지 않습니다. 부족한 데이터는 공공데이터포털의 <a href="${REQUEST_URL}" target="_blank" rel="noopener">공공데이터 제공신청 ↗</a>에 본인 계정으로 직접 신청할 수 있습니다. 기관은 신청을 받은 날부터 10일 안에 제공 여부를 결정합니다.</p><div class="workspace-handoff-actions"><button data-action="copy-request">신청서용 요약 복사</button><span id="workspace-copy-status" role="status"></span></div></div>`:''}`;
  dialog.querySelector('#close-workspace').onclick=()=>dialog.close();
 }
 function changeStep(value){if(!['data','usage','need'].includes(value))return;step=value;render();dialog.querySelector('[role="tab"][aria-selected="true"]')?.focus();}
 function open({addData=null,tab='data'}={}){
  returnFocus=document.activeElement;onOpen?.();const context=getContext();active=context?{context,draft:getDraft(context)}:null;step=tab;
  if(active&&addData&&context.recs.some(r=>r.id===addData)&&!active.draft.selected.includes(addData)){active.draft.selected.push(addData);write();}
  render();if(!dialog.open)dialog.showModal();dialog.querySelector('#close-workspace').focus();
 }
 function download(){
  const error=validateDraft(active.draft);
  if(error){if(error.field?.startsWith('need-')&&step!=='need'){step='need';render();}dialog.querySelector('#workspace-error').textContent=error.message;dialog.querySelector('#'+(error.field==='goal'?'workspace-goal':error.field))?.focus();return;}
  const text=exportDraft(active.context,active.draft,model.datasets,dataBrief),blob=new Blob([text],{type:'text/markdown;charset=utf-8'}),href=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=href;a.download=`teukgongdae-${active.context.region}-${active.context.topic.id}-${active.context.current.id.replace(/[^a-zA-Z0-9-]/g,'_')}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  dialog.querySelector('#workspace-error').textContent='';dialog.querySelector('#workspace-save-status').textContent='파일 내려받기 요청됨 · 기관에 제출되지는 않았습니다.';
 }
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.step){changeStep(button.dataset.step);return;}
  if(button.dataset.action==='add-core'&&active){active.draft.selected=[...new Set([...active.draft.selected,...active.context.recs.filter(r=>r.core).map(r=>r.id)])];write();render();dialog.querySelector('[data-action="add-core"]')?.focus();}
  if(button.dataset.action==='export')download();
  if(button.dataset.action==='copy-request'){const status=dialog.querySelector('#workspace-copy-status');const text=requestSummary(active.context,active.draft,model.datasets);(navigator.clipboard?.writeText?navigator.clipboard.writeText(text):Promise.reject(new Error('clipboard'))).then(()=>{status.textContent='복사됨 · 포털 신청서에 붙여넣으세요';},()=>{status.textContent='복사할 수 없는 환경입니다 · 내려받은 파일의 4절을 이용하세요';});}
  if(button.dataset.action==='explore'){dialog.close();document.querySelector('#region-select').focus();}
 });
 dialog.addEventListener('input',event=>{
  const el=event.target;if(!active)return;
  if(el.id==='workspace-goal')active.draft.goal=el.value;
  else if(el.hasAttribute('data-need'))active.draft.need[el.dataset.need]=el.value;
  else if(el.dataset.feedback){const id=el.dataset.feedback;active.draft.feedback[id]={status:active.draft.feedback[id]?.status||'untried',note:el.value};}
  else return;
  const error=dialog.querySelector('#workspace-error');if(error)error.textContent='';write();
 });
 dialog.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='workspace-record-select'&&el.value){const r=memory[el.value];if(r){onNavigate(r);const c=getContext();active=c?{context:c,draft:getDraft(c)}:null;render();dialog.querySelector('#workspace-goal')?.focus();}return;}
  if(!active)return;
  if(el.dataset.pick){const id=el.dataset.pick;active.draft.selected=el.checked?[...new Set([...active.draft.selected,id])]:active.draft.selected.filter(x=>x!==id);el.closest('.workspace-data-card').classList.toggle('is-picked',el.checked);dialog.querySelector('#workspace-selected-count').textContent=active.draft.selected.length;write();}
  if(el.dataset.usage){const id=el.dataset.usage;active.draft.feedback[id]={status:el.value,note:active.draft.feedback[id]?.note||''};write();}
 });
 dialog.addEventListener('keydown',event=>{
  const tab=event.target.closest('[role="tab"]');if(!tab)return;
  const ids=['data','usage','need'],i=ids.indexOf(step);let next;
  if(event.key==='ArrowRight')next=(i+1)%3;if(event.key==='ArrowLeft')next=(i+2)%3;if(event.key==='Home')next=0;if(event.key==='End')next=2;
  if(next!==undefined){event.preventDefault();changeStep(ids[next]);}
 });
 dialog.addEventListener('close',()=>{refresh();if(returnFocus?.isConnected&&!returnFocus.closest('dialog'))returnFocus.focus({preventScroll:true});});
 document.addEventListener('click',event=>{const el=event.target.closest('[data-open-workspace]');if(el)open({addData:el.dataset.addData||null,tab:el.dataset.openWorkspace||'data'});});
 document.querySelector('#workspace-button').onclick=()=>open();
 return {open,refresh,getSelection:()=>{const c=getContext();return c?getDraft(c).selected:[];}};
}
