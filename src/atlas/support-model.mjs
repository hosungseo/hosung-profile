// Two independent axes: administering authority and functions described by the source.
// This is evidence-backed retrieval, not an eligibility or joint-funding decision.
export const SUPPORT_ROLES=[
 {id:'capital',label:'사업화 자금·융자',short:'자금',pattern:/사업화\s*자금|지원금|융자|보증|자금\s*지원|실증\s*자금|시설비|장비\s*구입|임차료|임대료|투자비|활동\s*경비/},
 {id:'technology',label:'기술개발·시험·인증',short:'기술·인증',pattern:/기술\s*개발|연구\s*개발|R\s*&\s*D|기술\s*지원|시험\s*분석|시험\s*평가|기술\s*평가|인증|시제품/i},
 {id:'pilot',label:'실증·장비 활용',short:'실증·장비',pattern:/실증|테스트\s*베드|(?:공용|공동|전문|시험|연구)\s*장비|장비\s*(?:이용|활용|사용|임대)|시험\s*장소/},
 {id:'space',label:'입주·공간',short:'공간',pattern:/입주|공간|임대|사무실|보육\s*센터/},
 {id:'growth',label:'투자·보육·교육',short:'투자·보육',pattern:/투자|액셀|엑셀|보육|멘토|컨설팅|교육|역량\s*강화|AC\s*프로그램/i},
 {id:'market',label:'판로·공공구매',short:'판로',pattern:/판로|공공\s*구매|수출|해외\s*진출|글로벌\s*진출|마케팅|구매\s*연계/}
];
export const AUTHORITY_LABELS={central:'중앙정부',sido:'광역정부',gicho:'시·군·구'};
const clean=s=>(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const industry=/농식품|농생명|식품|푸드|농업|수산|축산|의료|의약|바이오|헬스|수소|에너지|배터리|반도체|로봇|모빌리티|선박|해양|우주|항공|콘텐츠|문화|관광|스포츠|체육|패션|섬유|게임|디자인|소상공인|사회적기업|반려동물|펫|예술|공예|뷰티|미용|화장품|첨단제조|첨단분야|방산|국방|드론|산림|보건|공간정보|국토교통|환경|에코|딥사이언스|초격차|ict|ai기술|ai\/ax/;
const topics={
 food:['식품','농식품','푸드','농생명','식가공'],
 'farm-machines':['농기계','농업기계','스마트농업','농업로봇','자율농작업'],
 clinical:['임상','의약','바이오','헬스케어','의료'],regenerative:['재생의료','세포','바이오','의약'],
 livestock:['축산','세포배양','배양육','축산물'],power:['직류','전력','에너지','농업전기'],
 'gas-port':['암모니아','벙커링','항만','선박'],space:['우주','항공'],
 buildings:['건축','도시개발','건설','부동산'],patents:['특허','지식재산','기술이전'],ads:['광고','옥외광고'],
 education:['교육','에듀','학교'],culture:['박물관','미술관','문화','예술'],sports:['스포츠','체육'],
 industry:['제조','공장','산업단지'], 'ev-charging':['충전','전기차','모빌리티'],
 'road-mobility':['자율주행','모빌리티','물류','로봇'], 'green-energy':['에너지','태양광','전력','ess'],
 hydrogen:['수소'],marine:['해양','선박','조선','항만'], 'medical-devices':['의료기기','의료','헬스','바이오']
};
const categoryRoles={'기술개발(R&D)':'technology','멘토링·컨설팅·교육':'growth','융자·보증':'capital'};

export function describeSupport(program){
 const roles=[];
 for(const role of SUPPORT_ROLES){
  let found;
  for(const field of ['support','summary','title']){
   const text=program[field]||'',match=text.match(role.pattern);
   if(match&&role.id==='capital'&&field!=='support'&&!/사업화\s*자금|실증\s*자금|자금\s*지원|지원금|융자\s*지원|보증\s*지원/.test(text))continue;
   if(match){found={id:role.id,label:role.label,short:role.short,field,evidence:text.slice(Math.max(0,match.index-15),match.index+match[0].length+45).trim()};break;}
  }
  if(!found&&categoryRoles[program.category]===role.id)found={id:role.id,label:role.label,short:role.short,field:'category',evidence:program.category};
  if(found)roles.push(found);
 }
 const target=(program.target||'').replace(/\s+/g,' ').trim();
 return {roles,roleIds:roles.map(r=>r.id),target,authority:AUTHORITY_LABELS[program.level]||'소관 미확인',
  scope:program.level==='central'?'중앙 소관 · 대상 지역은 공고 확인':program.district||program.region||'소관 지역 미확인',
  sectorSpecific:industry.test(clean((program.title||'')+' '+target)),
  sourceKind:program.kind==='annual'?'2026 연간 사업안내':'2026 재정 예산기록'};
}

export function matchSupport(program,topic){
 if(!topic)return null;
 const text=clean([program.title,program.summary,program.support,program.target].join(' '));
 const words=(topics[topic.id]||[]).filter(w=>text.includes(clean(w)));
 if(words.length)return {kind:'sector',words,why:`분야 단어 ‘${words.slice(0,3).join('·')}’가 사업 설명에 있습니다. 대상 조건은 별도 대조합니다.`};
 const oldWords=program.matches?.[topic.id]||[];
 if(oldWords.length)return {kind:'adjacent',words:oldWords,why:`인접 분야 ‘${oldWords.join('·')}’의 자료입니다. 선택 주제의 대상기업과 일치하는지는 미확인입니다.`};
 const restriction=clean([program.title,program.target].join(' '));
 if(!industry.test(restriction)&&(program.general||/창업기업|예비창업|초기창업|창업자|스타트업/.test(restriction))){
  return {kind:'general',words:[],why:'분야 공통 창업지원으로 검토할 후보입니다. 업력·소재지·연령 등 대상 조건은 별도 확인합니다.'};
 }
 return null;
}

export function selectDiverse(rows,limit=3,needed=[]){
 const pool=[...rows],picked=[],covered=new Set();
 while(pool.length&&picked.length<limit){
  const order=pool.map((row,i)=>({row,i,value:row.program.supportProfile.roleIds.filter(id=>(!needed.length||needed.includes(id))&&!covered.has(id)).length*25+(row.match.kind==='sector'?(picked.length?12:150):0)})).sort((a,b)=>b.value-a.value||a.i-b.i);
  const {row,i}=order[0];picked.push(row);row.program.supportProfile.roleIds.forEach(id=>covered.add(id));pool.splice(i,1);
 }
 return picked;
}

export function createSupportModel(rawPrograms,normalizeRegion=name=>name){
 const list=rawPrograms.map(p=>({...p,supportProfile:describeSupport(p)}));
 const programs=new Map(list.map(p=>[p.id,p]));
 const matchCache=new Map();
 const match=(p,t)=>{const key=p.id+':'+t?.id;if(!matchCache.has(key))matchCache.set(key,matchSupport(p,t));return matchCache.get(key)};
 function candidates(topic,region,{kind='annual',role='',keyword='',includeAdjacent=false,level=''}={}){
  region=normalizeRegion(region);const terms=keyword.trim().split(/[\s,]+/).map(clean).filter(Boolean);
  return list.filter(p=>(!kind||p.kind===kind)&&(!level||p.level===level)&&(p.level==='central'||!region||normalizeRegion(p.region)===region))
   .map(program=>({program,match:match(program,topic)})).filter(row=>row.match&&(includeAdjacent||row.match.kind!=='adjacent'))
   .filter(({program:p})=>(!role||p.supportProfile.roleIds.includes(role))&&terms.every(t=>clean([p.title,p.summary,p.support,p.target].join(' ')).includes(t)))
   .sort((a,b)=>(b.match.kind==='sector')-(a.match.kind==='sector')||a.program.id.localeCompare(b.program.id));
 }
 function composition(topic,region,{needed=[],kind='annual',keyword=''}={}){
  const rows=candidates(topic,region,{kind,keyword}).filter(r=>!needed.length||r.program.supportProfile.roleIds.some(id=>needed.includes(id)));
  const levels=Object.fromEntries(['central','sido','gicho'].map(level=>[level,selectDiverse(rows.filter(r=>r.program.level===level),2,needed)]));
  const local=rows.filter(r=>r.program.level!=='central');
  return {rows,levels,coverage:SUPPORT_ROLES.map(role=>({...role,localFound:local.some(r=>r.program.supportProfile.roleIds.includes(role.id)),centralFound:rows.some(r=>r.program.level==='central'&&r.program.supportProfile.roleIds.includes(role.id))}))};
 }
 return {programs,list,match,candidates,composition};
}
