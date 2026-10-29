// Adds an "업무흐름도" button to the law.go.kr toolbar and a "흐름" chip next to each
// article that a korea100 flow cites. Runs inside the law body frame (lsInfoP.do) as an
// extension content script, or as a plain <script> on a page that sets
// window.K100_FLOW_BASE (demo copies of the law page).
(async () => {
  const lawId = document.getElementById("lsId")?.value;
  if (!lawId) return;

  const reply = await loadIndex();
  if (!reply?.ok) {
    console.info("[업무흐름도] 목록을 불러오지 못했습니다:", reply?.error);
    return;
  }
  const law = reply.index.laws?.[lawId];
  if (!law) return; // no flow for this law: show nothing

  const open = (query = "") =>
    window.open(
      `${reply.base}/embed/flow/${lawId}/${query}`,
      "korea100-flow",
      "width=1440,height=900,scrollbars=yes,resizable=yes"
    );

  // Toolbar button, styled like its neighbours, right after 법령체계도.
  const anchor = [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "법령체계도");
  if (anchor && !document.querySelector("[data-k100-flow='law']")) {
    const button = anchor.cloneNode(true);
    button.textContent = "업무흐름도";
    button.removeAttribute("onclick");
    button.removeAttribute("id");
    button.removeAttribute("target");
    button.href = "#";
    button.title = `이 법령을 근거로 하는 업무 ${law.flows}개의 흐름도 (대한민국 제도 지도)`;
    button.dataset.k100Flow = "law";
    button.style.cssText = "background:#087452 !important;border-color:#087452 !important;color:#fff !important;font-weight:700";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      open();
    });
    anchor.after(button);
  }

  // Per-article chip next to the 판례/연혁 icons. The article number comes from the
  // heading label ("제32조(승진임용의 제한)"), which both the live site and copies keep.
  for (const group of document.querySelectorAll("div.pgroup")) {
    const icons = group.querySelector(":scope > ul.lawico01");
    const heading = group.querySelector(".lawcon span.bl label")?.textContent.trim() ?? "";
    const match = heading.match(/^제(\d+)조(?:의(\d+))?/);
    if (!icons || !match || icons.querySelector("[data-k100-flow]")) continue;
    const no = Number.parseInt(match[1], 10);
    const branch = Number.parseInt(match[2] ?? "0", 10);
    const label = branch > 0 ? `제${no}조의${branch}` : `제${no}조`;
    const count = law.articles[label];
    if (!count) continue;

    const item = document.createElement("li");
    const chip = document.createElement("a");
    chip.href = "#";
    chip.dataset.k100Flow = label;
    chip.title = `${label}을 근거로 하는 업무 ${count}개의 흐름도`;
    chip.textContent = "흐름";
    chip.style.cssText =
      "display:inline-block;padding:0 3px;border:1px solid #087452;border-radius:3px;background:#effaf5;color:#087452;font-size:11px;font-weight:700;line-height:15px;text-decoration:none";
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      open(`?jo=${String(no).padStart(4, "0")}&br=${String(branch).padStart(2, "0")}`);
    });
    item.append(chip);
    icons.append(item);
  }

  async function loadIndex() {
    if (globalThis.chrome?.runtime?.id) return chrome.runtime.sendMessage({ type: "flow-index" });
    // Plain-script mode: the index must be readable from this origin (same origin or CORS).
    const base = window.K100_FLOW_BASE ?? "/lawdemo/flow";
    const url = window.K100_FLOW_INDEX_URL ?? `${base}/embed/flow/index.json`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { ok: true, base, index: await response.json() };
    } catch (error) {
      return { ok: false, base, error: String(error) };
    }
  }
})();
