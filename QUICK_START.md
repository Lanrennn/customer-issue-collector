# 快速開始：5 分鐘部署到公網

## 最簡單的方式（3 步驟）

### ✅ 步驟 1：推送到 GitHub（2 分鐘）

```bash
# 在專案資料夾執行
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的帳號/customer-issue-collector.git
git push -u origin main
```

**如果沒有 Git**：
- Windows: 下載 [Git for Windows](https://git-scm.com/download/win)
- 或直接在 GitHub 網頁上傳檔案（點選「uploading an existing file」）

### ✅ 步驟 2：在 Render 建立服務（2 分鐘）

1. 前往 https://render.com，用 GitHub 登入
2. 點「New +」→「Web Service」
3. 選擇你的 GitHub 倉庫
4. 設定：
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. 點「Create Web Service」

### ✅ 步驟 3：取得連結並分享（1 分鐘）

- Render 部署完成後，會給你一個網址，例如：
  ```
  https://customer-issue-collector.onrender.com/index.html
  ```
- 把這個連結分享給 team，大家就能共同使用了！

## 需要詳細說明？

請參考 `DEPLOY.md` 檔案，裡面有完整的步驟和疑難排解。

## 測試清單

部署完成後，請確認：
- [ ] 可以開啟網頁
- [ ] 可以新增事件
- [ ] 分類統計圖表正常顯示
- [ ] 可以匯出 Excel
- [ ] 在不同瀏覽器/電腦打開，資料會同步


