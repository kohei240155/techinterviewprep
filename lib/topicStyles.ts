type TopicStyle = {
  icon: string;
  color: string;
  bgClass: string;
  textClass: string;
};

const topicStyleMap: Record<string, TopicStyle> = {
  closures: {
    icon: 'data_object',
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  prototypes: {
    icon: 'account_tree',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  async: {
    icon: 'bolt',
    color: 'purple',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  this: {
    icon: 'fingerprint',
    color: 'rose',
    bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
  generics: {
    icon: 'shield',
    color: 'indigo',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    textClass: 'text-indigo-600 dark:text-indigo-400',
  },
  memory: {
    icon: 'memory',
    color: 'emerald',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  'virtual-dom': {
    icon: 'layers',
    color: 'sky',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
    textClass: 'text-sky-600 dark:text-sky-400',
  },
  hooks: {
    icon: 'anchor',
    color: 'cyan',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    textClass: 'text-cyan-600 dark:text-cyan-400',
  },
  css: {
    icon: 'palette',
    color: 'pink',
    bgClass: 'bg-pink-100 dark:bg-pink-900/30',
    textClass: 'text-pink-600 dark:text-pink-400',
  },
  promises: {
    icon: 'handshake',
    color: 'violet',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    textClass: 'text-violet-600 dark:text-violet-400',
  },
  'event-loop': {
    icon: 'loop',
    color: 'orange',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  typescript: {
    icon: 'code',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  react: {
    icon: 'widgets',
    color: 'sky',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
    textClass: 'text-sky-600 dark:text-sky-400',
  },
  testing: {
    icon: 'bug_report',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-600 dark:text-green-400',
  },
  performance: {
    icon: 'speed',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-600 dark:text-red-400',
  },
  security: {
    icon: 'lock',
    color: 'slate',
    bgClass: 'bg-slate-100 dark:bg-slate-900/30',
    textClass: 'text-slate-600 dark:text-slate-400',
  },
};

const fallbackStyles: TopicStyle[] = [
  { icon: 'school', color: 'amber', bgClass: 'bg-amber-100 dark:bg-amber-900/30', textClass: 'text-amber-600 dark:text-amber-400' },
  { icon: 'lightbulb', color: 'blue', bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400' },
  { icon: 'extension', color: 'purple', bgClass: 'bg-purple-100 dark:bg-purple-900/30', textClass: 'text-purple-600 dark:text-purple-400' },
  { icon: 'hub', color: 'rose', bgClass: 'bg-rose-100 dark:bg-rose-900/30', textClass: 'text-rose-600 dark:text-rose-400' },
  { icon: 'auto_awesome', color: 'indigo', bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', textClass: 'text-indigo-600 dark:text-indigo-400' },
  { icon: 'explore', color: 'emerald', bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', textClass: 'text-emerald-600 dark:text-emerald-400' },
  { icon: 'tune', color: 'sky', bgClass: 'bg-sky-100 dark:bg-sky-900/30', textClass: 'text-sky-600 dark:text-sky-400' },
];

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const getTopicStyle = (topicNameEn: string): TopicStyle => {
  const key = topicNameEn.toLowerCase().replace(/\s+/g, '-');

  for (const [mapKey, style] of Object.entries(topicStyleMap)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      return style;
    }
  }

  return fallbackStyles[hashString(key) % fallbackStyles.length];
};
