import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';

import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import MomentComments from '../../../components/MomentComments';
import SidebarLyric from '../../../components/SidebarLyric';
import ClientSocials from '../../../components/ClientSocials';
import { siteConfig } from '../../../siteConfig';

type TocItem = {
  level: number;
  text: string;
  id: string;
};

type MomentFile = {
  id: string;
  fullPath: string;
};

const categoryLabels: Record<string, string> = {
  'bug-fixes': '排障记录',
  deployment: '部署记录',
  notes: '随笔记录',
  life: '生活碎片',
  uncategorized: '未分类'
};

function getMomentDirs() {
  return [
    path.join(process.cwd(), 'posts', 'moments'),
    path.join(process.cwd(), 'moments')
  ];
}

function walkMomentFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMomentFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function getMomentFiles(): MomentFile[] {
  const moments = new Map<string, MomentFile>();

  getMomentDirs().forEach(dir => {
    if (!fs.existsSync(dir)) return;

    walkMomentFiles(dir).forEach(fullPath => {
      const id = path.relative(dir, fullPath).replace(/\\/g, '/').replace(/\.md$/, '');
      moments.set(id, { id, fullPath });
    });
  });

  return Array.from(moments.values());
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({
      level: match[1].length,
      text: match[2].trim(),
      id: match[2].trim().toLowerCase().replace(/\s+/g, '-')
    });
  }
  return toc;
}

function getTitle(content: string, fallback: string, frontmatterTitle?: string) {
  if (frontmatterTitle) return frontmatterTitle;
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) return titleMatch[1].trim();
  const firstLine = content.split(/\r?\n/).map(line => line.trim()).find(Boolean);
  if (firstLine && firstLine.length <= 80) return firstLine;
  return fallback.replace(/[-_]/g, ' ');
}

function stripLeadingTitle(content: string) {
  return content
    .replace(/^\s*#\s+.+\r?\n+/, '')
    .replace(/^\s*([^\n#][^\n]{0,79})\r?\n{2,}/, '');
}

function getCategoryLabel(category: string) {
  return categoryLabels[category] || category.replace(/[-_]/g, ' ');
}

export async function generateStaticParams() {
  return getMomentFiles().map(file => ({
    slug: file.id.split('/')
  }));
}

async function getMomentData(slugParts: string[]) {
  const slug = slugParts.join('/');
  const momentFile = getMomentFiles().find(file => file.id === slug);

  if (!momentFile) return null;

  const fileContents = fs.readFileSync(momentFile.fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const contentBody = stripLeadingTitle(content);
  const category = slugParts.length > 1 ? slugParts[0] : 'uncategorized';

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(contentBody);

  return {
    slug,
    title: getTitle(content, slugParts[slugParts.length - 1] || 'untitled', data.title),
    date: data.date || '1970-01-01',
    location: data.location || '',
    images: Array.isArray(data.images) ? data.images : [],
    category,
    categoryLabel: getCategoryLabel(category),
    contentHtml: processedContent.toString(),
    toc: extractToc(contentBody)
  };
}

export default async function MomentDetailPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const momentData = await getMomentData(resolvedParams.slug);

  if (!momentData) notFound();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[90%] max-w-6xl mx-auto mt-28 flex flex-col lg:flex-row gap-8 relative z-10">
          <article className="flex-1 bg-white/65 dark:bg-slate-800/55 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="p-8 md:p-12 relative">
              <BackButton />

              <header className="mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-6 relative">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                    {momentData.categoryLabel}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{momentData.date}</span>
                  {momentData.location && <span className="text-xs font-bold text-slate-400">{momentData.location}</span>}
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-700 pr-20 leading-tight">
                  {momentData.title}
                </h1>
              </header>

              <div className="relative">
                <style>{`
                  .prose pre {
                    background-color: #282c34 !important;
                    color: #abb2bf !important;
                    padding: 1.25rem !important;
                    border-radius: 0.75rem !important;
                    overflow-x: auto !important;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 1.5rem !important;
                  }
                  .prose pre code {
                    background-color: transparent !important;
                    padding: 0 !important;
                    color: inherit !important;
                    font-size: 0.9em !important;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                  }
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code {
                    background-color: rgba(99, 102, 241, 0.1) !important;
                    color: #6366f1 !important;
                    padding: 0.2rem 0.4rem !important;
                    border-radius: 0.375rem !important;
                    font-weight: 600 !important;
                  }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose h1 { font-size: 2.6rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; color: inherit !important; }
                  .prose h2 { font-size: 2rem !important; font-weight: 850 !important; margin-bottom: 1.25rem !important; margin-top: 2rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.4rem !important; font-weight: 750 !important; margin-bottom: 1rem !important; color: inherit !important; }
                  .prose p { font-size: 1.08rem !important; line-height: 1.85 !important; color: inherit !important; }
                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                  .prose img {
                    display: block !important;
                    margin: 2rem auto !important;
                    border-radius: 2rem !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
                    max-width: 100% !important;
                    height: auto !important;
                  }
                `}</style>

                <div
                  id="article-content"
                  className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: momentData.contentHtml }}
                />
              </div>

              {momentData.images.length > 0 && (
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {momentData.images.map((image: string, index: number) => (
                    <img key={image} src={image} alt={`moment image ${index + 1}`} className="w-full rounded-2xl border border-white/40 dark:border-white/10 shadow-xl object-cover" />
                  ))}
                </div>
              )}

              <div className="mt-16">
                <MomentComments id={`/moments/${momentData.slug}`} />
              </div>
            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center">
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md mb-4 transition-transform duration-500 hover:rotate-3">
                <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{siteConfig.authorName}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">{siteConfig.bio}</p>
              <ClientSocials />
            </div>

            <SidebarLyric />

            {momentData.toc.length > 0 && (
              <ClientTOC toc={momentData.toc} />
            )}
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
