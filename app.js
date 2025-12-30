(() => {
  const keywords = {
    "TMflow應用問題": ["tmflow", "flow", "應用", "流程", "app", "專案"],
    "視覺功能問題": ["vision", "視覺", "影像", "camera", "辨識", "barcode", "ocr"],
    "通訊問題": ["連線", "通訊", "ip", "網路", "ethernet", "modbus", "tcp", "mqtt"],
    "硬體/機構": ["硬體", "機構", "馬達", "夾爪", "sensor", "電源", "board"],
    "設定/流程": ["設定", "config", "校正", "校準", "update", "韌體", "license"],
    "其他": []
  };

  const form = document.getElementById("issue-form");
  const textInput = document.getElementById("issue-text");
  const fileInput = document.getElementById("issue-files");
  const categorySelect = document.getElementById("issue-category");
  const customCategory = document.getElementById("custom-category");
  const listEl = document.getElementById("issue-list");
  const statusEl = document.getElementById("status");
  const filterEl = document.getElementById("category-filter");
  const exportBtn = document.getElementById("export-json");
  const exportExcelBtn = document.getElementById("export-excel");
  const resetBtn = document.getElementById("reset-data");

  let chart;
  const issues = [];
  let activeFilter = "全部";
  let syncTimer = null;

  const API_BASE = `${window.location.origin}/api`;

  function safeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function detectCategory(text) {
    if (!text) return "其他";
    const lower = text.toLowerCase();
    let bestMatch = "其他";
    let bestScore = 0;

    Object.entries(keywords).forEach(([cat, words]) => {
      let score = 0;
      words.forEach((w) => {
        if (lower.includes(w.toLowerCase())) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = cat;
      }
    });

    return bestMatch;
  }

  function formatDate(date) {
    return date.toLocaleString("zh-TW", { hour12: false });
  }

  function renderList() {
    const filtered =
      activeFilter === "全部"
        ? issues
        : issues.filter((i) => i.category === activeFilter);

    if (!filtered.length) {
      listEl.classList.add("empty");
      listEl.textContent = "尚未新增事件";
      return;
    }

    listEl.classList.remove("empty");
    listEl.innerHTML = "";

    filtered
      .slice()
      .reverse()
      .forEach((issue) => {
        const row = document.createElement("div");
        row.className = "issue";

        const thumb = document.createElement("img");
        thumb.className = "thumb";
        thumb.alt = "screenshot";
        thumb.src = issue.imageData || "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
        row.appendChild(thumb);

        const meta = document.createElement("div");
        meta.className = "meta";

        const badge = document.createElement("div");
        badge.className = "category";
        badge.textContent = issue.category;

        const desc = document.createElement("p");
        desc.className = "desc";
        desc.textContent = issue.text || "(無文字描述)";

        const time = document.createElement("time");
        time.textContent = formatDate(new Date(issue.createdAt));

        meta.appendChild(badge);
        meta.appendChild(desc);
        meta.appendChild(time);
        row.appendChild(meta);

        listEl.appendChild(row);
      });
  }

  function renderChart() {
    if (typeof window.Chart === "undefined") {
      // Chart.js 未載入時，僅更新列表，不拋錯
      return;
    }

    const counts = Object.keys(keywords).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    issues.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });

    const sortedEntries = Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    );
    const labels = sortedEntries.map(([label]) => label);
    const data = sortedEntries.map(([, value]) => value);

    if (!chart) {
      const ctx = document.getElementById("category-chart").getContext("2d");
      chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "事件數",
              data,
              backgroundColor: "#2563eb",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { mode: "index" }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
    }
  }

  function addIssue(payload) {
    issues.push({
      id: safeId(),
      createdAt: new Date().toISOString(),
      ...payload
    });
    renderList();
    renderChart();
    scheduleSync();
  }

  function resetForm() {
    textInput.value = "";
    fileInput.value = "";
    categorySelect.value = "auto";
    customCategory.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    statusEl.textContent = "";

    const text = textInput.value.trim();
    const selected = categorySelect.value;
    const custom = customCategory.value.trim();

    if (!text && !fileInput.files.length) {
      statusEl.textContent = "請至少提供文字或圖片";
      return;
    }

    const category =
      custom ||
      (selected === "auto" ? detectCategory(text) : selected) ||
      "其他";

    const files = Array.from(fileInput.files);

    if (files.length === 0) {
      addIssue({ text, category, imageData: null });
      resetForm();
      statusEl.textContent = "已建立事件（文字）";
      return;
    }

    statusEl.textContent = "正在處理圖片…";

    const readFileAsDataUrl = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await readFileAsDataUrl(file);
      addIssue({
        text,
        category,
        imageData: dataUrl
      });
    }

    resetForm();
    statusEl.textContent = `已建立 ${files.length} 筆事件`;
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(issues, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetData() {
    issues.length = 0;
    renderList();
    renderChart();
    statusEl.textContent = "資料已清空";
    scheduleSync(true);
  }

  function seedDemoData() {
    if (issues.length) return;

    const demo = [
      {
        text: "TMflow 專案下載到控制器後無法執行，顯示流程錯誤。",
        category: "TMflow應用問題"
      },
      {
        text: "相機拍攝時偶爾無法辨識 QR code，視覺結果不穩定。",
        category: "視覺功能問題"
      },
      {
        text: "客戶反映透過 Modbus TCP 連線會間斷中斷，需要重連。",
        category: "通訊問題"
      },
      {
        text: "手臂 Z 軸偶爾發出異音，停止後電源指示燈閃爍。",
        category: "硬體/機構"
      },
      {
        text: "新客戶不知道怎麼做安全區設定與權限管理，希望有教育訓練。",
        category: "設定/流程"
      }
    ];

    demo.forEach((d) => {
      addIssue({
        text: d.text,
        category: d.category,
        imageData: null
      });
    });
  }

  function scheduleSync(clear = false) {
    if (!window.fetch) return;
    if (syncTimer) window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => {
      const payload = clear ? [] : issues;
      fetch(`${API_BASE}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {
        // 靜默失敗：若沒啟動 server，前端依然可以單機使用
      });
    }, 400);
  }

  function loadFromServer() {
    if (!window.fetch) {
      seedDemoData();
      renderFilterChips();
      renderChart();
      renderList();
      return;
    }

    fetch(`${API_BASE}/issues`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          data.forEach((i) => issues.push(i));
        } else {
          seedDemoData();
        }
      })
      .catch(() => {
        seedDemoData();
      })
      .finally(() => {
        renderFilterChips();
        renderChart();
        renderList();
      });
  }

  function renderFilterChips() {
    const cats = ["全部", ...Object.keys(keywords)];
    filterEl.innerHTML = "";
    cats.forEach((c) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (c === activeFilter ? " active" : "");
      chip.textContent = c;
      chip.addEventListener("click", () => {
        activeFilter = c;
        renderFilterChips();
        renderList();
      });
      filterEl.appendChild(chip);
    });
  }

  function buildSummaryCounts() {
    const map = {};
    issues.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  }

  function exportExcel() {
    if (typeof XLSX === "undefined") {
      alert("找不到 Excel 匯出元件（XLSX），請確認網路可存取 CDN。");
      return;
    }

    if (!issues.length) {
      alert("目前沒有任何事件可匯出。");
      return;
    }

    const issueRows = issues.map((i, idx) => ({
      編號: idx + 1,
      建立時間: formatDate(new Date(i.createdAt)),
      問題類型: i.category,
      問題描述: i.text
    }));

    const summaryRows = buildSummaryCounts().map((r, idx) => ({
      排名: idx + 1,
      問題類型: r.category,
      數量: r.count
    }));

    const wb = XLSX.utils.book_new();
    const sheetIssues = XLSX.utils.json_to_sheet(issueRows);
    const sheetSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, sheetIssues, "問題列表");
    XLSX.utils.book_append_sheet(wb, sheetSummary, "分類統計");

    const filename = `issues-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  form.addEventListener("submit", handleSubmit);
  exportBtn.addEventListener("click", exportJson);
  exportExcelBtn.addEventListener("click", exportExcel);
  resetBtn.addEventListener("click", resetData);

  loadFromServer();
})(); 

