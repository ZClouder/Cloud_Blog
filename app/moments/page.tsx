import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: "说说 | " + siteConfig.authorName + " の 博客",
  description: "生活动态与瞬间记录",
};

type Moment = {
  id: string;
  slug: string;
  category: string;
  title: string;
  date: string;
  location: string;
  images: string[];
  content: string;
  excerpt: string;
};

const getTitle = (content: string, fallback: string, frontmatterTitle?: string) => {
  if (frontmatterTitle) return frontmatterTitle;
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) return titleMatch[1].trim();
  const firstLine = content.split(/\r?\n/).map(line => line.trim()).find(Boolean);
  if (firstLine && firstLine.length <= 80) return firstLine;
  return fallback.replace(/[-_]/g, ' ');
};

const getExcerpt = (content: string) => {
  return content
    .replace(/^\s*#\s+.+\r?\n+/, '')
    .replace(/^\s*([^\n#][^\n]{0,79})\r?\n{2,}/, '')
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>#-]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 180);
};

export default function MomentsPage() {
  let allMoments: Moment[] = [];

  try {
    // 🌟 终极防漏绝招：同时扫描两个可能的文件夹，把所有的说说都抓出来！
    const possibleDirs = [
      path.join(process.cwd(), 'posts', 'moments'),
      path.join(process.cwd(), 'moments')
    ];

    const walkMomentFiles = (dir: string): string[] => {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return walkMomentFiles(fullPath);
        return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
      });
    };

    possibleDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const filePaths = walkMomentFiles(dir);
        filePaths.forEach(fullPath => {
          const fileName = path.relative(dir, fullPath).replace(/\\/g, '/');
          const id = fileName.replace(/\.md$/, '');
          const slugParts = id.split('/');
          const fallbackTitle = slugParts[slugParts.length - 1] || 'untitled';
          const category = slugParts.length > 1 ? slugParts[0] : 'uncategorized';
          const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

          allMoments.push({
            id,
            slug: id,
            category,
            title: getTitle(content, fallbackTitle, data.title),
            date: data.date || '1970-01-01',
            location: data.location || '',
            images: Array.isArray(data.images) ? data.images : [],
            content: content.trim(),
            excerpt: getExcerpt(content)
          });
        });
      }
    });

    // 去重，防止你在两个文件夹放了同名文件
    allMoments = Array.from(new Map(allMoments.map(item => [item.id, item])).values());

  } catch (e) {
    console.error("读取说说数据失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition className="flex-1 flex flex-col">
        <MomentList
          moments={allMoments}
          authorName={siteConfig.authorName}
          avatarUrl={siteConfig.avatarUrl}
        />
      </PageTransition>
    </div>
  );
}
