declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';

  type TaskListOptions = {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  };

  function markdownItTaskLists(md: MarkdownIt, options?: TaskListOptions): void;

  export = markdownItTaskLists;
}
