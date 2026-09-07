import {SUPPORT_ROLES,AUTHORITY_LABELS,selectDiverse} from './support-model.mjs';
import {regulationCards,orderedRecommendations} from './content-guide.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=(v,n=105)=>{const s=(v||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n)+'…':s};
export const roleTags=profile=>profile.roles.length?profile.roles.map(r=>`<span class="support-role-tag" title="${esc(r.evidence)}">${esc(r.short)}</span>`).join(''):'<span class="support-role-tag unknown">역할 미분류</span>';
const matchText=match=>match.kind==='sector'?'분야 단어 연관':match.kind==='adjacent'?'인접 분야 · 대상 대조':'기능 공통 후보';
export function supportCard(row,{compact=false}={}){
 const p=row.program,f=p.supportProfile;
 return `<button class="support-card ${p.level} ${p.kind}" data-support-select="${esc(p.id)}"><span class="support-card-kicker">${esc(f.authority)} · ${esc(f.scope)}${p.kind==='budget'?' · 예산기록':''}</span><strong>${esc(p.title)}</strong><span class="support-tags">${roleTags(f)}</span>${compact?'':`<span class="support-match">${esc(matchText(row.match))} · 대상 조건 확인 필요</span><span class="support-target">대상: ${esc(short(f.target||'대상 미수록',130))}</span><span class="support-agency">${esc(p.agency)} · ${p.kind==='annual'?'연간 안내 / 모집 확인 필요':'사업 전체 예산 / 신청공고 아님'}</span>`}</button>`;
}
export function roleFilters(current='',prefix='support'){
 return `<div class="support-role-filters" aria-label="지원 기능 필터"><button data-${prefix}-role="" aria-pressed="${!current}">전체 역할</button>${SUPPORT_ROLES.map(r=>`<button data-${prefix}-role="${r.id}" aria-pressed="${current===r.id}">${esc(r.short)}</button>`).join('')}</div>`;
}
export function supportPanelContent(model,topic,region,{role='',kind='annual'}={}){
 const rows=model.support.candidates(topic,region,{kind,role});
 const adjacent=kind==='annual'?model.support.candidates(topic,region,{kind,role,includeAdjacent:true}).filter(r=>r.match.kind==='adjacent'):[];
 return `<h2 class="sr-only">중앙·지역 지원</h2><h3>중앙·지역의 지원 조합 후보</h3>
 <details class="support-filter-control"><summary>${esc(SUPPORT_ROLES.find(r=>r.id===role)?.short||'전체 역할')} · ${kind==='annual'?'연간 사업안내':'예산기록'} · 필터 변경</summary>
 <div class="support-source-switch" aria-label="지원 자료 종류"><button data-support-kind="annual" aria-pressed="${kind==='annual'}">연간 사업안내</button><button data-support-kind="budget" aria-pressed="${kind==='budget'}">예산기록 별도 보기</button></div>${roleFilters(role)}</details>
 <p class="support-results">${rows.length}개 수록 후보 · ${kind==='annual'?'자격·모집·동시 수혜 미확인':'사업 전체 예산 · 신청공고 아님'}</p>
 ${['central','sido','gicho'].map(level=>{const pool=rows.filter(r=>r.program.level===level),first=selectDiverse(pool,2,role?[role]:[]),rest=pool.filter(r=>!first.includes(r));return `<section class="authority-group ${level}"><h3>${AUTHORITY_LABELS[level]} <span>${pool.length}개 후보</span></h3>${first.length?first.map(r=>supportCard(r)).join(''):'<p class="empty-support">이 분류의 수록 후보가 없습니다. 지원 자체가 없다는 뜻은 아닙니다.</p>'}${rest.length?`<details><summary>나머지 ${rest.length}개 후보</summary>${rest.map(r=>supportCard(r)).join('')}</details>`:''}</section>`}).join('')}
 ${adjacent.length?`<details class="adjacent-support"><summary>인접 분야 ${adjacent.length}개 · 대상 추가 대조</summary><p class="meta">단어가 비슷해도 대상기업이 다를 수 있어 기본 조합에서 제외했습니다.</p>${adjacent.map(r=>supportCard(r)).join('')}</details>`:''}
 <button class="compare-inline" data-open-compare>같은 주제로 지역 비교 ↗</button>`;
}
export function supportLanesContent(model,topic,region,role=''){
 const plan=model.support.composition(topic,region,{needed:role?[role]:[]});
 return `<h2 class="sr-only">지원 조합 후보</h2><div class="path-heading"><span>SUPPORT / 지원 조합 후보</span><b>${esc(role?SUPPORT_ROLES.find(r=>r.id===role)?.label:'같은 주제, 서로 다른 역할')}</b></div>${roleFilters(role,'lane')}<div class="support-lanes">${['central','sido','gicho'].map(level=>`<section class="${level}"><h3>${AUTHORITY_LABELS[level]}</h3>${plan.levels[level][0]?supportCard(plan.levels[level][0],{compact:true}):'<p>수록 후보 미확인</p>'}</section>`).join('')}</div><p class="support-lanes-note">분야·기능으로 찾은 후보 · 대상 조건·모집·동시 수혜 확인 필요 <button data-open-support>조건과 전체 후보 ↗</button></p>`;
}
export function supportDetailProfile(program,match){
 const f=program.supportProfile;if(!f)return '';
 return `<div class="support-detail-summary ${program.level}"><span>${esc(f.authority)} / ${esc(f.scope)}</span><div class="support-tags">${roleTags(f)}</div><p>${esc(program.support||'지원 내용 미수록')}</p><small>${esc(match?matchText(match):'선택 주제와의 연결 미확인')} · 대상 조건 확인 필요</small></div><details class="role-evidence"><summary>이 역할로 분류한 근거</summary>${f.roles.map(r=>`<p><b>${esc(r.label)}</b><br>${esc(r.evidence)}</p>`).join('')||'<p>지원 기능을 분류할 구체적인 설명이 없습니다.</p>'}</details>`;
}

export function comparisonContent({atlas,evidence,model,topic,regions,needed,keyword}){
 const kinds=needed.length?needed:SUPPORT_ROLES.map(r=>r.id);
 const central=model.support.composition(topic,null,{needed:kinds,keyword}).levels.central;
 const regionCards=regions.map(region=>{
  const plan=model.support.composition(topic,region,{needed:kinds,keyword});
  const cards=regulationCards(atlas,evidence,topic,region),core=cards.length?orderedRecommendations(topic,region).filter(r=>r.core):[];
  const locals=['sido','gicho'].flatMap(level=>plan.levels[level]);
  const chosen=selectDiverse(locals,3,kinds);
  // Keep at least one municipal candidate if present; city-specific conditions remain visible.
  const municipal=locals.find(r=>r.program.level==='gicho');
  if(municipal&&!chosen.some(r=>r.program.level==='gicho'))chosen.splice(Math.min(2,chosen.length),1,municipal);
  return `<article class="comparison-region" data-comparison-region="${esc(region)}"><header><span>지역별 조건과 자원</span><h3>${esc(region)}</h3><button data-region-explore="${esc(region)}">지도에서 보기 ↗</button></header>
   <section class="compare-coverage"><h4>필요한 지역지원의 수록 여부</h4>${plan.coverage.filter(r=>kinds.includes(r.id)).map(r=>`<div><span>${esc(r.label)}</span><b class="${r.localFound?'available':'unknown'}">${r.localFound?'후보 있음':'수록 후보 없음'}</b></div>`).join('')}</section>
   <section class="compare-supports"><h4>지역 지원 조합 후보</h4>${chosen.length?chosen.map(r=>supportCard(r)).join(''):'<p class="empty-support">현재 주제·기능·검색어에 맞는 지역 후보가 없습니다. 원자료의 범위 밖 지원까지 없다고 판단할 수는 없습니다.</p>'}</section>
   <section class="compare-exemption"><h4>특례의 차이</h4>${cards.length?`<strong>${esc(cards[0].title)}</strong><details><summary>허용 내용·근거 ${cards.length}건 확인</summary><p>${esc(cards[0].after)}</p><small>대표 근거 1건 / 수록 근거 ${cards.length}건 · 현재 효력 미확인</small></details>`:'<p>이 주제의 지역별 특례 근거가 미수록입니다. 특례가 없다는 뜻은 아닙니다.</p>'}</section>
   <section class="compare-data"><h4>필요한 데이터</h4>${core.length?core.map(r=>`<span>${esc(model.datasets.get(r.id).short)}</span>`).join(''):'<p>지역 특례와의 연결 근거를 먼저 확인해야 합니다.</p>'}</section>
   <p class="compare-caution">시·군 사업은 해당 소관과 소재지 조건을 따로 확인합니다. 지역 전체의 신청 자격을 보장하지 않습니다.</p></article>`;
 });
 return `<details class="comparison-common"><summary><strong>중앙 소관 · 공통 조회 후보 ${central.length}개</strong>${esc(central.map(r=>r.program.title).join(' / '))}<small>펼쳐서 대상 조건 확인 · 중앙 소관이라는 이유로 전국 누구나 신청할 수 있는 것은 아닙니다.</small></summary><div class="comparison-central">${central.length?central.map(r=>supportCard(r)).join(''):'<p>현재 필터에 맞는 중앙 소관 후보가 없습니다.</p>'}</div></details><div class="comparison-grid" style="--comparison-columns:${regions.length}">${regionCards.join('')}</div><p class="comparison-footnote">사업 수로 지역을 순위 매기지 않습니다. 수록된 2026 연간안내의 비교이며 모집상태·중복수혜·현재 특례 효력은 별도 확인합니다. 예산기록은 이 지원 조합에 섞지 않습니다.</p>`;
}
