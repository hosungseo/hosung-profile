import {regulationCards,orderedRecommendations,dataBrief} from './content-guide.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?esc(u.href):'#'}catch{return '#'}};
const link=(href,text)=>`<a href="${url(href)}" target="_blank" rel="noopener">${esc(text)} ↗</a>`;
const statusLabel=c=>c.level==='notice'?'고시·조문 발췌 요약':c.level==='overview'?'지정 당시 공식 개요':'허용·조건 설명 미확인';
const relation=(id,name,sub)=>`<button class="relation-link" data-select="${esc(id)}">${esc(name)}<span aria-hidden="true"> ↗</span><small>${esc(sub)}</small></button>`;

export function topicContent({atlas,evidence,model,graph,topic,region,caseId}){
 const cards=regulationCards(atlas,evidence,topic,region);
 const current=cards.find(c=>c.id===caseId)||cards[0];
 const recs=orderedRecommendations(topic,region),core=recs.filter(r=>r.core);
 const supports=graph.edges.filter(e=>e.from==='t:'+topic.id&&e.kind==='support');
 const locations=atlas.locations.filter(l=>(!region||l.region===region)&&l.topics.includes(topic.id));
 if(!current)return {html:'<h2>개별 특례 설명 확인 중</h2><p>이 지역에 대응되는 원문 자료가 아직 없습니다.</p>',current:null,core,recs};
 const selector=cards.length>1?`<label class="case-picker">개별 특례·근거 ${cards.length}건<select id="case-select" aria-label="개별 특례 근거 선택">${cards.map(c=>`<option value="${esc(c.id)}" ${c.id===current.id?'selected':''}>${esc(c.zoneName+' · '+c.title)}</option>`).join('')}</select></label>`:`<p class="case-origin">${esc(current.zoneName)}</p>`;
 const coreHTML=core.map(rec=>{const d=model.datasets.get(rec.id),b=dataBrief(d,rec);return `<button class="core-card" data-select="d:${esc(d.id)}"><span class="data-role">${String(rec.rank).padStart(2,'0')} / ${esc(b.group)}</span><b>${esc(d.short)}</b><span>${esc(b.question)}</span></button>`}).join('');
 const groupHTML=[...new Set(recs.map(r=>r.group))].map(group=>`<section class="data-group"><h3>${esc(group)}</h3>${recs.filter(r=>r.group===group).map(rec=>{const d=model.datasets.get(rec.id);return relation('d:'+d.id,d.short,(rec.core?'먼저 볼 자료':'추가 참고')+' · '+dataBrief(d,rec).question)}).join('')}</section>`).join('');
 const tabs=[['overview','특례 이해'],['data',`자료 ${recs.length}`],['support',`지원 ${supports.length}`],['evidence','위치·근거']];
 const html=`<p class="subject-breadcrumb">${esc(region||'전국')} / ${esc(topic.short)}</p><h2>${esc(current.title)}</h2>${selector}
  <div class="detail-tabs" role="tablist" aria-label="특례 상세 내용">${tabs.map(([id,label],i)=>`<button id="tab-${id}" role="tab" aria-selected="${i===0}" aria-controls="tab-panel-${id}" tabindex="${i===0?0:-1}" data-tab="${id}">${label}</button>`).join('')}</div>
  <div id="tab-panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabindex="0">
   <div class="regulation-change"><div class="delta-before"><span>기존 제한 · 자료 기준</span><p class="lead">${esc(current.before)}</p></div><div class="delta-after"><span>특례로 달라지는 것</span><p class="lead">${esc(current.after)}</p></div></div>
   <div class="remaining-condition"><b>남는 조건</b><p>${esc(current.conditions)}</p></div>
   <p class="source-status ${current.level}">${esc(statusLabel(current))} · ${esc(current.status)}</p>
   <dl class="case-scope"><dt>대상</dt><dd>${esc(current.audience)}</dd><dt>기간</dt><dd>${esc(current.period)}</dd><dt>장소</dt><dd>${esc(current.place||[...new Set(locations.map(l=>l.municipality))].join('·')||region+' · 세부 구역 미확인')}</dd></dl>
   <h3>이 실증에 먼저 붙여볼 자료</h3><p class="meta">중요도 점수가 아닌 편집 추천 ${core.length}개입니다. 나머지 ${recs.length-core.length}개는 ‘자료’ 탭에서 확인합니다.</p><div class="core-grid">${coreHTML}</div>
   <div class="result-idea"><span>만들어볼 결과 · 검증 전 활용 가설</span><p>${esc(current.result||topic.output)}</p><small>${esc(current.question||topic.question)}</small></div>
   <p>${link(current.source,current.sourceTitle)}</p>
  </div>
  <div id="tab-panel-data" role="tabpanel" aria-labelledby="tab-data" tabindex="0" hidden><h3>자료의 역할을 먼저 고르세요</h3><p class="meta">파란 점 하나는 관측값이 아닌 자료 목록 한 건입니다. 전체 ${recs.length}개 중 핵심 ${core.length}개를 지도에서 우선 표시합니다.</p>${groupHTML}</div>
  <div id="tab-panel-support" role="tabpanel" aria-labelledby="tab-support" tabindex="0" hidden><h3>사업화를 위해 검토할 지원</h3><p class="meta">분야·지역으로 선별한 후보입니다. 특례의 공식 지원이나 신청 자격을 뜻하지 않습니다.</p>${supports.length?supports.map(e=>{const p=model.programs.get(e.to.slice(2));return relation(e.to,p.title,p.agency+' · '+(p.kind==='annual'?'연간 지원안내':'재정 예산사업')+' / '+e.why)}).join(''):'<p>연결된 지원 후보가 없습니다. 전체 자료 검색에서 확인하세요.</p>'}</div>
  <div id="tab-panel-evidence" role="tabpanel" aria-labelledby="tab-evidence" tabindex="0" hidden><h3>선택한 특례의 근거</h3><p class="lead">${esc(current.zoneName)}</p><p>${esc(current.period)}</p><p>${esc(current.status)}</p><p>${link(current.source,current.sourceTitle)}${current.noticeURL!==current.source?'<br>'+link(current.noticeURL,'해당 특구 고시·사업개요'):''}</p><p class="meta">자료 기준: ${esc(current.date)} · ${esc(statusLabel(current))}</p>${current.excerpt?`<details class="source-excerpt"><summary>보유 원문 발췌 읽기</summary><pre>${esc(current.excerpt)}</pre></details>`:'<p>이 화면에 보유한 고시 발췌는 없습니다. 공식 개요와 실제 승인조건을 구분해 확인합니다.</p>'}<h3>시·군 위치</h3>${locations.length?locations.map(l=>`<p><b>${esc(l.municipality)}</b> · ${l.precision==='official-municipality'?'공식 위치 자료':'명칭 기반 대응'}<br>${esc(l.note||l.basis)}</p>${l.sources.map(s=>link(s.url,s.title)).join('<br>')}`).join(''):'<p>세부 위치 미확인. 관계망의 주제 위치는 실제 시설 좌표가 아닙니다.</p>'}<h3>데이터 활용의 한계</h3><p>${esc(topic.boundary)}</p></div>`;
 return {html,current,core,recs};
}

export function datasetContent(dataset,recommendations,model){
 const rec=recommendations[0],brief=dataBrief(dataset,rec?.recommendation);
 const fields=brief.fields,metadataChecked=dataset.metaMatched===true||!!dataset.verifiedAt;
 return `<p class="subject-breadcrumb">${esc(dataset.provider)} / ${esc(dataset.kind)} 목록</p><h2>${esc(dataset.short)}</h2><p class="data-role">${brief.core?'먼저 볼 자료':'참고자료'} · ${esc(brief.group)}</p>
 <div class="data-question"><span>이 자료로 답할 질문</span><p class="lead">${esc(brief.question)}</p></div>
 <h3>무엇이 들어 있나요?</h3>${fields.length?`<div class="field-list">${fields.map(f=>`<span>${esc(f)}</span>`).join('')}</div><p class="meta">목록 메타정보에 수록된 주요 항목. 실제 응답 표본은 아직 확인하지 않았습니다.</p>`:'<p>주요 제공 항목 미확인. 포털 설명만으로 데이터 필드를 추정하지 않았습니다.</p>'}
 <div class="verification-steps" aria-label="자료 검증 수준"><span class="${metadataChecked?'checked':''}">${metadataChecked?'목록·메타정보 확인':'목록 수록 · 대조 미확인'}</span><span>실제 응답 미검증</span><span>자료 결합 미검증</span></div>
 <h3>이 특례에서의 쓰임과 한계</h3>${recommendations.map(e=>`<p class="policy-statement">${esc(e.recommendation.why)}</p><p>${esc(e.recommendation.limit)}</p>${relation(e.from,model.themes.get(e.from.slice(2)).short,'특례 설명으로 돌아가기')}`).join('')}
 <h3>다른 자료와 연결하려면</h3><p>${esc(brief.join)}</p>
 <h3>데이터 이용 범위</h3><dl class="case-scope"><dt>지역</dt><dd>${esc(dataset.coverage||'제공 지역 미확인')}</dd><dt>이용</dt><dd>${esc(dataset.license||'이용조건 미확인')} · ${esc(dataset.cost||'비용 미확인')}</dd><dt>갱신</dt><dd>포털 등록 주기: ${esc(dataset.cycle||'미수록')}<br>목록 수정일: ${esc(dataset.modified||'미수록')}<br>이 화면의 실시간 수신을 뜻하지 않습니다.</dd></dl>
 <p>${esc(dataset.limit||'추가 이용제약은 원문에서 확인합니다.')}</p><p>${link(dataset.url,dataset.title)}</p>
 <details><summary>포털 소개문 전체 읽기</summary><p>${esc(dataset.description||dataset.title)}</p></details>`;
}

export function storyContent(topic,content,model,region){
 const c=content.current;if(!c)return '';
 return `<p class="story-kicker">${esc(region)} · 특례 × 공공데이터</p><h2>${esc(c.title)}</h2><p class="story-origin">${esc(c.zoneName)} · ${esc(statusLabel(c))}</p><div class="story-delta"><div><b>기존 제한</b><p>${esc(c.before)}</p></div><span aria-hidden="true">→</span><div><b>허용된 실증</b><p>${esc(c.after)}</p></div></div><p class="story-condition"><b>남는 조건</b> ${esc(c.conditions)}</p><div class="story-materials">${content.core.map(r=>`<div><span>${String(r.rank).padStart(2,'0')} · ${esc(r.group)}</span><b>${esc(model.datasets.get(r.id).short)}</b></div>`).join('')}</div><p class="story-result"><span>활용 가설</span> ${esc(c.result||topic.output)}</p><p class="story-footnote">${esc(c.period)} · 현재 효력·신규 참여 미확인<br>자료 목록 기반 추천 · 실제 API 응답·결합 미검증</p>`;
}
