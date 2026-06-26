export const runtime = 'edge';

import { NextResponse } from 'next/server';

// POST /api/ai/generate
export async function POST(request: Request) {
  try {
    const { prompt: userPrompt, mode = 'block', blockType, field } = await request.json();

    if (!userPrompt) {
      return NextResponse.json({ error: 'Falta prompt del usuario' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // --- FALLBACK: Simulación si no hay API Key ---
    if (!geminiKey || geminiKey.startsWith('re_') || geminiKey.includes('TU_API_KEY')) {
      console.warn('[AI GENERATE] Usando simulador porque GEMINI_API_KEY no está configurada.');
      
      if (mode === 'full_site') {
        return NextResponse.json({
          simulated: true,
          blocks: getSimulatedFullSite(userPrompt)
        });
      } else {
        return NextResponse.json({
          simulated: true,
          text: getSimulatedBlockText(userPrompt, blockType, field)
        });
      }
    }

    // --- REAL LLM: Llamar a la API de Google Gemini ---
    let systemPrompt = '';
    if (mode === 'full_site') {
      systemPrompt = `Eres un diseñador web experto. Genera una estructura de página web completa basada en el prompt del usuario.
Debes responder ÚNICAMENTE con un array JSON válido que contenga entre 3 y 5 bloques de diseño. Cada bloque debe ser un objeto con esta estructura:
{
  "id": "cadena-unica-id",
  "type": "tipo_de_bloque",
  "version": "1.0.0",
  "isVisible": true,
  "styles": {
    "padding": "py-16",
    "bgColor": "codigo-hex-color-adecuado-al-tema",
    "textAlign": "center" o "left"
  },
  "content": {
    // Campos específicos del tipo de bloque
  },
  "dynamicSource": {
    // Solo si aplica (ej. limit)
  }
}

Los tipos de bloques disponibles son:
- 'header': content: { "logo": string, "links": [{"label": string, "url": string}] }
- 'hero': content: { "title": string, "subtitle": string, "buttonText": string, "buttonLink": string, "imageUrl": string }
- 'columns_layout': content: { "col1_title": string, "col1_text": string, "col2_title": string, "col2_text": string, "col3_title": string, "col3_text": string }
- 'rich_text': content: { "title": string, "bodyText": string }
- 'gallery': content: { "title": string, "images": [{"url": string, "title": string}] }
- 'accordion_faq': content: { "title": string, "faqs": [{"q": string, "a": string}] }
- 'dynamic_product_grid': content: { "title": string, "subtitle": string }, dynamicSource: { "collectionId": "all", "limit": 3 }
- 'lms_course_list': content: { "title": string, "subtitle": string }, dynamicSource: { "limit": 2 }
- 'reservations_calendar': content: { "title": string, "subtitle": string }
- 'footer': content: { "copyText": string }

Asegúrate de que los colores de fondo ('bgColor') hagan buen contraste con el texto. Si es fondo oscuro, el texto debe ser claro.
Devuelve SOLO el JSON sin rodeos, sin bloques de código markdown (\`\`\`json ... \`\`\`).`;
    } else {
      systemPrompt = `Eres un redactor de contenidos profesional para sitios web.
Genera un texto optimizado para el campo "${field}" de un bloque de tipo "${blockType}" según la instrucción del usuario.
Responde de manera concisa, atractiva y directa, adecuada para ese elemento de la interfaz de usuario.
No des explicaciones ni uses etiquetas. Responde SOLO con el texto que debe ir en el campo.`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nInstrucción del usuario: "${userPrompt}"` }]
        }],
        generationConfig: mode === 'full_site' ? {
          responseMimeType: "application/json"
        } : undefined
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const data = await geminiResponse.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (mode === 'full_site') {
      try {
        const blocks = JSON.parse(resultText);
        return NextResponse.json({ success: true, blocks });
      } catch (e) {
        console.error('Error al parsear JSON generado por la IA:', resultText);
        return NextResponse.json({
          error: 'La IA no devolvió un formato JSON válido. Usando simulación de respaldo.',
          blocks: getSimulatedFullSite(userPrompt)
        });
      }
    } else {
      return NextResponse.json({ success: true, text: resultText });
    }

  } catch (err: any) {
    console.error('[AI GENERATE ERROR]', err);
    return NextResponse.json({ error: err.message || 'Error al generar contenido con IA' }, { status: 500 });
  }
}

// --- SIMULADORES DE RESPALDO (FALLBACKS) ---

function getSimulatedBlockText(prompt: string, blockType?: string, field?: string): string {
  const p = prompt.toLowerCase();
  if (field === 'imageUrl') {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800';
  }
  
  if (p.includes('dental') || p.includes('diente')) {
    return 'Cuidado dental profesional para toda la familia con la última tecnología médica.';
  }
  if (p.includes('comida') || p.includes('sabor')) {
    return 'Disfruta de una experiencia gastronómica inigualable con ingredientes de la granja a la mesa.';
  }
  return `Contenido autogenerado profesional para el campo ${field || 'texto'} adaptado a la instrucción: "${prompt}".`;
}

function getSimulatedFullSite(prompt: string): any[] {
  const p = prompt.toLowerCase();
  let title = 'Servicios Profesionales Celeste';
  let subtitle = 'Automatización, diseño e infraestructura digital avanzada.';
  let secondaryType = 'cms_collection_grid';
  let secondaryTitle = 'Artículos Recientes';
  let color = '#3b82f6';

  if (p.includes('dental') || p.includes('dentista') || p.includes('médic')) {
    title = 'Clínica Dental Sonrisas';
    subtitle = 'Tratamientos odontológicos avanzados y agendamiento de citas en línea.';
    secondaryType = 'reservations_calendar';
    secondaryTitle = 'Agenda tu Turno de Consulta';
    color = '#2563eb';
  } else if (p.includes('restaurant') || p.includes('comida') || p.includes('chef')) {
    title = 'Sabores Gourmet Bistró';
    subtitle = 'Cenas exclusivas, platillos artesanales y reservaciones de mesa instantáneas.';
    secondaryType = 'columns_layout';
    secondaryTitle = 'Nuestras Especialidades';
    color = '#ea580c';
  } else if (p.includes('tienda') || p.includes('ropa') || p.includes('ecommerce')) {
    title = 'Boutique Trend & Style';
    subtitle = 'Moda premium y accesorios con facturación POS offline sincronizada.';
    secondaryType = 'dynamic_product_grid';
    secondaryTitle = 'Productos Destacados';
    color = '#db2777';
  }

  return [
    {
      id: 'ai-h-' + Date.now(),
      type: 'header',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-4', bgColor: '#ffffff' },
      content: { logo: `✨ ${title.split(' ')[0]}`, links: [{ label: 'Inicio', url: '/' }, { label: 'Catálogo', url: '#servicios' }] }
    },
    {
      id: 'ai-he-' + Date.now(),
      type: 'hero',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-20', bgColor: color + '15', textAlign: 'center' },
      content: { title, subtitle, buttonText: 'Conocer Más', buttonLink: '#servicios', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800' }
    },
    {
      id: 'ai-sec-' + Date.now(),
      type: secondaryType,
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-16', bgColor: '#ffffff' },
      content: { title: secondaryTitle, subtitle: 'Accede a nuestros servicios integrados' },
      dynamicSource: { collectionId: 'all', limit: 3 }
    },
    {
      id: 'ai-f-' + Date.now(),
      type: 'footer',
      version: '1.0.0',
      isVisible: true,
      styles: { padding: 'py-8', bgColor: '#0f172a' },
      content: { copyText: `© ${new Date().getFullYear()} ${title}. Todos los derechos reservados.` }
    }
  ];
}
