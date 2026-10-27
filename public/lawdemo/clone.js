/* 클론 데모 검색 연동: 메인 검색어를 클론에 있는 법령 페이지로 보낸다. */
(function () {
  // 클론에 있는 법령 목록은 build-laws.py가 /k100/clone-laws.json으로 내보낸다.
  var LAWS = [];
  fetch('/lawdemo/k100/clone-laws.json')
    .then(function (r) { return r.json(); })
    .then(function (list) { LAWS = list.map(function (law) { return law.name; }); })
    .catch(function () { LAWS = ['공무원임용령']; });
  var squash = function (s) { return s.replace(/\s+/g, ''); };
  var pageOf = function (name) { return '/lawdemo/법령/' + squash(name) + '/'; };

  function go() {
    var el = document.getElementById('query');
    var q = el ? el.value.trim() : '';
    if (!q) {
      alert('검색어를 입력하세요.');
      return;
    }
    var key = squash(q);
    var exact = LAWS.filter(function (name) { return squash(name) === key; });
    var hits = exact.length ? exact : LAWS.filter(function (name) { return squash(name).indexOf(key) !== -1; });
    // 하나로 좁혀지면 그 법령으로, 여럿이거나 없으면 목록에서 고르게 한다.
    location.href = hits.length === 1 ? pageOf(hits[0]) : '/lawdemo/법령/?q=' + encodeURIComponent(q);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.srchBtn')) { e.preventDefault(); go(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'query') { e.preventDefault(); go(); }
  });
})();
