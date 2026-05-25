# 客服服务负载监控 Dashboard

Vue 3 + TypeScript + Element Plus + ECharts 实现的客服服务负载监控页面，当前使用前端内置 mock API。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:5173/`。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`。

## 云端部署

### Vercel

推荐方式，适合快速分享给其他人：

1. 把当前项目推送到 GitHub。
2. 登录 Vercel。
3. Import Git Repository。
4. Framework 选择 Vite。
5. Build Command 使用 `npm run build`。
6. Output Directory 使用 `dist`。
7. 部署完成后复制 Vercel 提供的访问链接。

项目已包含 `vercel.json`，Vercel 会自动读取构建配置。

### Netlify

也可以使用 Netlify：

1. 把当前项目推送到 GitHub。
2. 登录 Netlify。
3. Add new site from Git。
4. Build Command 使用 `npm run build`。
5. Publish Directory 使用 `dist`。

项目已包含 `netlify.toml`，Netlify 会自动读取构建配置。
