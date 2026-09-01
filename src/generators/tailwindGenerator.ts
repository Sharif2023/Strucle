import type { LayoutNode } from '../model/types';

export const generateTailwindClasses = (node: LayoutNode): string => {
  const classes: string[] = [];
  const { layout } = node;

  if (!layout) return '';

  if (layout.display === 'flex') {
    classes.push('flex');
    if (layout.flexDirection === 'column') classes.push('flex-col');
    
    if (layout.justifyContent === 'center') classes.push('justify-center');
    else if (layout.justifyContent === 'space-between') classes.push('justify-between');
    else if (layout.justifyContent === 'space-around') classes.push('justify-around');
    else if (layout.justifyContent === 'end') classes.push('justify-end');
    
    if (layout.alignItems === 'center') classes.push('items-center');
    else if (layout.alignItems === 'start') classes.push('items-start');
    else if (layout.alignItems === 'end') classes.push('items-end');
    else if (layout.alignItems === 'stretch') classes.push('items-stretch');
    
    if (layout.flexWrap === 'wrap') classes.push('flex-wrap');
  } else if (layout.display === 'grid') {
    classes.push('grid');
    if (layout.gridColumns) {
      classes.push(`grid-cols-${layout.gridColumns}`);
    }
  }
  
  if (layout.gap) {
    // Basic mapping for gap
    const gapMap: Record<number, string> = {
      2: 'gap-0.5', 4: 'gap-1', 8: 'gap-2', 12: 'gap-3', 16: 'gap-4', 
      20: 'gap-5', 24: 'gap-6', 32: 'gap-8', 40: 'gap-10', 48: 'gap-12'
    };
    classes.push(gapMap[layout.gap] || `gap-[${layout.gap}px]`);
  }
  
  if (layout.width && layout.display !== 'block') {
    // simple mapping
    classes.push(`w-[${layout.width}px]`);
  } else if (layout.display === 'block' && layout.width) {
     classes.push(`w-[${layout.width}px]`);
  } else if (layout.display === 'block') {
     classes.push(`w-full`);
  }
  
  if (layout.height) {
    classes.push(`h-[${layout.height}px]`);
  }
  
  if (node.type === 'container') {
    if (!layout.height && node.id === 'root') classes.push('min-h-screen');
    else if (!layout.height) classes.push('min-h-[100px]');
  }

  return classes.join(' ');
};

export const generateReactCode = (node: LayoutNode, indent = 0): string => {
  const spaces = ' '.repeat(indent);
  const classes = generateTailwindClasses(node);
  
  let tag = 'div';
  const nameLower = (node.name || '').toLowerCase();
  if (nameLower.includes('header')) tag = 'header';
  else if (nameLower.includes('footer')) tag = 'footer';
  else if (nameLower.includes('nav')) tag = 'nav';
  else if (nameLower.includes('main')) tag = 'main';
  else if (nameLower.includes('section')) tag = 'section';
  else if (nameLower.includes('aside') || nameLower.includes('sidebar')) tag = 'aside';

  const props = classes ? ` className="${classes}"` : '';
  
  if (!node.children || node.children.length === 0) {
    if (node.type === 'text') {
      return `${spaces}<${tag}${props}>Text placeholder</${tag}>`;
    }
    return `${spaces}<${tag}${props} />`;
  }
  
  const childrenCode = node.children
    .map(child => generateReactCode(child, indent + 2))
    .join('\n');
    
  return `${spaces}<${tag}${props}>\n${childrenCode}\n${spaces}</${tag}>`;
};

export const generateNextPage = (node: LayoutNode): string => {
  return `export default function Page() {\n  return (\n${generateReactCode(node, 4)}\n  );\n}\n`;
};
