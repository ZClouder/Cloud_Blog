# Vercel 部署与 zcloud.ren 域名绑定记录

记录时间：2026-05-20

## 目标

把本地 Next.js 博客项目部署到 Vercel，并让外部用户通过以下域名访问：

- https://zcloud.ren
- https://www.zcloud.ren

## 项目信息

- 本地项目目录：`D:\zjq\blog\XinghuisamaBlogs-main\XinghuisamaBlogs-main\XHBlogs`
- Vercel 账号：`zclouder`
- Vercel 团队：`zclouders-projects`
- Vercel 项目：`zcloud-blog`
- GitHub 仓库：`https://github.com/ZClouder/Cloud_Blog`
- 默认 Vercel 地址：`https://zcloud-blog.vercel.app`

## GitHub 与 Vercel 的区别

GitHub 是代码托管平台，用来保存代码、管理版本、记录提交和协作。

Vercel 是部署平台，用来拉取代码、构建 Next.js 项目，并把网站发布到公网。

推荐流程：

```text
本地代码
  -> push 到 GitHub
  -> Vercel 拉取代码并构建
  -> Vercel 发布网站
  -> 域名 DNS 指向 Vercel
  -> 用户通过 zcloud.ren 访问
```

## 部署过程

进入项目目录：

```powershell
cd D:\zjq\blog\XinghuisamaBlogs-main\XinghuisamaBlogs-main\XHBlogs
```

本地构建验证：

```powershell
npm run build
```

构建结果：

```text
Next.js 16.2.1
Compiled successfully
Generated static pages: 13/13
Build passed
```

登录 Vercel：

```powershell
npx --yes vercel@latest whoami
```

如果本机没有登录态，CLI 会给出浏览器登录链接。登录完成后显示当前账号：

```text
zclouder
```

绑定 Vercel 项目：

```powershell
npx --yes vercel@latest link --yes --project zcloud-blog
```

绑定结果：

```text
Linked zclouders-projects/zcloud-blog
Connected GitHub repository: https://github.com/ZClouder/Cloud_Blog
```

生产部署：

```powershell
npx --yes vercel@latest deploy --prod --yes
```

部署结果：

```text
Status: READY
Production URL: https://zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app
Alias: https://zcloud-blog.vercel.app
```

## 域名 DNS 配置

域名 `zcloud.ren` 在第三方域名服务商处管理，当前使用阿里云云解析 DNS。

需要在阿里云解析设置中保留这两条记录：

```text
主机记录    类型    解析线路    记录值
@          A       默认       76.76.21.21
www        A       默认       76.76.21.21
```

旧记录曾经是：

```text
@          A       198.18.0.14
www        A       198.18.0.15
```

这两个旧 IP 不是 Vercel 地址，会导致 Vercel 无法签发证书，域名也无法正常访问。

## Vercel 域名绑定

DNS 记录改成 `76.76.21.21` 后，把域名别名切到新部署：

```powershell
npx --yes vercel@latest alias set zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app zcloud.ren
npx --yes vercel@latest alias set zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app www.zcloud.ren
```

绑定结果：

```text
https://zcloud.ren now points to zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app
https://www.zcloud.ren now points to zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app
```

Vercel 同时为两个域名签发 HTTPS 证书。

## 验证

验证默认 Vercel 地址：

```powershell
curl.exe -I https://zcloud-blog.vercel.app
```

验证自定义域名：

```powershell
curl.exe -I https://zcloud.ren --max-time 30
curl.exe -I https://www.zcloud.ren --max-time 30
```

最终结果：

```text
https://zcloud.ren      200 OK
https://www.zcloud.ren  200 OK
Server: Vercel
```

## 常见问题

### 域名已经在 Vercel 添加了，为什么还是不能访问？

只在 Vercel 添加域名不够，域名服务商里的 DNS 也必须指向 Vercel。

### 要不要购买阿里云付费 DNS 套餐？

个人博客不需要。阿里云免费 DNS 解析就够用。

### `www` 用 A 记录还是 CNAME？

本次使用：

```text
www A 76.76.21.21
```

Vercel 常见配置也可以使用：

```text
www CNAME cname.vercel-dns.com
```

同一个主机记录不要同时配置 A 和 CNAME。

### PowerShell 访问 HTTPS 报 TLS 错误怎么办？

本次部署后，PowerShell 的 `Invoke-WebRequest` 曾偶发 TLS 报错，但 `curl.exe` 返回 `200 OK`。这种情况通常是本机 TLS 栈、代理或缓存导致，不代表公网访问失败。

优先用以下命令验证：

```powershell
curl.exe -I https://zcloud.ren --max-time 30
```

## 后续更新网站

以后修改代码后，推荐流程：

```powershell
git add .
git commit -m "update blog"
git push
```

如果 GitHub 与 Vercel 自动部署已连接，push 后 Vercel 会自动重新构建和发布。

也可以手动部署：

```powershell
npx --yes vercel@latest deploy --prod --yes
```

