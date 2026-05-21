---
date: "2026-05-20"
location: "zcloud.ren"
images: []
---

Vercel 部署与 zcloud.ren 域名绑定记录

目标：
把本地 Next.js 博客项目部署到 Vercel，并让外部用户通过 https://zcloud.ren 和 https://www.zcloud.ren 访问。

项目信息：
- 本地项目目录：D:\zjq\blog\XinghuisamaBlogs-main\XinghuisamaBlogs-main\XHBlogs
- Vercel 账号：zclouder
- Vercel 团队：zclouders-projects
- Vercel 项目：zcloud-blog
- GitHub 仓库：https://github.com/ZClouder/Cloud_Blog
- 默认 Vercel 地址：https://zcloud-blog.vercel.app

GitHub 与 Vercel 的区别：
GitHub 是代码托管平台，用来保存代码、管理版本、记录提交和协作。
Vercel 是部署平台，用来拉取代码、构建 Next.js 项目，并把网站发布到公网。

推荐流程：
本地代码 -> push 到 GitHub -> Vercel 拉取代码并构建 -> Vercel 发布网站 -> 域名 DNS 指向 Vercel -> 用户通过 zcloud.ren 访问。

部署过程：
1. 进入项目目录：
cd D:\zjq\blog\XinghuisamaBlogs-main\XinghuisamaBlogs-main\XHBlogs

2. 本地构建验证：
npm run build

构建结果：
Next.js 16.2.1
Compiled successfully
Generated static pages: 13/13
Build passed

3. 登录 Vercel：
npx --yes vercel@latest whoami

登录完成后账号为：
zclouder

4. 绑定 Vercel 项目：
npx --yes vercel@latest link --yes --project zcloud-blog

绑定结果：
Linked zclouders-projects/zcloud-blog
Connected GitHub repository: https://github.com/ZClouder/Cloud_Blog

5. 生产部署：
npx --yes vercel@latest deploy --prod --yes

部署结果：
Status: READY
Production URL: https://zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app
Alias: https://zcloud-blog.vercel.app

域名 DNS 配置：
域名 zcloud.ren 在阿里云云解析 DNS 管理。

最终保留两条记录：
@    A    默认    76.76.21.21
www  A    默认    76.76.21.21

旧记录曾经是：
@    A    198.18.0.14
www  A    198.18.0.15

这两个旧 IP 不是 Vercel 地址，会导致 Vercel 无法签发证书，域名也无法正常访问。

Vercel 域名绑定：
DNS 记录改成 76.76.21.21 后，执行：
npx --yes vercel@latest alias set zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app zcloud.ren
npx --yes vercel@latest alias set zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app www.zcloud.ren

绑定结果：
https://zcloud.ren now points to zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app
https://www.zcloud.ren now points to zcloud-blog-5ocwrfbn2-zclouders-projects.vercel.app

最终验证：
curl.exe -I https://zcloud.ren --max-time 30
curl.exe -I https://www.zcloud.ren --max-time 30

结果：
https://zcloud.ren      200 OK
https://www.zcloud.ren  200 OK
Server: Vercel

后续更新网站：
推荐通过 GitHub 自动部署：
git add .
git commit -m "update blog"
git push

GitHub 与 Vercel 自动部署已连接，push 后 Vercel 会自动重新构建和发布。

也可以手动部署：
npx --yes vercel@latest deploy --prod --yes
