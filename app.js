(() => {
  const keywords = {
    "視覺功能": ["vision", "視覺", "影像", "camera", "辨識", "barcode", "ocr", "視覺功能", "視覺系統", "相機", "拍照", "識別"],
    "通訊相關": ["連線", "通訊", "ip", "網路", "ethernet", "modbus", "tcp", "mqtt", "通訊", "連接", "連線", "通訊協定", "通訊協議"],
    "運動與力矩": ["運動", "力矩", "馬達", "motor", "torque", "速度", "加速度", "減速", "運動控制", "位置", "軌跡"],
    "安全與法規": ["安全", "法規", "safety", "安全區", "安全設定", "權限", "法規", "合規", "安全標準"],
    "邏輯編程與調試難度": ["編程", "程式", "programming", "調試", "debug", "邏輯", "流程", "tmflow", "flow", "應用", "專案", "程式設計", "除錯"],
    "安裝、校正與維護": ["安裝", "校正", "校準", "calibration", "維護", "maintenance", "設定", "config", "韌體", "firmware"],
    "周邊整合 (I/O & Gripper等)": ["i/o", "io", "gripper", "夾爪", "sensor", "感測器", "周邊", "整合", "外設", "周邊設備", "輸入輸出"],
    "系統升級與備份": ["系統", "升級", "update", "備份", "backup", "還原", "restore", "系統更新", "版本", "version", "更新", "升級系統"],
    "其他": []
  };

  const form = document.getElementById("issue-form");
  const customerInput = document.getElementById("issue-customer");
  const textInput = document.getElementById("issue-text");
  const fileInput = document.getElementById("issue-files");
  const categorySelect = document.getElementById("issue-category");
  const customCategory = document.getElementById("custom-category");
  const listEl = document.getElementById("issue-list");
  const statusEl = document.getElementById("status");
  const filterEl = document.getElementById("category-filter");
  const imageModal = document.getElementById("image-modal");
  const imageModalImg = document.getElementById("image-modal-img");
  const imageModalClose = document.getElementById("image-modal-close");
  const imageModalPrev = document.getElementById("image-modal-prev");
  const imageModalNext = document.getElementById("image-modal-next");
  const imageModalCounter = document.getElementById("image-modal-counter");
  const fileDropZone = document.getElementById("file-drop-zone");
  const filePreview = document.getElementById("file-preview");
  
  let currentImageIndex = 0;
  let currentImageList = [];
  const exportExcelBtn = document.getElementById("export-excel");

  let chart;
  const issues = [];
  let activeFilter = "全部";
  let syncTimer = null;
  let customCategories = new Set(); // 儲存自訂分類
  let isAdmin = false; // 管理員狀態

  const API_BASE = `${window.location.origin}/api`;
  
  // 管理員相關元素
  const adminLoginBtn = document.getElementById("admin-login-btn");
  const adminLoginModal = document.getElementById("admin-login-modal");
  const adminLoginClose = document.getElementById("admin-login-close");
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminPasswordInput = document.getElementById("admin-password");
  const adminLoginStatus = document.getElementById("admin-login-status");
  const adminLogoutSection = document.getElementById("admin-logout-section");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  
  // 管理員密碼（預設為 "aadmin"，可在實際部署時修改）
  const ADMIN_PASSWORD = "aadmin";

  // 清理舊分類（測試2 和 TMflow應用問題）
  function cleanupOldCategories() {
    const oldCategories = ["測試2", "TMflow應用問題"];
    let hasChanges = false;
    
    // 將使用舊分類的事件轉移到「其他」
    issues.forEach((issue) => {
      if (oldCategories.includes(issue.category)) {
        issue.category = "其他";
        hasChanges = true;
      }
    });
    
    // 從自訂分類中移除舊分類
    oldCategories.forEach((oldCat) => {
      if (customCategories.has(oldCat)) {
        customCategories.delete(oldCat);
        hasChanges = true;
      }
    });
    
    // 如果有變更，保存數據
    if (hasChanges) {
      saveCustomCategories();
      saveToLocalStorage();
      scheduleSync();
    }
  }

  // 載入自訂分類
  function loadCustomCategories() {
    try {
      const stored = localStorage.getItem("customer-custom-categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          customCategories = new Set(parsed);
        }
      }
    } catch (err) {
      // 忽略錯誤
    }
    // 從現有事件中提取自訂分類
    issues.forEach((issue) => {
      if (!Object.keys(keywords).includes(issue.category)) {
        customCategories.add(issue.category);
      }
    });
    // 清理舊分類
    cleanupOldCategories();
    saveCustomCategories();
  }

  // 儲存自訂分類
  function saveCustomCategories() {
    try {
      localStorage.setItem("customer-custom-categories", JSON.stringify(Array.from(customCategories)));
    } catch (err) {
      // 忽略錯誤
    }
  }

  // 取得所有分類（預設 + 自訂）
  function getAllCategories() {
    return [...Object.keys(keywords), ...Array.from(customCategories)];
  }

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
    // 確保清理舊分類（在顯示前檢查）
    cleanupOldCategories();
    
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

        // 支援多圖顯示
        const imageList = issue.imageDataArray || (issue.imageData ? [issue.imageData] : []);
        if (imageList.length > 0) {
          const thumbContainer = document.createElement("div");
          thumbContainer.className = "thumb-container";
          thumbContainer.style.display = "flex";
          thumbContainer.style.gap = "4px";
          thumbContainer.style.flexWrap = "wrap";
          
          imageList.forEach((imgData, idx) => {
            const thumb = document.createElement("img");
            thumb.className = "thumb";
            thumb.alt = `screenshot ${idx + 1}`;
            thumb.src = imgData;
            thumb.style.cursor = "zoom-in";
            thumb.style.width = imageList.length > 1 ? "56px" : "60px";
            thumb.style.height = imageList.length > 1 ? "56px" : "60px";
            thumb.title = imageList.length > 1 ? `圖片 ${idx + 1}/${imageList.length}` : "點擊放大";
            thumb.addEventListener("click", () => {
              currentImageList = imageList;
              currentImageIndex = idx;
              showImageModal();
            });
            thumbContainer.appendChild(thumb);
          });
          
          row.appendChild(thumbContainer);
        }

        const meta = document.createElement("div");
        meta.className = "meta";

        const badgeContainer = document.createElement("div");
        badgeContainer.style.position = "relative";
        badgeContainer.style.display = "inline-block";
        
        const badge = document.createElement("div");
        badge.className = "category editable-category";
        badge.textContent = issue.category;
        badge.title = "點擊以更改問題類型";
        badge.style.cursor = "pointer";
        badge.addEventListener("click", () => {
          const currentCat = issue.category;
          const allCats = getAllCategories();
          // 過濾掉舊分類（測試2 和 TMflow應用問題）
          const filteredCats = allCats.filter((cat) => 
            cat !== "測試2" && cat !== "TMflow應用問題"
          );
          
          // 建立選單
          const menu = document.createElement("div");
          menu.className = "category-menu";
          menu.style.position = "fixed";
          menu.style.zIndex = "1000";
          menu.style.background = "#fff";
          menu.style.border = "1px solid var(--border)";
          menu.style.borderRadius = "8px";
          menu.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          menu.style.padding = "8px 0";
          menu.style.minWidth = "180px";
          menu.style.maxHeight = "400px";
          menu.style.overflowY = "auto";
          menu.style.overflowX = "hidden";
          
          // 計算選單位置（相對於 badge）
          const rect = badge.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const menuHeight = Math.min(400, filteredCats.length * 40 + 100); // 估算選單高度
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          // 如果下方空間不足，嘗試在上方顯示
          if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            menu.style.bottom = `${viewportHeight - rect.top + 4}px`;
            menu.style.top = "auto";
          } else {
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.bottom = "auto";
          }
          
          // 確保選單不會超出右側邊界
          const menuWidth = 180;
          if (rect.left + menuWidth > viewportWidth) {
            menu.style.left = `${Math.max(4, viewportWidth - menuWidth - 4)}px`;
          } else {
            menu.style.left = `${rect.left}px`;
          }
          
          filteredCats.forEach((cat) => {
            const option = document.createElement("div");
            option.style.padding = "8px 16px";
            option.style.cursor = "pointer";
            option.style.display = "flex";
            option.style.justifyContent = "space-between";
            option.style.alignItems = "center";
            
            const label = document.createElement("span");
            label.textContent = cat;
            option.appendChild(label);
            
            // 僅管理員可以刪除分類
            if (isAdmin) {
              const deleteBtn = document.createElement("span");
              deleteBtn.innerHTML = "×";
              deleteBtn.style.cursor = "pointer";
              deleteBtn.style.fontSize = "18px";
              deleteBtn.style.fontWeight = "bold";
              deleteBtn.style.color = "#b91c1c";
              deleteBtn.style.marginLeft = "8px";
              deleteBtn.style.width = "20px";
              deleteBtn.style.height = "20px";
              deleteBtn.style.display = "flex";
              deleteBtn.style.alignItems = "center";
              deleteBtn.style.justifyContent = "center";
              deleteBtn.title = "刪除此分類";
              deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (document.body.contains(menu)) {
                  document.body.removeChild(menu);
                }
                deleteCategory(cat);
              });
              option.appendChild(deleteBtn);
            }
            
            if (cat === currentCat) {
              option.style.background = "rgba(37, 99, 235, 0.1)";
              option.style.fontWeight = "700";
            }
            option.addEventListener("mouseenter", () => {
              if (cat !== currentCat) {
                option.style.background = "rgba(37, 99, 235, 0.05)";
              }
            });
            option.addEventListener("mouseleave", () => {
              if (cat !== currentCat) {
                option.style.background = "transparent";
              }
            });
            option.addEventListener("click", (e) => {
              // 如果點擊的是刪除按鈕，不執行選擇
              if (isAdmin && e.target.tagName === "SPAN" && e.target.innerHTML === "×") {
                return;
              }
              if (cat !== currentCat) {
                issue.category = cat;
                renderList();
                renderChart();
                saveToLocalStorage();
                scheduleSync();
              }
              if (document.body.contains(menu)) {
                document.body.removeChild(menu);
              }
            });
            menu.appendChild(option);
          });
          
          // 自訂分類選項（僅管理員可以使用）
          if (isAdmin) {
            const divider = document.createElement("div");
            divider.style.height = "1px";
            divider.style.background = "var(--border)";
            divider.style.margin = "4px 0";
            menu.appendChild(divider);
            
            const customOption = document.createElement("div");
            customOption.style.padding = "8px 16px";
            customOption.style.cursor = "pointer";
            customOption.style.color = "var(--muted)";
            customOption.textContent = "+ 自訂分類...";
            customOption.addEventListener("mouseenter", () => {
              customOption.style.background = "rgba(37, 99, 235, 0.05)";
            });
            customOption.addEventListener("mouseleave", () => {
              customOption.style.background = "transparent";
            });
            customOption.addEventListener("click", () => {
              document.body.removeChild(menu);
              const newCat = prompt("請輸入新的分類名稱：", currentCat);
              if (newCat && newCat.trim() && newCat !== currentCat) {
                const trimmedCat = newCat.trim();
                // 加入自訂分類
                if (!Object.keys(keywords).includes(trimmedCat)) {
                  customCategories.add(trimmedCat);
                  saveCustomCategories();
                  updateCategorySelect();
                  renderFilterChips();
                }
                issue.category = trimmedCat;
                renderList();
                renderChart();
                saveToLocalStorage();
                scheduleSync();
              }
            });
            menu.appendChild(customOption);
          }
          
          // 僅管理員可以新增預設分類
          if (isAdmin) {
            const adminDivider = document.createElement("div");
            adminDivider.style.height = "1px";
            adminDivider.style.background = "var(--border)";
            adminDivider.style.margin = "4px 0";
            menu.appendChild(adminDivider);
            
            const addCategoryOption = document.createElement("div");
            addCategoryOption.style.padding = "8px 16px";
            addCategoryOption.style.cursor = "pointer";
            addCategoryOption.style.color = "var(--accent)";
            addCategoryOption.style.fontWeight = "600";
            addCategoryOption.textContent = "+ 新增預設分類...";
            addCategoryOption.addEventListener("mouseenter", () => {
              addCategoryOption.style.background = "rgba(37, 99, 235, 0.05)";
            });
            addCategoryOption.addEventListener("mouseleave", () => {
              addCategoryOption.style.background = "transparent";
            });
            addCategoryOption.addEventListener("click", () => {
              document.body.removeChild(menu);
              const newCat = prompt("請輸入新的預設分類名稱：");
              if (newCat && newCat.trim()) {
                const trimmedCat = newCat.trim();
                // 檢查是否已存在
                if (Object.keys(keywords).includes(trimmedCat) || customCategories.has(trimmedCat)) {
                  alert("此分類已存在！");
                  return;
                }
                // 加入 keywords（預設分類）
                keywords[trimmedCat] = [];
                updateCategorySelect();
                renderFilterChips();
                renderList();
                saveToLocalStorage();
                scheduleSync();
              }
            });
            menu.appendChild(addCategoryOption);
          }
          
          document.body.appendChild(menu);
          
          // 點擊外部關閉選單
          const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== badge) {
              if (document.body.contains(menu)) {
                document.body.removeChild(menu);
              }
              document.removeEventListener("click", closeMenu);
            }
          };
          setTimeout(() => {
            document.addEventListener("click", closeMenu);
          }, 0);
        });
        
        badgeContainer.appendChild(badge);

        // 經銷商或客戶名稱（可編輯）
        const customerContainer = document.createElement("div");
        customerContainer.style.marginTop = "4px";
        customerContainer.style.display = "flex";
        customerContainer.style.alignItems = "center";
        customerContainer.style.gap = "6px";
        
        const customerLabel = document.createElement("span");
        customerLabel.style.fontSize = "12px";
        customerLabel.style.color = "var(--muted)";
        customerLabel.textContent = "客戶：";
        
        const customerValue = document.createElement("span");
        customerValue.className = "customer-name editable-customer";
        customerValue.textContent = issue.customer || "(未填寫)";
        customerValue.style.cursor = "pointer";
        customerValue.style.color = issue.customer ? "var(--text)" : "var(--muted)";
        customerValue.style.fontWeight = issue.customer ? "600" : "400";
        customerValue.title = "點擊以編輯客戶名稱";
        customerValue.addEventListener("click", () => {
          const newCustomer = prompt("請輸入經銷商或客戶名稱：", issue.customer || "");
          if (newCustomer !== null) {
            const trimmedCustomer = newCustomer.trim();
            issue.customer = trimmedCustomer || null;
            renderList();
            saveToLocalStorage();
            scheduleSync();
          }
        });
        
        // 刪除客戶名稱按鈕
        if (issue.customer) {
          const deleteCustomerBtn = document.createElement("button");
          deleteCustomerBtn.type = "button";
          deleteCustomerBtn.innerHTML = "×";
          deleteCustomerBtn.style.width = "18px";
          deleteCustomerBtn.style.height = "18px";
          deleteCustomerBtn.style.borderRadius = "50%";
          deleteCustomerBtn.style.border = "none";
          deleteCustomerBtn.style.background = "rgba(185, 28, 28, 0.1)";
          deleteCustomerBtn.style.color = "#b91c1c";
          deleteCustomerBtn.style.cursor = "pointer";
          deleteCustomerBtn.style.fontSize = "14px";
          deleteCustomerBtn.style.fontWeight = "bold";
          deleteCustomerBtn.style.display = "flex";
          deleteCustomerBtn.style.alignItems = "center";
          deleteCustomerBtn.style.justifyContent = "center";
          deleteCustomerBtn.style.padding = "0";
          deleteCustomerBtn.title = "刪除客戶名稱";
          deleteCustomerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm("確定要刪除此客戶名稱嗎？")) {
              issue.customer = null;
              renderList();
              saveToLocalStorage();
              scheduleSync();
            }
          });
          customerContainer.appendChild(deleteCustomerBtn);
        }
        
        customerContainer.appendChild(customerLabel);
        customerContainer.appendChild(customerValue);

        const desc = document.createElement("p");
        desc.className = "desc";
        desc.textContent = issue.text || "(無文字描述)";

        const time = document.createElement("time");
        time.textContent = formatDate(new Date(issue.createdAt));

        meta.appendChild(badgeContainer);
        meta.appendChild(customerContainer);
        meta.appendChild(desc);
        meta.appendChild(time);
        row.appendChild(meta);

        // 僅管理員可以刪除事件
        if (isAdmin) {
          const actions = document.createElement("div");
          actions.className = "actions";

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "icon-button";
          removeBtn.title = "刪除此事件";
          removeBtn.innerHTML = "🗑";
          removeBtn.addEventListener("click", () => {
            if (!confirm("確定要刪除此事件嗎？此操作無法復原。")) {
              return;
            }
            const idx = issues.findIndex((i) => i.id === issue.id);
            if (idx !== -1) {
              issues.splice(idx, 1);
              renderList();
              renderChart();
              saveToLocalStorage();
              scheduleSync();
            }
          });

          actions.appendChild(removeBtn);
          row.appendChild(actions);
        }

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

    // 定義不同顏色的陣列
    const colors = [
      "#2563eb", // 藍色
      "#10b981", // 綠色
      "#f59e0b", // 橙色
      "#ef4444", // 紅色
      "#8b5cf6", // 紫色
      "#ec4899", // 粉色
      "#06b6d4", // 青色
      "#84cc16", // 黃綠色
      "#f97316", // 橘色
      "#6366f1"  // 靛藍色
    ];

    // 為每個直方圖分配顏色（循環使用）
    const backgroundColors = data.map((_, index) => {
      return colors[index % colors.length];
    });

    // 找到最高值的索引（第一名）
    const maxIndex = data.indexOf(Math.max(...data));

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
              backgroundColor: backgroundColors,
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
            y: { 
              beginAtZero: true, 
              ticks: { precision: 0 },
              // 增加頂部 padding，為星星預留空間
              afterFit: function(scale) {
                scale.paddingTop = 25;
              }
            }
          },
          // 增加圖表頂部邊距，確保星星不會被裁切
          layout: {
            padding: {
              top: 25
            }
          }
        },
        plugins: [{
          id: "starPlugin",
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const dataset = chart.data.datasets[0];
            const meta = chart.getDatasetMeta(0);
            
            // 找到最高值的索引
            const maxValue = Math.max(...dataset.data);
            const maxIndex = dataset.data.indexOf(maxValue);
            
            if (maxIndex >= 0 && maxValue > 0) {
              const bar = meta.data[maxIndex];
              const x = bar.x;
              const y = bar.y; // 這是直方圖頂部的 y 座標
              
              // 獲取圖表的邊界，確保星星在圖表範圍內
              const chartArea = chart.chartArea;
              // 將星星放在直方圖頂部上方 15 像素，使用 bottom baseline 確保星星底部在指定位置
              const starY = Math.max(chartArea.top + 10, y - 15);
              
              // 在直方圖頂部上方繪製星星
              ctx.save();
              ctx.fillStyle = "#fbbf24"; // 金色
              ctx.font = "bold 20px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom"; // 改為 bottom，讓星星底部在指定位置，確保完全在直方圖上方
              
              // 繪製星星（使用 Unicode 星星符號 ⭐）
              ctx.fillText("⭐", x, starY);
              ctx.restore();
            }
          }
        }]
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = backgroundColors;
      // 更新 plugin 以重新繪製星星
      chart.update();
    }
  }

  function addIssue(payload) {
    const newIssue = {
      id: safeId(),
      createdAt: new Date().toISOString(),
      ...payload
    };
    issues.push(newIssue);
    
    // 如果是自訂分類，加入自訂分類列表
    if (payload.category && !Object.keys(keywords).includes(payload.category)) {
      customCategories.add(payload.category);
      saveCustomCategories();
      updateCategorySelect();
      renderFilterChips();
    }
    
    renderList();
    renderChart();
    saveToLocalStorage();
    scheduleSync();
  }

  function resetForm() {
    customerInput.value = "";
    textInput.value = "";
    fileInput.value = "";
    categorySelect.value = "auto";
    customCategory.value = "";
    filePreview.innerHTML = "";
  }

  function showImageModal() {
    if (currentImageList.length === 0) return;
    imageModalImg.src = currentImageList[currentImageIndex];
    imageModalCounter.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;
    imageModal.classList.remove("hidden");
    
    // 顯示/隱藏上一張/下一張按鈕
    imageModalPrev.style.display = currentImageList.length > 1 ? "flex" : "none";
    imageModalNext.style.display = currentImageList.length > 1 ? "flex" : "none";
    imageModalCounter.style.display = currentImageList.length > 1 ? "block" : "none";
  }

  function showNextImage() {
    if (currentImageList.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
    showImageModal();
  }

  function showPrevImage() {
    if (currentImageList.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
    showImageModal();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    statusEl.textContent = "";

    const customer = customerInput.value.trim();
    const text = textInput.value.trim();
    const selected = categorySelect.value;
    const custom = customCategory.value.trim();

    if (!text && !fileInput.files.length) {
      statusEl.textContent = "請至少提供文字或圖片";
      return;
    }

    // 僅管理員可以使用自訂分類
    let category;
    if (custom && isAdmin) {
      category = custom;
    } else if (custom && !isAdmin) {
      statusEl.textContent = "僅管理員可以新增自訂分類";
      return;
    } else {
      category = (selected === "auto" ? detectCategory(text) : selected) || "其他";
    }

    const files = Array.from(fileInput.files);

    if (files.length === 0) {
      addIssue({ 
        customer: customer || null, 
        text, 
        category, 
        imageDataArray: [] 
      });
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

    const imageDataArray = [];
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await readFileAsDataUrl(file);
      imageDataArray.push(dataUrl);
    }

    addIssue({
      customer: customer || null,
      text,
      category,
      imageDataArray: imageDataArray
    });

    resetForm();
    statusEl.textContent = `已建立事件（含 ${files.length} 張圖片）`;
  }

  function exportJson() {
    // JSON 匯出功能說明與實際用途：
    // 
    // 1. 【資料備份與還原】
    //    用途：定期匯出 JSON 作為資料備份，當系統出問題時可以還原
    //    範例：每週五匯出一次 JSON，保存到雲端硬碟，如果下週資料遺失，可以手動匯入還原
    //
    // 2. 【資料遷移與整合】
    //    用途：將資料從舊系統遷移到新系統，或整合到其他系統
    //    範例：公司要換新的問題追蹤系統，可以匯出 JSON，寫程式轉換格式後匯入新系統
    //
    // 3. 【資料分析與報表】
    //    用途：用 Python、Excel、或其他工具分析資料，產生深度報表
    //    範例：匯出 JSON 後，用 Python 分析哪些問題類型最常發生、哪些時段問題最多
    //         或匯入 Power BI 產生視覺化儀表板
    //
    // 4. 【程式化處理】
    //    用途：寫程式自動處理資料，例如自動分類、關鍵字提取、趨勢分析
    //    範例：寫一個 Node.js 腳本讀取 JSON，自動找出重複問題，或計算平均處理時間
    //
    // 5. 【版本控制與審計】
    //    用途：追蹤不同時間點的資料狀態，進行審計或比較
    //    範例：每月匯出一次 JSON，放到 Git 版本控制，可以追蹤問題數量的變化趨勢
    //
    // 6. 【資料分享與協作】
    //    用途：將資料分享給其他部門或外部合作夥伴，不需要給他們系統存取權限
    //    範例：將 JSON 檔案傳給資料分析團隊，讓他們進行深度分析
    //
    // 注意：JSON 檔案包含所有圖片（base64 編碼），檔案可能會很大（幾 MB 到幾十 MB）
    
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
        category: "邏輯編程與調試難度"
      },
      {
        text: "相機拍攝時偶爾無法辨識 QR code，視覺結果不穩定。",
        category: "視覺功能"
      },
      {
        text: "客戶反映透過 Modbus TCP 連線會間斷中斷，需要重連。",
        category: "通訊相關"
      },
      {
        text: "手臂 Z 軸偶爾發出異音，停止後電源指示燈閃爍。",
        category: "運動與力矩"
      },
      {
        text: "新客戶不知道怎麼做安全區設定與權限管理，希望有教育訓練。",
        category: "安全與法規"
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

  function saveToLocalStorage() {
    try {
      localStorage.setItem("customer-issues", JSON.stringify(issues));
    } catch (err) {
      // localStorage 可能已滿或不可用，忽略錯誤
    }
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem("customer-issues");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed;
        }
      }
    } catch (err) {
      // 忽略錯誤
    }
    return null;
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
    // 先嘗試從 server 載入
    if (window.fetch) {
      fetch(`${API_BASE}/issues`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length) {
            // 從 server 載入成功，清空現有資料並載入
            issues.length = 0;
            data.forEach((i) => issues.push(i));
            // 從事件中提取自訂分類
            loadCustomCategories();
            // 同步到 localStorage
            saveToLocalStorage();
          } else {
            // server 沒有資料，嘗試從 localStorage 載入
            const localData = loadFromLocalStorage();
            if (localData && localData.length) {
              issues.length = 0;
              localData.forEach((i) => issues.push(i));
              // 從事件中提取自訂分類
              loadCustomCategories();
              // 同步到 server
              scheduleSync();
            } else {
              // 完全沒有資料，只在第一次使用時填入測試資料
              const hasUsedBefore = localStorage.getItem("customer-issues-has-used");
              if (!hasUsedBefore) {
                seedDemoData();
                saveToLocalStorage();
                scheduleSync();
                localStorage.setItem("customer-issues-has-used", "true");
              }
            }
          }
        })
        .catch(() => {
          // server 連線失敗，從 localStorage 載入
          const localData = loadFromLocalStorage();
          if (localData && localData.length) {
            issues.length = 0;
            localData.forEach((i) => issues.push(i));
            // 從事件中提取自訂分類
            loadCustomCategories();
          } else {
            // 完全沒有資料，只在第一次使用時填入測試資料
            const hasUsedBefore = localStorage.getItem("customer-issues-has-used");
            if (!hasUsedBefore) {
              seedDemoData();
              saveToLocalStorage();
              localStorage.setItem("customer-issues-has-used", "true");
            }
          }
        })
        .finally(() => {
          loadCustomCategories();
          cleanupOldCategories(); // 確保清理舊分類
          updateCategorySelect();
          renderFilterChips();
          renderChart();
          renderList();
        });
    } else {
          // 沒有 fetch API，從 localStorage 載入
      const localData = loadFromLocalStorage();
      if (localData && localData.length) {
        issues.length = 0;
        localData.forEach((i) => issues.push(i));
        // 從事件中提取自訂分類
        loadCustomCategories();
      } else {
        // 完全沒有資料，只在第一次使用時填入測試資料
        const hasUsedBefore = localStorage.getItem("customer-issues-has-used");
        if (!hasUsedBefore) {
          seedDemoData();
          saveToLocalStorage();
          localStorage.setItem("customer-issues-has-used", "true");
        }
      }
      loadCustomCategories();
      cleanupOldCategories(); // 確保清理舊分類
      updateCategorySelect();
      renderFilterChips();
      renderChart();
      renderList();
    }
  }

  function renderFilterChips() {
    const allCats = getAllCategories();
    // 過濾掉舊分類（測試2 和 TMflow應用問題）
    const filteredCats = allCats.filter((cat) => 
      cat !== "測試2" && cat !== "TMflow應用問題"
    );
    const cats = ["全部", ...filteredCats];
    filterEl.innerHTML = "";
    cats.forEach((c) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (c === activeFilter ? " active" : "");
      chip.textContent = c;
      
      // 僅管理員可以刪除分類
      if (isAdmin && c !== "全部") {
        chip.style.position = "relative";
        chip.style.paddingRight = "24px";
        
        const deleteBtn = document.createElement("span");
        deleteBtn.innerHTML = "×";
        deleteBtn.style.position = "absolute";
        deleteBtn.style.right = "6px";
        deleteBtn.style.top = "50%";
        deleteBtn.style.transform = "translateY(-50%)";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.fontSize = "16px";
        deleteBtn.style.fontWeight = "bold";
        deleteBtn.style.color = "#b91c1c";
        deleteBtn.style.width = "16px";
        deleteBtn.style.height = "16px";
        deleteBtn.style.display = "flex";
        deleteBtn.style.alignItems = "center";
        deleteBtn.style.justifyContent = "center";
        deleteBtn.title = "刪除此分類";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteCategory(c);
        });
        chip.appendChild(deleteBtn);
      }
      
      chip.addEventListener("click", () => {
        activeFilter = c;
        renderFilterChips();
        renderList();
      });
      filterEl.appendChild(chip);
    });
  }

  function deleteCategory(category) {
    // 僅管理員可以刪除分類
    if (!isAdmin) {
      alert("僅管理員可以刪除分類");
      return;
    }
    
    // 不能刪除「其他」分類
    if (category === "其他") {
      alert("無法刪除「其他」分類");
      return;
    }
    
    // 檢查是否有事件使用此分類
    const hasIssues = issues.some((i) => i.category === category);
    if (hasIssues) {
      const count = issues.filter((i) => i.category === category).length;
      if (!confirm(`此分類目前有 ${count} 個事件正在使用。\n\n刪除此分類後，這些事件的分類將改為「其他」。\n\n確定要刪除此分類嗎？`)) {
        return;
      }
      // 將使用此分類的事件改為「其他」
      issues.forEach((issue) => {
        if (issue.category === category) {
          issue.category = "其他";
        }
      });
    } else {
      if (!confirm(`確定要刪除分類「${category}」嗎？`)) {
        return;
      }
    }
    
    // 如果是自訂分類，從自訂分類列表中移除
    if (customCategories.has(category)) {
      customCategories.delete(category);
      saveCustomCategories();
    }
    // 如果是預設分類，從 keywords 中移除
    if (keywords.hasOwnProperty(category)) {
      delete keywords[category];
    }
    
    updateCategorySelect();
    renderFilterChips();
    renderList();
    renderChart();
    saveToLocalStorage();
    scheduleSync();
  }

  function updateCategorySelect() {
    const allCats = getAllCategories();
    // 過濾掉舊分類（測試2 和 TMflow應用問題）
    const filteredCats = allCats.filter((cat) => 
      cat !== "測試2" && cat !== "TMflow應用問題"
    );
    categorySelect.innerHTML = '<option value="auto">自動判別</option>';
    filteredCats.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
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

  async function exportExcel() {
    // 優先使用 ExcelJS（支援圖片插入），如果沒有則回退到 XLSX
    if (typeof ExcelJS !== "undefined") {
      await exportExcelWithImages();
    } else if (typeof XLSX !== "undefined") {
      exportExcelBasic();
    } else {
      alert("找不到 Excel 匯出元件，請確認網路可存取 CDN。");
    }
  }

  async function exportExcelWithImages() {
    if (!issues.length) {
      alert("目前沒有任何事件可匯出。");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("問題列表");
    const summarySheet = workbook.addWorksheet("分類統計");

    // 設定欄位標題
    worksheet.columns = [
      { header: "編號", key: "編號", width: 8 },
      { header: "建立時間", key: "建立時間", width: 20 },
      { header: "經銷商或客戶名稱", key: "經銷商或客戶名稱", width: 20 },
      { header: "問題類型", key: "問題類型", width: 18 },
      { header: "問題描述", key: "問題描述", width: 50 },
      { header: "圖片", key: "圖片", width: 15 }
    ];

    // 先排序：建立時間由近到遠
    const sortedIssues = [...issues].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // 處理每一行資料
    for (let idx = 0; idx < sortedIssues.length; idx++) {
      const issue = sortedIssues[idx];
      const images = issue.imageDataArray || (issue.imageData ? [issue.imageData] : []);
      
      const row = worksheet.addRow({
        編號: idx + 1,
        建立時間: formatDate(new Date(issue.createdAt)),
        經銷商或客戶名稱: issue.customer || "",
        問題類型: issue.category,
        問題描述: issue.text || "",
        圖片: "" // 不顯示文字，只顯示圖片
      });
      
      // 確保編號欄位是數字格式，避免顯示問題
      const numberCell = row.getCell("編號");
      numberCell.value = idx + 1;
      numberCell.numFmt = "0";

      // 先設定行高（在插入圖片前設定，避免自動調整）
      const rowHeight = images.length > 0 ? 60 : 20;
      row.height = rowHeight;
      
      // 如果有圖片，插入所有圖片（從 F 欄開始，依序往右放）
      if (images.length > 0) {
        // 從 F 欄（索引 5）開始，依序插入每張圖片
        images.forEach((imageBase64, imgIdx) => {
          try {
            // 移除 data URL 前綴
            const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            const image = workbook.addImage({
              buffer: imageBuffer,
              extension: imageBase64.includes("png") ? "png" : "jpeg"
            });

            // 插入圖片：從 F 欄（索引 5）開始，每張圖片往右一欄
            // 使用精確的座標定位，確保圖片在儲存格內
            const targetCol = 5 + imgIdx; // F=5, G=6, H=7, I=8...
            const targetRow = row.number;
            
            // 圖片大小設為 55x55，略小於行高 60，確保完全在儲存格內
            // 使用 ext 指定絕對大小，而不是相對位置
            worksheet.addImage(image, {
              tl: { col: targetCol, row: targetRow },
              ext: { width: 55, height: 55 }
            });
          } catch (err) {
            console.warn(`插入第 ${imgIdx + 1} 張圖片失敗:`, err);
          }
        });
        
        // 確保圖片欄位的儲存格對齊
        const imageCell = row.getCell("圖片");
        imageCell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      }
      
      // 最後再次強制設定行高，確保不會被自動調整
      row.height = rowHeight;
    }

    // 設定標題列樣式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    // 啟用自動篩選（6 個欄位：編號、建立時間、經銷商或客戶名稱、問題類型、問題描述、圖片）
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: sortedIssues.length + 1, column: 6 }
    };

    // 分類統計工作表
    const summaryRows = buildSummaryCounts();
    summarySheet.columns = [
      { header: "排名", key: "排名", width: 8 },
      { header: "問題類型", key: "問題類型", width: 20 },
      { header: "數量", key: "數量", width: 10 }
    ];

    summaryRows.forEach((r, idx) => {
      summarySheet.addRow({
        排名: idx + 1,
        問題類型: r.category,
        數量: r.count
      });
    });

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    // 匯出檔案
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcelBasic() {
    if (!issues.length) {
      alert("目前沒有任何事件可匯出。");
      return;
    }

    const sortedIssues = [...issues].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const issueRows = sortedIssues.map((i, idx) => {
      return {
        編號: idx + 1,
        建立時間: formatDate(new Date(i.createdAt)),
        經銷商或客戶名稱: i.customer || "",
        問題類型: i.category,
        問題描述: i.text || "",
        圖片: "" // 不顯示文字，只顯示圖片（如果使用 ExcelJS 會插入圖片）
      };
    });

    const summaryRows = buildSummaryCounts().map((r, idx) => ({
      排名: idx + 1,
      問題類型: r.category,
      數量: r.count
    }));

    const wb = XLSX.utils.book_new();
    const sheetIssues = XLSX.utils.json_to_sheet(issueRows);
    
    sheetIssues["!cols"] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 50 },
      { wch: 15 }
    ];
    
    const range = XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: 5, r: issueRows.length }
    });
    sheetIssues["!autofilter"] = { ref: range };
    
    const sheetSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, sheetIssues, "問題列表");
    XLSX.utils.book_append_sheet(wb, sheetSummary, "分類統計");

    const filename = `issues-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  // 管理員功能
  function checkAdminStatus() {
    try {
      const stored = localStorage.getItem("customer-admin-logged-in");
      isAdmin = stored === "true";
    } catch (err) {
      isAdmin = false;
    }
    updateAdminUI();
  }

  function updateAdminUI() {
    if (isAdmin) {
      adminLoginBtn.textContent = "管理員已登入";
      adminLoginBtn.style.background = "rgba(16, 185, 129, 0.2)";
      adminLoginBtn.style.color = "#10b981";
      adminLoginBtn.style.borderColor = "#10b981";
      adminLogoutSection.style.display = "block";
      adminLoginForm.style.display = "none";
      // 啟用自訂分類輸入框
      customCategory.disabled = false;
      customCategory.placeholder = "例：教育訓練、帳號權限…";
      customCategory.style.opacity = "1";
      customCategory.style.cursor = "text";
    } else {
      adminLoginBtn.textContent = "管理員登入";
      adminLoginBtn.style.background = "";
      adminLoginBtn.style.color = "";
      adminLoginBtn.style.borderColor = "";
      adminLogoutSection.style.display = "none";
      adminLoginForm.style.display = "block";
      // 禁用自訂分類輸入框
      customCategory.disabled = true;
      customCategory.placeholder = "僅管理員可以新增自訂分類";
      customCategory.value = "";
      customCategory.style.opacity = "0.5";
      customCategory.style.cursor = "not-allowed";
    }
    // 重新渲染列表以顯示/隱藏刪除按鈕
    renderList();
    renderFilterChips();
  }

  function handleAdminLogin(event) {
    event.preventDefault();
    const password = adminPasswordInput.value.trim();
    
    if (password === ADMIN_PASSWORD) {
      isAdmin = true;
      localStorage.setItem("customer-admin-logged-in", "true");
      adminLoginModal.classList.add("hidden");
      adminPasswordInput.value = "";
      adminLoginStatus.textContent = "";
      updateAdminUI();
    } else {
      adminLoginStatus.textContent = "密碼錯誤";
      adminLoginStatus.style.color = "#b91c1c";
      adminPasswordInput.value = "";
    }
  }

  function handleAdminLogout() {
    if (confirm("確定要登出管理員嗎？")) {
      isAdmin = false;
      localStorage.removeItem("customer-admin-logged-in");
      updateAdminUI();
    }
  }

  // 管理員登入事件監聽
  adminLoginBtn.addEventListener("click", () => {
    adminLoginModal.classList.remove("hidden");
    if (!isAdmin) {
      adminPasswordInput.focus();
    }
  });

  adminLoginClose.addEventListener("click", () => {
    adminLoginModal.classList.add("hidden");
    adminPasswordInput.value = "";
    adminLoginStatus.textContent = "";
  });

  adminLoginModal.addEventListener("click", (e) => {
    if (e.target === adminLoginModal || e.target.classList.contains("image-modal-backdrop")) {
      adminLoginModal.classList.add("hidden");
      adminPasswordInput.value = "";
      adminLoginStatus.textContent = "";
    }
  });

  adminLoginForm.addEventListener("submit", handleAdminLogin);
  adminLogoutBtn.addEventListener("click", handleAdminLogout);

  // 初始化管理員狀態
  checkAdminStatus();

  form.addEventListener("submit", handleSubmit);
  exportExcelBtn.addEventListener("click", exportExcel);

  imageModalClose.addEventListener("click", () => {
    imageModal.classList.add("hidden");
    imageModalImg.src = "";
    currentImageList = [];
    currentImageIndex = 0;
  });
  imageModalPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    showPrevImage();
  });
  imageModalNext.addEventListener("click", (e) => {
    e.stopPropagation();
    showNextImage();
  });
  imageModal.addEventListener("click", (event) => {
    if (
      event.target === imageModal ||
      event.target.classList.contains("image-modal-backdrop")
    ) {
      imageModal.classList.add("hidden");
      imageModalImg.src = "";
      currentImageList = [];
      currentImageIndex = 0;
    }
  });
  
  // 鍵盤導航
  document.addEventListener("keydown", (e) => {
    if (!imageModal.classList.contains("hidden")) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrevImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showNextImage();
      } else if (e.key === "Escape") {
        imageModal.classList.add("hidden");
        currentImageList = [];
        currentImageIndex = 0;
      }
    }
  });
  
  // 拖曳上傳功能
  fileDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileDropZone.classList.add("dragover");
  });
  fileDropZone.addEventListener("dragleave", () => {
    fileDropZone.classList.remove("dragover");
  });
  fileDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    fileDropZone.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      const dt = new DataTransfer();
      const existingFiles = Array.from(fileInput.files);
      existingFiles.forEach((f) => dt.items.add(f));
      files.forEach((f) => dt.items.add(f));
      fileInput.files = dt.files;
      updateFilePreview();
    }
  });
  fileInput.addEventListener("change", updateFilePreview);
  
  function updateFilePreview() {
    filePreview.innerHTML = "";
    const files = Array.from(fileInput.files);
    if (files.length === 0) return;
    
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.createElement("div");
        preview.className = "file-preview-item";
        preview.innerHTML = `
          <img src="${e.target.result}" alt="preview">
          <span>${file.name}</span>
          <button type="button" class="file-remove" data-index="${idx}">×</button>
        `;
        filePreview.appendChild(preview);
        
        preview.querySelector(".file-remove").addEventListener("click", () => {
          const dt = new DataTransfer();
          Array.from(fileInput.files).forEach((f, i) => {
            if (i !== idx) dt.items.add(f);
          });
          fileInput.files = dt.files;
          updateFilePreview();
        });
      };
      reader.readAsDataURL(file);
    });
  }

  loadFromServer();
})(); 

