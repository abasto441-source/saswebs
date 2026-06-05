const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Pipeline de Producción: Figma → Supabase');

// Paths
const jsxPath = path.join(__dirname, 'src', 'app', 'builder', 'TemplateBuilder.jsx');
const dbFilePath = path.join(__dirname, 'src', 'lib', 'supabase.ts');
const jsonOutputPath = path.join(__dirname, 'supabase', 'figma_template.json');
const sqlOutputPath = path.join(__dirname, 'supabase', 'migrations', '20260605000002_insert_figma_template.sql');

if (!fs.existsSync(jsxPath)) {
  console.error(`❌ Error: No se encontró el archivo del Ensamblador en ${jsxPath}`);
  process.exit(1);
}

// 1. Read TemplateBuilder.jsx
const content = fs.readFileSync(jsxPath, 'utf8');

// 2. Parse JS Object variables using brace counting
function parseObjectVar(source, varName) {
  const regex = new RegExp(`const\\s+${varName}\\s*=\\s*\\{`);
  const match = source.match(regex);
  if (!match) {
    console.warn(`⚠️ Advertencia: No se encontró la variable ${varName} en el Ensamblador.`);
    return null;
  }
  
  const startIndex = match.index + match[0].length - 1; // Index of '{'
  let braceCount = 1;
  let endIndex = startIndex + 1;
  
  while (braceCount > 0 && endIndex < source.length) {
    if (source[endIndex] === '{') braceCount++;
    else if (source[endIndex] === '}') braceCount--;
    endIndex++;
  }
  
  const objStr = source.substring(startIndex, endIndex);
  try {
    // Safely evaluate local javascript object literal representation
    return new Function(`return ${objStr}`)();
  } catch (err) {
    console.error(`❌ Error al evaluar variable ${varName}:`, err);
    return null;
  }
}

console.log('📂 [1/5] Extrayendo variables del Ensamblador...');
const heroData = parseObjectVar(content, 'sampleHero') || {
  title: 'Digitaliza tu Academia con Celeste LMS',
  subtitle: 'La infraestructura Odoo-style con CNAME dedicados.',
  buttonText: 'Empezar Auditoría',
  bgHex: '#bce6ed'
};

const featuresData = parseObjectVar(content, 'sampleFeatures') || {
  bgColor: '#ffffff',
  items: []
};

const footerData = parseObjectVar(content, 'sampleFooter') || {
  copyText: '© 2026 NRAM360 Corporativo. Todos los derechos reservados.'
};

// 3. Serialize into the 4-layer JSON schema (Id, Type, Styles, Content)
console.log('🔄 [2/5] Serializando componentes React a JSON...');
const blocks = [
  {
    id: 'b-figma-h',
    type: 'hero',
    version: '1.0.0',
    isVisible: true,
    styles: {
      padding: 'py-24',
      bgColor: heroData.bgHex || '#bce6ed',
      textAlign: 'center',
      borderRadius: 'xl'
    },
    content: {
      title: heroData.title,
      subtitle: heroData.subtitle,
      buttonText: heroData.buttonText,
      buttonLink: '#'
    }
  },
  {
    id: 'b-figma-f',
    type: 'columns_layout',
    version: '1.0.0',
    isVisible: true,
    styles: {
      padding: 'py-16',
      bgColor: featuresData.bgColor || '#ffffff'
    },
    content: {
      col1_title: featuresData.items[0]?.title || '',
      col1_text: featuresData.items[0]?.desc || '',
      col2_title: featuresData.items[1]?.title || '',
      col2_text: featuresData.items[1]?.desc || '',
      col3_title: featuresData.items[2]?.title || '',
      col3_text: featuresData.items[2]?.desc || ''
    }
  },
  {
    id: 'b-figma-ft',
    type: 'footer',
    version: '1.0.0',
    isVisible: true,
    styles: {
      padding: 'py-8',
      bgColor: '#111827'
    },
    content: {
      copyText: footerData.copyText
    }
  }
];

const serializedJson = JSON.stringify(blocks, null, 2);

// Save JSON file
if (!fs.existsSync(path.dirname(jsonOutputPath))) {
  fs.mkdirSync(path.dirname(jsonOutputPath), { recursive: true });
}
fs.writeFileSync(jsonOutputPath, serializedJson, 'utf8');
console.log(`✅ [3/5] JSON guardado con éxito en: ${jsonOutputPath}`);

// 4. Generate SQL migration script for Supabase
console.log('✍️ [4/5] Generando script SQL para Supabase...');
const sqlStatement = `-- SQL Migration: Insert Figma Assembled Template
INSERT INTO templates (
  id, 
  name, 
  category, 
  preview_image, 
  industry, 
  is_premium, 
  required_modules, 
  blocks_included, 
  version, 
  structure_json
) VALUES (
  'tpl-figma', 
  '🎨 Plantilla Figma Assembled (Paso 4)', 
  'corporate', 
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', 
  'Figma Assembler Output', 
  false, 
  '[]'::jsonb, 
  '["hero", "columns_layout", "footer"]'::jsonb, 
  '1.0.0', 
  '${JSON.stringify(blocks).replace(/'/g, "''")}'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  structure_json = EXCLUDED.structure_json;
`;

if (!fs.existsSync(path.dirname(sqlOutputPath))) {
  fs.mkdirSync(path.dirname(sqlOutputPath), { recursive: true });
}
fs.writeFileSync(sqlOutputPath, sqlStatement, 'utf8');
console.log(`✅ SQL guardado con éxito en: ${sqlOutputPath}`);

// 5. Update mock database seed array (INITIAL_TEMPLATES in src/lib/supabase.ts)
console.log('🔄 [5/5] Registrando plantilla en el mock del catálogo local...');
if (fs.existsSync(dbFilePath)) {
  let dbContent = fs.readFileSync(dbFilePath, 'utf8');
  
  if (dbContent.includes("id: 'tpl-figma'")) {
    console.log('ℹ️ La plantilla tpl-figma ya se encuentra en supabase.ts, actualizando estructura JSON...');
    // Replace existing tpl-figma structureJson with the new one
    const startIdx = dbContent.indexOf("id: 'tpl-figma'");
    // Find the next structureJson line
    const searchArea = dbContent.substring(startIdx, startIdx + 1000);
    const structRegex = /structureJson:\s*('[^']+'|"[^"]+")/;
    const match = searchArea.match(structRegex);
    if (match) {
      const originalLine = match[0];
      const newLine = `structureJson: ${JSON.stringify(JSON.stringify(blocks))}`;
      dbContent = dbContent.replace(originalLine, newLine);
      fs.writeFileSync(dbFilePath, dbContent, 'utf8');
      console.log('✅ Catálogo local actualizado correctamente.');
    }
  } else {
    // Locate the end of the tpl-corporate block and append tpl-figma
    const insertionPoint = `      { id: 'b-ns', type: 'newsletter_sub', version: '1.0.0', isVisible: true, styles: { padding: 'py-16', bgColor: '#bce6ed', textAlign: 'center', borderRadius: 'xl' }, content: { title: 'Suscríbete para Auditorías Gratuitas' } },
      { id: 'b-f4', type: 'footer', version: '1.0.0', isVisible: true, styles: { padding: 'py-8', bgColor: '#1f2937' }, content: { copyText: '© 2026 Consultora Pro. Todos los derechos reservados.' } }
    ])
  }`;
    
    if (dbContent.includes(insertionPoint)) {
      const escapedJson = JSON.stringify(JSON.stringify(blocks));
      const newTemplateEntry = `,
  {
    id: 'tpl-figma',
    name: '🎨 Plantilla Figma Assembled (Paso 4)',
    category: 'corporate',
    previewImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
    industry: 'Figma Assembler Output',
    isPremium: false,
    requiredModules: [],
    blocksIncluded: ['hero', 'columns_layout', 'footer'],
    version: '1.0.0',
    structureJson: ${escapedJson}
  }`;
      
      dbContent = dbContent.replace(insertionPoint, insertionPoint + newTemplateEntry);
      fs.writeFileSync(dbFilePath, dbContent, 'utf8');
      console.log('✅ Catálogo local actualizado correctamente.');
    } else {
      console.error('❌ Error: No se pudo encontrar el punto de inserción en supabase.ts.');
    }
  }
} else {
  console.error(`❌ Error: No se encontró el archivo del adaptador en ${dbFilePath}`);
}

console.log('\n🎉 Pipeline ejecutado con éxito. Ejecute "npm run dev" para probar.');
