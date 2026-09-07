// Editorial summaries explain source records, not current legal eligibility.
// Keys are individual zones/articles; a shared topic is never a shared permission.
const articleBriefs={
 '30':['외국어 교원·강사와 자율학교','교원 자격과 학교 운영에는 일반 교육법령의 기준이 적용됩니다.','요건을 갖춘 외국어 교원·강사 임용, 교육감 지정을 통한 학교 운영 특례를 둡니다.','대통령령상 외국인 자격과 교육감 지정이 필요합니다. 자율학교 지정은 5년 이내이며 연장은 교육감 기준을 따릅니다.'],
 '34':['지역에 맞춘 광고 기준','광고물의 허가·신고와 표시·설치에는 일반 기준이 적용됩니다.','특화사업 광고의 크기·표시방법·기간과 금지·제한 사항 등을 지역 조례로 달리 정할 수 있습니다.','특구 고시와 해당 조례의 실제 기준을 함께 확인해야 합니다. 개별 광고물의 무허가 설치를 허용하는 뜻은 아닙니다.'],
 '44':['토지이용 절차·밀도 기준','도시·군관리계획 절차와 건폐율·용적률의 일반 한도가 적용됩니다.','일부 의견청취 절차를 함께 처리하고, 정해진 범위 안에서 건폐율·용적률 한도를 조례로 달리 정할 수 있습니다.','세부내용을 특구계획에 포함하고 도시계획위원회 심의 등을 거쳐야 합니다. 적용 제외와 대통령령상 범위가 남습니다.'],
 '51':['박물관·미술관 학예사 공동 배치','박물관·미술관 등록에는 학예사 등 등록요건이 적용됩니다.','특화사업으로 설립·운영하는 박물관·미술관은 학예사를 공동으로 둘 수 있습니다.','공동 배치의 대통령령상 요건을 충족해야 합니다. 모든 등록요건을 면제하는 것은 아닙니다.'],
 '54':['지식산업센터·산업용지','공공 지식산업센터의 분양·임대와 산업용지 분할에는 일반 기준이 적용됩니다.','특화사업을 위해 분양·임대료 하한을 두지 않거나, 건축물 없는 산업용지를 900㎡ 이상으로 분할할 수 있습니다.','각 항목의 적용 대상과 특화사업 필요성을 구분합니다. 모든 공장 입지나 건축을 허용하는 특례가 아닙니다.'],
 '55':['특화사업 관련 특허 우선심사','특허 심사는 일반 절차와 우선심사 대상 기준을 따릅니다.','특화사업과 직접 관련된 특허출원을 다른 출원보다 우선 심사하게 할 수 있습니다.','특화사업과의 직접 관련성이 필요합니다. 등록 보장이나 특허성 심사 면제가 아닙니다.'],
 '56':['환경기술인 공동 임명','환경기술인 선임에는 사업장별 기준과 공동임명 범위가 적용됩니다.','관리기관장이 사업자를 대신해 대기·수질 환경기술인을 임명할 수 있습니다.','공동임명이 허용되는 범위, 같은 산업단지 등의 사업자, 해당 관리기관이라는 조건이 남습니다.'],
 '57':['야외 전시·촬영 가설시설','해당 가설건축물은 일반적으로 허가 절차의 대상입니다.','문화·예술 특구의 야외전시·촬영시설에 해당하는 가설건축물을 신고대상으로 봅니다.','문화·예술 관련 특구와 정해진 시설에 한정됩니다. 모든 가설건축물에 적용하지 않습니다.'],
 '58':['지역형 주택 공급기준','주택 공급에는 주택법상 공급기준이 적용됩니다.','특화사업에 필요한 주택 공급기준을 지역 조례로 달리 정할 수 있습니다.','특별시·광역시와 투기과열지구는 제외됩니다. 해당 조례와 특구계획의 범위를 확인합니다.'],
 '64':['토지이용 관련 결정의 통합 처리','개발·토지이용에는 개별 계획 결정이나 구역 지정 절차가 필요합니다.','승인된 특구토지이용계획의 내용에 따라 법에 열거된 일부 결정·지정을 받은 것으로 봅니다.','승인된 계획에 포함된 범위에 한정됩니다. 개별 토지를 자유롭게 개발할 수 있다는 뜻은 아닙니다.'],
 '66':['체육시설 승인·등록','등록 체육시설업은 일반 승인·등록 체계를 따릅니다.','특구 관할 기초자치단체가 승인·등록을 담당하고, 일부 골프장·스키장은 조건부 등록이 가능합니다.','대통령령상 시설 규모와 나머지 시설의 확보 기한 등 조건이 필요합니다. 안전·시설 기준의 전면 면제가 아닙니다.'],
 '67':['축산물 관련 기준','축산물 위생·시설에는 관련 법령의 일반 기준이 적용됩니다.','이 주제에 연결된 조문의 구체적인 특례 요약은 추가 확인 중입니다.','세포배양식품 실증과 일반 축산물 특례는 서로 다릅니다. 해당 고시·조문 발췌를 확인합니다.'],
 '68':['식품 표시·영업 기준','식품 표시와 식품접객업 영업시간·행위에는 일반 기준이 적용됩니다.','특화사업으로 제조되는 식품의 표시기준 등을 별도로 정하거나 영업시간·행위를 달리 제한할 수 있습니다.','세부사항의 특구계획 반영과 관계기관 사전협의가 필요합니다. 건강기능식품 공유공장 실증과는 별개입니다.']
};
// Original notice excerpts are kept in assets/exemption-evidence.json.
const noticeBriefs={
 'FREE-034:farm-machines':{title:'사람이 타지 않는 농작업을 조건부 실증',before:'완전무인 자율농작업과 다중관제에는 기존 검정기준의 적용과 안전기준 마련이 필요합니다.',after:'검정을 받은 농기계로 비탑승 자율작업을 실증하고, 한 사람이 여러 대를 운용하는 안전기준안을 검증합니다.',conditions:'ISO 18497 안전요건·농업기계 검정을 충족해야 합니다. 무인작업의 이벤트 기록·알림·보존, 원격 감시·개입 등 세부사업별 조건이 남습니다.',audience:'지정 실증사업의 농기계·관제 사업자. 신규 기업의 참여 가능성은 미확인.',period:'2027–2030 시범 운영 계획',place:'전북 김제시 새만금 5공구',question:'무인 농작업의 안전·환경 검토에 어떤 공개자료를 붙일까?',result:'실증 준비용 안전·환경 검토표'},
 'FREE-034:power':{title:'농업용 직류전력의 별도 기준 실증',before:'저압 직류배전·농업용 충전설비에는 일부 검사·운영 기준이 미비합니다.',after:'지정 사업에서 별도 검사기준과 직류 공급·충전 방식을 조건부 실증합니다.',conditions:'공사계획·사용전·정기검사와 적용 가능한 전기설비기준을 지켜야 합니다. 전기차 충전구역 이용은 주차·이용시간 조건이 남습니다.',period:'2027–2030 시범 운영 계획',regional:{'광주·전남':{title:'영농형 태양광의 직류전력 공급 실증',after:'영농형 태양광의 직류전력 생산·공급과 직류배전 설비의 안전기준을 실증합니다.'},'충남':{title:'직류전원으로 전기농기계 충전 실증',after:'직류전원 기반 충전설비와 전기농기계 충전구역 이용을 조건부 실증합니다.'}}},
 'FREE-047:food':{title:'여러 제조업자가 한 생산시설을 공유',before:'건강기능식품 제조시설은 기존 제조업 허가·시설기준에 맞춰 운영해야 합니다.',after:'여러 영업자가 하나의 생산시설을 공유하는 운영방식을 실증합니다. 별도 세부사업으로 미등재 원료 11종의 일반식품 적용을 검증합니다.',conditions:'GMP 제조, 운영자·사용자 책임 기준, 기록·보안 관리와 교차오염 검증이 필요합니다. 두 실증에서 생산한 제품은 유통·판매할 수 없습니다.',audience:'고시상 참여사업자와 지정 실증시설. 공개자료 조회만으로 참여 자격이 생기지 않습니다.',question:'제품·원료·제조 기록을 어떻게 대조할까?',result:'공유시설 제조·품질 기록의 설계안'},
 'FREE-001:clinical':{title:'참여자의 자택까지 확장하는 임상시험',before:'기존 임상·의료 체계에서 비대면 임상과 자택 의료행위에는 제약이 있습니다.',after:'단계별 분산형 임상과 임상용 허가 의약품의 의료인·약사 직접 전달, 정해진 대상의 자택·원격진료를 실증합니다.',conditions:'허가된 의약품부터 시작합니다. 미허가 의약품 확대는 안전성·유효성 입증 또는 제도 변화 후 관계부처 협의가 필요합니다. 디지털의료제품 인허가·임상승인은 유지됩니다.',audience:'특구사업자 의료기관과 특구 내 해당 환자, 실증특례 기간에 한정.',question:'임상 수행기관과 시험 정보를 어떻게 탐색할까?',result:'분산형 임상 협력기관 탐색안'},
 'FREE-057:regenerative':{title:'중·저위험 재생의료의 특구 심의체계',before:'첨단재생의료 임상연구의 심의·안전관리와 세포처리는 법정 체계를 따릅니다.',after:'특구 임상연구 심의위원회·안전관리기관 설치와 지정 공공용 세포처리시설의 외부인력 참여를 허용합니다.',conditions:'심의범위는 중·저위험 임상연구입니다. 외부인력은 지정 시설 관리자의 관리·감독 아래 참여합니다. 고위험 연구 전체를 허용하는 특례가 아닙니다.'},
 'FREE-015:livestock':{title:'세포배양식품을 위한 소 세포 채취',before:'살아 있는 소의 세포·조직 채취와 도축 후 등급판정에는 동물보호·축산 기준이 적용됩니다.',after:'생검을 통한 세포·조직 채취와 정해진 도체의 등급판정 제외를 실증합니다.',conditions:'동물실험윤리위원회 심의·보고가 필요합니다. 참여 도축장에 한정하며, 세포 추출을 위해 반출한 생육의 유통·판매는 금지됩니다.'},
 'FREE-027:space':{title:'우주용 고압가스 부품의 실증 기준 마련',before:'우주용 용기·설비의 제조와 사용에도 일반 고압가스 기준이 적용됩니다.',after:'우주항공부품의 특성·목적을 고려한 실증안전기준을 마련해 제조·사용을 실증합니다.',conditions:'제조등록·검사 등 안전관리와 타법 인허가는 유지됩니다. 안전성평가·안전위원회 검증 및 한국가스안전공사 보고·승인 요청이 필요합니다.'},
 'FREE-038:gas-port':{title:'탱크로리에서 선박으로 암모니아 충전',before:'탱크로리의 암모니아를 선박에 직접 충전하는 방식은 안전문제로 단계별 검증이 필요합니다.',after:'고정식 저장설비의 1단계 실증을 검증한 뒤 탱크로리 1대의 이동식 충전을 실증합니다.',conditions:'안전위원회 결정, 고압가스 인허가·검사, 안전성평가와 안전관리계획이 필요합니다. 실증 전·중·후 검증 결과를 한국가스안전공사에 보고·승인 요청합니다.'}
};
const gangwon={title:'원격 건강관리·현장 엑스선 실증',before:'지정 당시 개요는 의사–환자 간 원격의료 제한과 의료기관 밖 엑스선의 안전기준 부재를 문제로 들었습니다.',after:'제한된 대상·방식의 건강관리·원격 모니터링과 의료기관 밖 이동형 엑스선 사용을 실증했습니다.',conditions:'진단·처방 허용 여부는 세부사업마다 다릅니다. 허용 사업에도 간호사 입회 등 조건이 있습니다. 엑스선은 보호장비와 정해진 전문인력·원격 협진 조건을 따릅니다.',audience:'춘천·원주·철원 등 지정 대상과 참여 의료기관·기업. 일반 원격진료 허용이 아닙니다.',period:'공식 개요의 지정기간 2019.08–2023.08 · 이후 효력 미확인',source:'https://rfz.go.kr/?menuno=220',sourceTitle:'중기부 강원 디지털헬스케어 지정 당시 개요',question:'허가된 의료기기와 협력 의료기관을 어떻게 찾을까?',result:'기기·안전정보·협력기관 비교안'};

export function regulationCards(atlas,evidence,topic,region){
 const records=evidence.records||[];
 const cards=[];
 for(const z of atlas.zones.filter(z=>(!region||z.regions.includes(region)))){
  for(const l of z.links.filter(l=>l.topic===topic.id&&(!region||!l.regions||l.regions.includes(region)))){
   const raw=records.find(r=>r.zone===z.id&&r.topic===topic.id&&r.url===l.url&&r.label===l.label);
   const article=l.label.match(/지역특구법 제(\d+)조/)?.[1];
   const parts=article&&articleBriefs[article];
   const authored=noticeBriefs[z.id+':'+topic.id];
   const overview=z.id==='FREE-002'&&topic.id==='medical-devices'?gangwon:(evidence.portals||[]).find(p=>p.zone===z.id);
   const brief=overview||authored&&{...authored,...authored.regional?.[region]}||parts&&{title:parts[0],before:parts[1],after:parts[2],conditions:parts[3]};
   cards.push({
    id:z.id+':'+(article||topic.id),zone:z.id,zoneName:z.name,region:region||z.regions.join('·'),article,
    title:brief?.title||l.label,
    before:brief?.before||'이 자료에는 기존 제한의 구체적인 문언이 정리되지 않았습니다.',
    after:brief?.after||('공식 사업개요에 수록된 실증: '+l.label+'. 상세 허용 범위는 미확인입니다.'),
    conditions:brief?.conditions||'개별 허용·면제 사항과 부대조건을 추가 확인해야 합니다. 주제명이 같아도 다른 지역의 특례를 적용하지 않습니다.',
    audience:brief?.audience||(article?'해당 고시·특구계획에 연결된 특화사업. 조문이 지역 전체에 일괄 적용되지는 않습니다.':'고시·개요에 지정된 실증사업자와 승인 구역. 신규 참여 자격 미확인.'),
    period:brief?.period||z.schedule||'현재 유효기간·연장 이력 미확인',
    place:brief?.place,question:brief?.question,result:brief?.result,
    level:overview?'overview':raw&&brief?'notice':'partial',
    source:brief?.source||l.lawUrl||l.url,sourceTitle:brief?.sourceTitle||(article?l.label:'특례 고시 원문'),noticeURL:l.url,
    excerpt:raw?.excerpt||overview?.excerpt||'',date:overview?(overview.checkedAt||'2026-09-07 개요 확인'):l.date,
    status:z.sourceStatus?(typeof z.sourceStatus==='string'?z.sourceStatus:z.sourceStatus.label+' · '+z.sourceStatus.detail):'현재 효력·신규 참여 미확인'
   });
  }
 }
 return cards.sort((a,b)=>(a.level==='partial')-(b.level==='partial')||(a.article?1:0)-(b.article?1:0));
}

const systemField=/^(item|items|body|header|result|결과|페이지|한 페이지|전체 결과|전체결과|리스트 항목|목록|데이터 타입|데이터 총)/i;
const fieldPriorities={
 '15084084':['예보지점 X 좌표','예보지점 Y 좌표','예보시각','예보 값','자료구분코드'],
 '15001698':['병원명','종별코드명','시군구코드','주소','암호화된 요양기호'],
 '15057456':['품목명','의료기기품목허가번호','등급','사용목적','업체명'],
 '15056785':['품목명','의료기기품목일련번호','LOT-NO제조번호','회수대상량','회수폐기보고명'],
 '15056760':['제품명','품목제조관리번호','주된기능성','기준규격','업체명'],
 '15002002':['사고유형','내용','농기계안전정보첨부파일url']
};
export function usefulFields(dataset){
 const fields=[...new Set((dataset.fields||'').split(/[,，\n]/).map(v=>v.trim()).filter(v=>v&&!systemField.test(v)&&!/^\d+$/.test(v)))];
 const first=(fieldPriorities[dataset.id]||[]).filter(v=>fields.includes(v));
 return [...first,...fields.filter(v=>!first.includes(v))].slice(0,5);
}
export function orderedRecommendations(topic,region){
 const pool=topic.recommendations.filter(r=>!region||!r.regions||r.regions.includes(region));
 const primary=pool.filter(r=>topic.primary?.includes(r.id));
 const chosen=[...primary];
 const groups=new Set(chosen.map(r=>r.group));
 for(const r of pool){if(chosen.length>=Math.min(4,pool.length))break;if(!chosen.includes(r)&&!groups.has(r.group)&&!r.role?.startsWith('인접')){chosen.push(r);groups.add(r.group)}}
 for(const r of pool){if(chosen.length>=Math.min(3,pool.length))break;if(!chosen.includes(r)&&!r.role?.startsWith('인접'))chosen.push(r)}
 return [...chosen,...pool.filter(r=>!chosen.includes(r))].map((r,i)=>({...r,core:chosen.includes(r),rank:i+1,group:r.group||'활용 참고'}));
}

const dataQuestions={
 '15101371':'어떤 사고 상황을 작업 전 확인 목록에 넣을까?',
 '15002002':'작업자에게 어떤 안전정보를 안내할까?',
 '15084084':'어느 시간·격자의 예보를 작업 일정 옆에 보여줄까?',
 '15057456':'어떤 기기가 어떤 용도로 허가되어 있을까?',
 '15056785':'검토 중인 기기의 회수 기록이 있을까?',
 '15001698':'어느 지역에 어떤 종류의 협력기관 후보가 있을까?',
 '15056760':'제품의 기능성·규격·주의사항을 어떻게 비교할까?',
 '15076352':'기존 충전기의 위치·종류·운영상태는 어떨까?',
 '15012896':'후보 장소 주변의 주차·체류 조건은 어떨까?',
 '15155516':'가까운 관측소의 해상 환경은 어떨까?'
};
const reviewedJoins={
 '15084084':'예보 격자 X·Y와 발표·예보 시각. 현장 위치를 예보 격자로 변환해야 하며 자동 결합은 미검증입니다.',
 '15001698':'시군구코드·좌표로 지역을 대조합니다. 암호화 요양기호를 다른 기관의 식별자와 동일시하지 않습니다.',
 '15057456':'품목허가번호·품목일련번호의 제공 여부를 상대 자료와 대조합니다. 실제 매칭률은 미검증입니다.',
 '15056785':'품목일련번호·모델명·제조번호 등 식별 수준을 구분해야 합니다. 허가자료와의 실제 조인은 미검증입니다.'
};
export function dataBrief(dataset,recommendation){
 const fields=usefulFields(dataset);
 return {fields,question:dataQuestions[dataset.id]||recommendation?.why||'이 자료의 제공 항목과 이용 범위를 확인하세요.',
  summary:fields.length?fields.slice(0,3).join(' · ')+' 등을 담은 '+dataset.kind+' 목록입니다.':(recommendation?.why||dataset.short+'의 목록 메타정보입니다.'),
  join:reviewedJoins[dataset.id]||(recommendation?.join&&recommendation.join!=='식별자·지역·기준일 대조'?recommendation.join+' · 실제 결합 미검증':'자료 간 결합 키를 아직 검증하지 않았습니다. 참고자료의 병렬 검토와 행 단위 조인은 다릅니다.'),
  group:recommendation?.group||'자료 참고',core:recommendation?.core||false};
}
