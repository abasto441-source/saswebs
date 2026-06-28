import { useBuilderStore } from '@/store/builderStore';

export const builderStore = {
  useBuilderStore
};

export interface PageBlock {
  id: string;
  type: 'hero' | 'features' | 'pricing' | 'cta' | 'contact' | 'products' | 'courses' | 'faq' | 'categories';
  content: Record<string, any>;
}

export function validateBlockStructure(block: PageBlock): boolean {
  return !!block.id && !!block.type && !!block.content;
}
