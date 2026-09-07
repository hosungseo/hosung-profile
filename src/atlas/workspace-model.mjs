export const STORAGE_KEY='atlas.enterprise-workspace.v1';
export const USAGE={untried:'아직 사용 전',useful:'사용해 보니 도움 됨',gap:'사용했지만 부족함',blocked:'이용하지 못함'};
export const AVAILABILITY={unknown:'존재·공개 여부 미확인',improve:'기개방 자료 개선 요청',unopened:'미개방으로 파악 · 근거 기재'};
export const workspaceKey=c=>JSON.stringify([c.region,c.topic.id,c.current.id]);
const string=(value,max=3000)=>typeof value==='string'?value.slice(0,max):'';
export function emptyDraft(){return {goal:'',selected:[],feedback:{},need:{problem:'',fields:'',scope:'',cycle:'',format:'',date:'',holder:'',availability:'unknown',evidence:''},updatedAt:null};}
export function cleanDraft(raw,allowed){
 const draft=emptyDraft();if(!raw||typeof raw!=='object')return draft;
 draft.goal=string(raw.goal,600);draft.selected=[...new Set(Array.isArray(raw.selected)?raw.selected.filter(id=>allowed.has(id)):[])];
 for(const id of allowed){const f=raw.feedback?.[id];if(f&&typeof f==='object')draft.feedback[id]={status:Object.hasOwn(USAGE,f.status)?f.status:'untried',note:string(f.note,1000)};}
 for(const k of Object.keys(draft.need))draft.need[k]=string(raw.need?.[k],k==='problem'||k==='fields'?2000:600);
 if(!Object.hasOwn(AVAILABILITY,draft.need.availability))draft.need.availability='unknown';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.need.date))draft.need.date='';
 draft.updatedAt=string(raw.updatedAt,40)||null;return draft;
}
export function hasNeed(draft){return Object.entries(draft.need).some(([k,v])=>k!=='availability'&&!!v.trim())||draft.need.availability!=='unknown';}
export function validateDraft(draft){
 if(!draft.goal.trim())return {field:'goal',message:'수행하려는 실증·사업화 과제를 먼저 적어주세요.'};
 if(!draft.selected.length&&!hasNeed(draft))return {field:null,message:'자료를 하나 이상 담거나 부족한 데이터 수요를 적어주세요.'};
 if(hasNeed(draft)){
  for(const [k,m] of [['problem','현재 자료로 해결하지 못하는 문제'],['fields','필요한 데이터 항목']])if(!draft.need[k].trim())return {field:'need-'+k,message:m+'를 적어주세요.'};
  if(draft.need.availability==='unopened'&&(!draft.need.holder.trim()||!draft.need.evidence.trim()))return {field:!draft.need.holder.trim()?'need-holder':'need-evidence',message:'미개방으로 파악한 자료는 보유기관과 확인 근거를 적어주세요. 확인 전이면 상태를 미확인으로 두세요.'};
 }
 return null;
}
// User-entered text remains literal text in the exported Markdown, not active links/HTML.
const literal=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/[\\`*_{}\[\]()#+.!|~-]/g,'\\$&');
const input=value=>literal(value||'미기재').split('\n').map(line=>'> '+line).join('\n');
const safeLink=(href,label)=>{try{const u=new URL(href);return /^https?:$/.test(u.protocol)?`[${literal(label)}](<${u.href.replace(/>/g,'%3E')}>)`:literal(label)}catch{return literal(label)}};
export function exportDraft(context,draft,datasets,brief){
 const c=context.current;
 const lines=['# 아틀라스 · 특례·데이터 활용 묶음','',`- 지역: ${literal(context.region)}`,`- 탐색 주제: ${literal(context.topic.short)}`,`- 개별 특례: ${literal(c.zoneName+' · '+c.title)}`,`- 특례 식별자: ${literal(c.id)}`,'- 문서 성격: 사용자 작성 초안 · 기관 미제출 · 기업 수요 진위 미확인',`- 내보낸 시각: ${new Date().toISOString()}`,'','## 1. 내가 수행할 실증·사업화 과제','',input(draft.goal),'','## 2. 선택한 개별 특례 · 보유 자료 기준','',`**기존 제한:** ${literal(c.before)}`,'',`**특례로 달라지는 것:** ${literal(c.after)}`,'',`**남는 조건:** ${literal(c.conditions)}`,'',`- 대상: ${literal(c.audience)}`,`- 기간: ${literal(c.period)}`,`- 출처 상태: ${literal(c.status)}`,`- 근거: ${safeLink(c.source,c.sourceTitle)}`,'','현재 효력·신규 참여 자격은 별도 확인 대상입니다. 아래 자료는 주제 수준의 큐레이션 후보이며, 개별 특례에 적합한지는 직접 대조해야 합니다.','',`## 3. 직접 담은 데이터 ${draft.selected.length}개`,''];
 for(const id of draft.selected){
  const d=datasets.get(id),rec=context.recs.find(r=>r.id===id),b=brief(d,rec),f=draft.feedback[id]||{status:'untried',note:''};
  lines.push(`### ${literal(d.short)}`,'',`- 원문: ${safeLink(d.url,d.title)}`,`- 제공기관: ${literal(d.provider)}`,`- 활용 질문: ${literal(b.question)}`,`- 주요 항목: ${literal(b.fields.join(' · ')||'미확인')}`,`- 범위: ${literal(d.coverage||'미확인')}`,`- 갱신주기: ${literal(d.cycle||'미확인')}`,`- 이용조건: ${literal([d.license,d.cost].filter(Boolean).join(' · ')||'미확인')}`,`- 결합 확인 사항: ${literal(b.join)}`,`- 한계: ${literal(rec?.limit||d.limit||'추가 확인 필요')}`,`- 아틀라스 검증: ${d.metaMatched||d.verifiedAt?'목록·메타정보 확인':'목록 수록 · 대조 미확인'} / 실제 응답·결합 미검증`,`- 사용자 평가: ${USAGE[f.status]} · 자기보고, 공식 검증 아님`,'',input(f.note),'');
 }
 if(!draft.selected.length)lines.push('담은 데이터 없음. 수요만 작성한 초안입니다.','');
 lines.push('## 4. 부족한 데이터 수요','');
 if(hasNeed(draft))for(const [k,label] of [['problem','현재 자료의 한계·해결할 문제'],['fields','필요한 항목'],['scope','지역·기간·상세 수준'],['cycle','갱신주기'],['format','제공 방식'],['date','필요 시점'],['holder','보유기관'],['availability','공개 상태에 대한 작성자 판단'],['evidence','확인 근거']])lines.push(`**${label}**`,'',input(k==='availability'?AVAILABILITY[draft.need[k]]:draft.need[k]),'');
 else lines.push('미작성. 추가 수요 없음이나 충족 완료를 뜻하지 않습니다.','');
 lines.push('## 5. 다음 확인','', '- 원문에서 제공 항목·범위·이용조건을 대조하고 실제 사용 결과를 남깁니다.','- 기관 협의·선정·개방 일정은 확정되지 않았습니다. 미개방에 대한 작성자 판단도 기관 확인 전입니다.','- 일반 공개와 제한적 이용은 별도 검토 대상입니다. 지역별 큐레이션은 지역 독점 제공이 아닙니다.','- 이 파일을 내려받는 것은 기관에 수요를 제출하는 동작이 아닙니다.','');
 return lines.join('\n');
}
