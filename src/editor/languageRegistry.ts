import { LanguageDescription, LanguageSupport, StreamLanguage } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { fileName } from '../utils/path';

export type EditorLanguageKind =
  | 'markdown'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'jsx'
  | 'tsx'
  | 'python'
  | 'rust'
  | 'java'
  | 'shell'
  | 'plaintext';

type LanguageSpec = {
  id: Exclude<EditorLanguageKind, 'plaintext' | 'markdown'>;
  /** LanguageDescription.name + 围栏 info 别名 */
  aliases: string[];
  extensions: string[];
  load: () => Promise<LanguageSupport>;
};

function loadShellSupport(): Promise<LanguageSupport> {
  return import('@codemirror/legacy-modes/mode/shell').then(
    (m) => new LanguageSupport(StreamLanguage.define(m.shell)),
  );
}

/** 整文件与围栏共用的语言加载表（不含 markdown） */
const languageSpecs: LanguageSpec[] = [
  {
    id: 'json',
    aliases: ['json'],
    extensions: ['json'],
    load: () => import('@codemirror/lang-json').then((m) => m.json()),
  },
  {
    id: 'javascript',
    aliases: ['javascript', 'js', 'node'],
    extensions: ['js', 'mjs', 'cjs'],
    load: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  },
  {
    id: 'typescript',
    aliases: ['typescript', 'ts'],
    extensions: ['ts', 'mts', 'cts'],
    load: () =>
      import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  },
  {
    id: 'jsx',
    aliases: ['jsx'],
    extensions: ['jsx'],
    load: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  },
  {
    id: 'tsx',
    aliases: ['tsx'],
    extensions: ['tsx'],
    load: () =>
      import('@codemirror/lang-javascript').then((m) =>
        m.javascript({ jsx: true, typescript: true })
      ),
  },
  {
    id: 'python',
    aliases: ['python', 'py'],
    extensions: ['py', 'pyw'],
    load: () => import('@codemirror/lang-python').then((m) => m.python()),
  },
  {
    id: 'rust',
    aliases: ['rust', 'rs'],
    extensions: ['rs'],
    load: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  },
  {
    id: 'java',
    aliases: ['java'],
    extensions: ['java'],
    load: () => import('@codemirror/lang-java').then((m) => m.java()),
  },
  {
    id: 'shell',
    aliases: ['shell', 'bash', 'sh', 'zsh'],
    extensions: ['sh', 'bash', 'zsh', 'ksh'],
    load: loadShellSupport,
  },
];

const extensionToKind = new Map<string, EditorLanguageKind>([
  ['md', 'markdown'],
  ['markdown', 'markdown'],
  ...languageSpecs.flatMap((spec) => spec.extensions.map((ext) => [ext, spec.id] as const)),
]);

/** Markdown 围栏 codeLanguages（按需 load，与整文件共用 load） */
export const fenceCodeLanguages: LanguageDescription[] = languageSpecs.map((spec) => {
  const [name, ...alias] = spec.aliases;
  return LanguageDescription.of({
    name: name ?? spec.id,
    alias,
    extensions: spec.extensions,
    load: spec.load,
  });
});

function fileExtension(path: string): string {
  const name = fileName(path);
  const dot = name.lastIndexOf('.');
  if (dot <= 0) {
    return '';
  }
  return name.slice(dot + 1).toLowerCase();
}

/** 按文件扩展名决定编辑器语言（大小写不敏感） */
export function editorLanguageKind(path: string): EditorLanguageKind {
  return extensionToKind.get(fileExtension(path)) ?? 'plaintext';
}

/** 当前是否提供 Markdown 预览（仅 .md / .markdown） */
export function supportsMarkdownPreview(path: string): boolean {
  return editorLanguageKind(path) === 'markdown';
}

/** 按需加载语言扩展；plaintext 不加载语言包 */
export async function loadLanguageExtension(kind: EditorLanguageKind): Promise<Extension> {
  if (kind === 'plaintext') {
    return [];
  }
  if (kind === 'markdown') {
    const { markdown } = await import('@codemirror/lang-markdown');
    return markdown({ codeLanguages: fenceCodeLanguages });
  }
  const spec = languageSpecs.find((item) => item.id === kind);
  return spec ? spec.load() : [];
}
