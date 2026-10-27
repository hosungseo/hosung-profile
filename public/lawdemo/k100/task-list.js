// 시연판의 "업무흐름도 제도 목록" 팝업. 메인에서는 자동으로 열리고(data-autoopen),
// 모든 페이지 왼쪽 아래 버튼과 [data-k100-open-tasks] 요소로 다시 연다.
// 경로 기준은 이 스크립트 주소에서 읽는다: /k100/task-list.js → "", /lawdemo/k100/task-list.js → "/lawdemo".
(() => {
  const script = document.currentScript;
  const base = new URL(script.src).pathname.replace(/\/k100\/task-list\.js$/, "");
  const flowBase = window.K100_FLOW_BASE ?? "http://localhost:3123";
  const indexUrl = window.K100_FLOW_INDEX_URL ?? `${base}/k100/index.json`;
  const HIDE_KEY = "k100-task-list-hide-until";
  const GROUP_ORDER = ["국가공무원", "지방공무원", "예산·재정", "조직"];
  const squash = (s) => s.replace(/\s+/g, "");

  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
    },
  };

  let dataPromise = null;
  function loadData() {
    dataPromise ??= Promise.all([
      fetch(indexUrl, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${base}/k100/clone-laws.json`).then((r) => r.json()),
    ]).then(([index, cloneLaws]) => {
      const lawById = new Map(cloneLaws.map((law) => [law.lawId, law]));
      const groups = new Map(GROUP_ORDER.map((g) => [g, []]));
      for (const task of index.tasks ?? []) {
        // 시연판에 있는 법령으로만 연다: 주 근거가 없으면 다른 근거 법령 중 첫 번째
        const lawId = lawById.has(task.lawId) ? task.lawId : task.lawIds.find((id) => lawById.has(id));
        if (!lawId) continue;
        const law = lawById.get(lawId);
        if (!groups.has(law.group)) groups.set(law.group, []);
        groups.get(law.group).push({ ...task, lawId, lawName: law.name });
      }
      return groups;
    });
    return dataPromise;
  }

  const css = `
#k100Tasks{position:fixed;inset:0;z-index:2147483100;display:flex;align-items:flex-start;justify-content:center;padding:56px 16px 16px;background:rgba(10,20,15,.45);font:14px/1.5 -apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#17231d}
#k100Tasks[hidden]{display:none}
#k100Tasks .box{width:min(920px,100%);max-height:calc(100vh - 80px);display:flex;flex-direction:column;background:#fff;border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.3);overflow:hidden}
#k100Tasks .bar{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:linear-gradient(#3d8fe0,#2370c9);color:#fff}
#k100Tasks .bar b{font-size:16px} #k100Tasks .bar button{border:0;background:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}
#k100Tasks .intro{padding:12px 18px 0;color:#3d4a43}
#k100Tasks .search{margin:10px 18px 4px;padding:9px 12px;border:1px solid #c8d4cd;border-radius:8px;font:inherit}
#k100Tasks .list{overflow:auto;padding:4px 18px 14px}
#k100Tasks h3{margin:14px 0 6px;font-size:14px;color:#2370c9}
#k100Tasks h3 span{color:#7a8780;font-weight:600}
#k100Tasks ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px;margin:0;padding:0;list-style:none}
#k100Tasks li{display:flex;flex-direction:column;gap:4px;padding:9px 11px;border:1px solid #dfe6e2;border-radius:8px}
#k100Tasks li[hidden]{display:none}
#k100Tasks li b{font-size:14px} #k100Tasks li small{color:#627169;font-size:12px}
#k100Tasks .acts{display:flex;gap:6px;margin-top:2px}
#k100Tasks .acts a{padding:3px 9px;border:1px solid #087452;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;color:#087452}
#k100Tasks .acts a.flow{background:#087452;color:#fff}
#k100Tasks .foot{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-top:1px solid #e3e9e5;background:#f7faf8;font-size:13px}
#k100Tasks .foot button{padding:6px 14px;border:1px solid #9db0a6;border-radius:6px;background:#fff;font:inherit;cursor:pointer}
#k100TasksOpen{position:fixed;left:14px;bottom:14px;z-index:2147483050;padding:9px 14px;border:0;border-radius:999px;background:#087452;color:#fff;font:700 13px/1 -apple-system,"Apple SD Gothic Neo",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer}
@media print{#k100Tasks,#k100TasksOpen{display:none!important}}`;

  let root = null;
  async function render() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    root = document.createElement("div");
    root.id = "k100Tasks";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "업무흐름도 제도 목록");
    root.innerHTML = `<div class="box">
      <div class="bar"><b>업무흐름도 제도 목록</b><button type="button" data-close aria-label="닫기">✕</button></div>
      <p class="intro">이 시연판에서 업무흐름도를 볼 수 있는 제도입니다. <b>흐름도</b>를 누르면 업무 절차가, <b>근거 법령</b>을 누르면 법령 본문이 열립니다.</p>
      <input class="search" type="search" placeholder="제도·법령 이름으로 찾기" aria-label="제도 찾기">
      <div class="list" aria-live="polite">불러오는 중…</div>
      <div class="foot"><label><input type="checkbox" data-today> 오늘 하루 보지 않기</label><button type="button" data-close>닫기</button></div>
    </div>`;
    document.body.append(root);

    root.addEventListener("click", (event) => {
      if (event.target === root || event.target.closest("[data-close]")) close();
      const flow = event.target.closest("a[data-flow]");
      if (flow) {
        event.preventDefault();
        window.open(flow.href, "korea100-flow", "width=1440,height=900,scrollbars=yes,resizable=yes");
      }
    });
    root.querySelector(".search").addEventListener("input", (event) => filter(event.target.value));

    try {
      const groups = await loadData();
      const total = [...groups.values()].reduce((sum, items) => sum + items.length, 0);
      root.querySelector(".bar b").textContent = `업무흐름도 제도 목록 · ${total}개`;
      root.querySelector(".list").innerHTML = [...groups]
        .filter(([, items]) => items.length)
        .map(([group, items]) => `<section><h3>${group} <span>${items.length}</span></h3><ul>${items
          .map((task) => `<li data-key="${squash(task.name + task.lawName)}">
            <b>${task.name}</b>
            <small>근거: ${task.lawName} · ${task.citingSteps}/${task.totalSteps}단계</small>
            <div class="acts">
              <a class="flow" data-flow href="${flowBase}/embed/flow/${task.lawId}/${task.slug}/">흐름도</a>
              <a href="${base}/법령/${squash(task.lawName)}/">근거 법령</a>
            </div></li>`)
          .join("")}</ul></section>`)
        .join("");
    } catch (error) {
      root.querySelector(".list").textContent = "제도 목록을 불러오지 못했습니다.";
      console.info("[제도 목록]", error);
    }
  }

  function filter(query) {
    const key = squash(query);
    for (const li of root.querySelectorAll("li")) li.hidden = Boolean(key) && !li.dataset.key.includes(key);
    for (const section of root.querySelectorAll("section")) {
      section.hidden = !section.querySelector("li:not([hidden])");
    }
  }

  async function open() {
    if (!root) await render();
    root.hidden = false;
    root.querySelector(".search").focus();
  }

  function close() {
    if (!root) return;
    if (root.querySelector("[data-today]").checked) {
      storage.set(HIDE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    }
    root.hidden = true;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root && !root.hidden) close();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-k100-open-tasks]")) {
      event.preventDefault();
      open();
    }
  });

  const opener = document.createElement("button");
  opener.id = "k100TasksOpen";
  opener.type = "button";
  opener.textContent = "제도 목록";
  opener.addEventListener("click", open);
  document.body.append(opener);

  const hiddenUntil = Number(storage.get(HIDE_KEY) ?? 0);
  if (script.dataset.autoopen && Date.now() > hiddenUntil) open();
})();
