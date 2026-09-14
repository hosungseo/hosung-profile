// Individual-exemption layer: renders sandbox.go.kr approved cases (실증특례·임시허가·적극해석)
// as a tab inside a topic and as a standalone detail. Data: assets/sandbox-index.json (+ lazy sandbox-detail.json).
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?esc(u.href):'#'}catch{return '#'}};
const link=(href,text)=>`<a href="${url(href)}" target="_blank" rel="noopener">${esc(text)} ↗</a>`;
const PORTAL_LIST='https://www.sandbox.go.kr/sandbox.SandboxTaskSlPL';
const LIST_LIMIT=40;
export const caseURL=seq=>`https://www.sandbox.go.kr/sandbox.SandboxTaskSl?task_seq=${encodeURIComponent(seq)}`;

export function casesForTopic(S,topicId,region){
 const all=S.cases.filter(c=>c.themes.includes(topicId));
 const local=region?all.filter(c=>c.regions.includes(region)):[];
 const rest=region?all.filter(c=>!c.regions.includes(region)):all;
 return {all,local,rest};
}
export function casesForRegion(S,region){return region?S.cases.filter(c=>c.regions.includes(region)):S.cases;}

const typeClass=t=>t==='임시허가'?'permit':t==='적극해석'?'interpret':'pilot';
const validityLine=c=>{
 if(!c.estimatedEnd)return '추정 불가 · 승인일 없음';
 return `법정 기본기간 2년 기준 ${c.estimatedEnd}${c.estimatePassed?' 경과':' 이전'} · 추정`;
};
export function caseFields(c){
 return `<dl class="sb-fields"><div><dt>승인일</dt><dd>${esc(c.approvedOn||'미확인')}</dd></div><div><dt>기간</dt><dd class="${c.period==='미확인'?'unknown':''}">${esc(c.period)}</dd></div><div><dt>연장 이력</dt><dd class="${c.extension==='미확인'?'unknown':''}">${esc(c.extension)}</dd></div><div><dt>현재 효력</dt><dd class="unknown">${esc(c.validity)}<small>${esc(validityLine(c))}</small></dd></div></dl>`;
}
export function caseCard(c,{region}={}){
 const here=region&&c.regions.includes(region);
 return `<button class="sb-item" data-sandbox="${esc(c.seq)}" id="sb-${esc(c.seq)}"><span class="sb-head"><i class="sb-chip ${typeClass(c.type)}">${esc(c.type)}</i><i class="sb-chip field">${esc(c.field)}</i>${here?`<i class="sb-chip here">${esc(region)} 언급</i>`:''}<span class="sb-date">${esc(c.approvedOn)}</span></span><b>${esc(c.title)}</b><small>${esc(c.company)} · ${esc(c.ministry)}${c.regulations.length?' · '+esc(c.regulations[0])+(c.regulations.length>1?` 외 ${c.regulations.length-1}`:''):''}</small></button>`;
}
export function casesPanel(S,topic,region){
 const {all,local,rest}=casesForTopic(S,topic.id,region);
 const head=`<h3>포털 승인과제와 대응</h3><p class="meta">규제샌드박스 통합포털 승인과제 ${S.total.toLocaleString()}건 중 이 주제의 키워드·관련규정에 대응된 ${all.length}건입니다. ${esc(S.notes.theme)} 특구 단위가 아닌 <b>개별 승인 단위</b>입니다.</p>`;
 if(!all.length)return head+`<p>대응된 승인과제가 없습니다. 주제 키워드에 걸리지 않았을 뿐 특례가 없다는 뜻이 아닙니다. ${link(PORTAL_LIST,'포털에서 제목·내용으로 검색')}</p>`;
 const list=(items,label,note)=>items.length?`<section class="sb-group"><h3>${esc(label)} <span>${items.length}</span></h3>${note?`<p class="meta">${esc(note)}</p>`:''}<div class="sb-list">${items.slice(0,LIST_LIMIT).map(c=>caseCard(c,{region})).join('')}</div>${items.length>LIST_LIMIT?`<p class="meta">처음 ${LIST_LIMIT}건만 표시. 나머지는 검색창에서 사업명·업체명으로 찾거나 ${link(PORTAL_LIST,'포털 목록')}에서 확인합니다.</p>`:''}</section>`:'';
 return head
  +(region?list(local,`${region} 언급`,'제목·내용·조건에 이 지역 지명이 적힌 과제입니다. 실증 장소가 이 지역이라는 확정은 아닙니다.'):'')
  +list(rest,region?'지역 미표기':'전체','본문에 지명이 없어 전국 대상이거나 지역 미확인인 과제입니다.')
  +`<div class="sb-legend"><b>4칸의 뜻</b><p>${esc(S.notes.validity)}</p><p>${esc(S.notes.estimate)}</p></div>`;
}
export function caseDetail(c,S,detail,{themes,region}={}){
 const themeButtons=(c.themes||[]).map(id=>{const t=themes.get(id);return t?`<button class="relation-link" data-select="t:${esc(id)}">${esc(t.short)}<span aria-hidden="true"> ↗</span><small>${c.themeBasis?.[id]==='regulation'?'관련규정의 법률명으로 대응':'제목·주요내용 키워드로 대응'}</small></button>`:''}).join('');
 const d=detail||{};
 const conditions=d.conditions??null;
 return `<p class="subject-breadcrumb">규제샌드박스 승인과제 / ${esc(c.field)} / ${esc(c.no||c.seq)}</p><h2>${esc(c.title)}</h2>
  <p class="sb-head"><i class="sb-chip ${typeClass(c.type)}">${esc(c.type)}</i><i class="sb-chip field">${esc(c.field)}</i>${c.regions.map(r=>`<i class="sb-chip here">${esc(r)}</i>`).join('')}</p>
  <dl class="case-scope"><dt>업체</dt><dd>${esc(c.company)}</dd><dt>주관</dt><dd>${esc(c.ministry)}</dd><dt>규제</dt><dd>${esc(c.regulator||'미기재')}</dd><dt>신청</dt><dd>${esc(c.requestedOn||'미기재')}</dd></dl>
  ${caseFields(c)}
  <p class="source-status partial">포털 승인일만 확정값 · 기간·연장·효력은 본문 문구가 있을 때만 기재 · ${esc(S.notes.estimate)}</p>
  <h3>주요내용</h3><p class="lead">${esc(d.summary||c.summary)}</p>
  <h3>규제특례 · 관련규정</h3>${c.regulations.length?`<div class="field-list">${c.regulations.map(r=>`<span>${esc(r)}</span>`).join('')}</div>`:'<p>포털에 관련규정이 기재되지 않았습니다.</p>'}
  <h3>부가조건</h3>${conditions===null?'<p class="meta" id="sb-conditions">조건 본문을 불러오는 중…</p>':conditions?`<pre class="sb-conditions">${esc(conditions)}</pre>`:'<p>포털에 부가조건이 기재되지 않았습니다.</p>'}
  ${d.contacts?.length?`<h3>과제 담당</h3><p class="meta">${d.contacts.map(esc).join('<br>')}</p>`:''}
  <h3>지역</h3><p>${c.regions.length?esc(c.regions.join(' · '))+' <span class="meta">— 본문 지명 기준. 실증 장소·사업자 소재지의 확정이 아닙니다.</span>':'본문에 지명이 없습니다. 전국 대상이거나 지역 미확인입니다.'}</p>
  <h3>대응 주제</h3>${themeButtons||'<p>편집 주제 21개에 대응되지 않았습니다. 특례가 없다는 뜻이 아니라 키워드에 걸리지 않은 것입니다.</p>'}
  <h3>근거</h3><p>${link(caseURL(c.seq),'규제샌드박스 통합포털 과제 상세')}</p><p class="meta">수록 기준 ${esc(S.fetchedAt?.slice(0,10)||S.parsedAt)} · 포털 상태값 '포털공개중' · 종료·취소 여부는 포털이 제공하지 않습니다.</p>`;
}
export function caseSearchItems(S){
 return S.cases.map(c=>({id:'s:'+c.seq,type:'case',label:c.title,search:[c.title,c.company,c.ministry,c.field,c.type,c.regulations.join(' '),c.regions.join(' ')].join(' '),sub:[c.type,c.approvedOn,c.company].join(' · ')}));
}
