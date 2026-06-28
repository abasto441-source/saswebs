export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
}

export function compileDocumentTemplate(template: DocumentTemplate, variables: Record<string, string>): string {
  let compiled = template.content;
  Object.entries(variables).forEach(([key, val]) => {
    compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });
  return compiled;
}
