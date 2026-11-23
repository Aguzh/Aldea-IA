import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const ROOT_DIR = process.cwd();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

function collectSourceFiles(dirPath: string, baseRel = ''): Array<{ relPath: string; absPath: string }> {
  const results: Array<{ relPath: string; absPath: string }> = [];
  if (!fs.existsSync(dirPath)) return results;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name.startsWith('.')) {
      continue;
    }
    const absPath = path.join(dirPath, entry.name);
    const relPath = baseRel ? `${baseRel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(absPath, relPath));
    } else if (entry.isFile() && !entry.name.endsWith('.test.ts')) {
      results.push({ relPath, absPath });
    }
  }
  return results;
}

function buildLocalReadme(): string {
  return `# Aldea IA - Edición Local para PC

Simulador de vida autónomo en pixel art con evolución de eras, construcción de viviendas y edificios especiales, estaciones del año, cultivos, economía emergente, salud/envejecimiento (1 día = 1 año) y consola de reglas con **Qwen 2.5**.

## Opción 1: Ejecución rápida con Node.js

Requisitos: [Node.js 20+](https://nodejs.org/) instalado en tu PC.

### En Windows
Hacé doble clic en \`INICIAR_WINDOWS.bat\` (instala dependencias automáticamente la primera vez y abre http://localhost:3000).

### En Linux / Mac
\`\`\`bash
chmod +x iniciar.sh
./iniciar.sh
\`\`\`

### Manual (cualquier sistema)
\`\`\`bash
npm install
npm run dev
\`\`\`
Luego abrí en tu navegador: **http://localhost:3000**

## Opción 2: Conectar Qwen 2.5 real con Ollama (Opcional)

1. Instalá Ollama desde [ollama.com](https://ollama.com).
2. Descargá el modelo:
   \`\`\`bash
   ollama run qwen2.5:3b
   \`\`\`
3. Si abrís la app en tu navegador y querés permitir CORS hacia Ollama local, ejecutá Ollama con:
   - Windows (PowerShell): \`$env:OLLAMA_ORIGINS="*"; ollama serve\`
   - Linux/Mac: \`OLLAMA_ORIGINS="*" ollama serve\`
4. Dentro de **Aldea IA**, hacé clic en **Ollama**, activá **Activar peticiones en vivo a Ollama** y guardá.
`;
}

function buildStandalonePackageJson(): string {
  return JSON.stringify(
    {
      name: 'aldea-ia-local',
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite --port=3000 --host=127.0.0.1',
        build: 'vite build',
        preview: 'vite preview --port=3000',
        lint: 'tsc --noEmit',
      },
      dependencies: {
        'lucide-react': '^0.546.0',
        react: '^19.0.1',
        'react-dom': '^19.0.1',
      },
      devDependencies: {
        '@tailwindcss/vite': '^4.3.3',
        '@types/node': '^22.14.0',
        '@types/react': '^19.3.0',
        '@types/react-dom': '^19.3.0',
        '@vitejs/plugin-react': '^6.1.1',
        tailwindcss: '^4.3.3',
        typescript: '^7.0.2',
        vite: '^8.3.0',
      },
    },
    null,
    2
  );
}

function buildWindowsLauncher(): string {
  return `@echo off
title Aldea IA - Simulador Local
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] No se encontro Node.js instalado. Descargalo desde https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando dependencias por primera vez...
  call npm install
)
echo Iniciando Aldea IA en http://localhost:3000 ...
start "" http://localhost:3000
call npm run dev
pause
`;
}

function buildUnixLauncher(): string {
  return `#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias por primera vez..."
  npm install
fi
echo "Iniciando Aldea IA en http://localhost:3000 ..."
(sleep 2 && (xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null || true)) &
npm run dev
`;
}

const SAVE_DATA_DIR = path.join(ROOT_DIR, 'data');
const SAVE_STATE_FILE = path.join(SAVE_DATA_DIR, 'aldea-state.json');

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/state', (_req, res) => {
    try {
      if (!fs.existsSync(SAVE_STATE_FILE)) {
        res.json({ state: null });
        return;
      }
      const raw = fs.readFileSync(SAVE_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      res.json({ state: parsed });
    } catch (err) {
      console.error('Error leyendo estado persistido:', err);
      res.status(500).json({ error: 'No se pudo leer el estado guardado.' });
    }
  });

  app.post('/api/state', (req, res) => {
    try {
      const payload = req.body && typeof req.body === 'object' && 'state' in req.body ? req.body.state : req.body;
      if (!payload || !Array.isArray(payload.agents) || !Array.isArray(payload.houses)) {
        res.status(400).json({ error: 'Estado de simulación inválido.' });
        return;
      }
      fs.mkdirSync(SAVE_DATA_DIR, { recursive: true });
      const tmpPath = `${SAVE_STATE_FILE}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(payload), 'utf-8');
      fs.renameSync(tmpPath, SAVE_STATE_FILE);
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Error guardando estado en servidor:', err);
      res.status(500).json({ error: 'No se pudo guardar el estado.' });
    }
  });

  app.delete('/api/state', (_req, res) => {
    try {
      if (fs.existsSync(SAVE_STATE_FILE)) {
        fs.unlinkSync(SAVE_STATE_FILE);
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Error eliminando estado guardado:', err);
      res.status(500).json({ error: 'No se pudo eliminar el estado.' });
    }
  });

  app.get('/api/download-portable', async (_req, res) => {
    try {
      const prebuiltPath = path.join(ROOT_DIR, 'dist', 'aldea-ia-local.html');
      if (fs.existsSync(prebuiltPath)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="aldea-ia-local.html"');
        res.sendFile(prebuiltPath);
        return;
      }

      // En desarrollo, compilar CSS si falta dist/assets y generar portable al vuelo
      const distAssetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      if (!fs.existsSync(distAssetsDir)) {
        const { build } = await import('vite');
        await build({ logLevel: 'silent' });
      }
      const { generatePortableHtml } = await import('./scripts/build-portable.mjs');
      const html = await generatePortableHtml(ROOT_DIR);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="aldea-ia-local.html"');
      res.send(html);
    } catch (err) {
      console.error('Error generando HTML portable:', err);
      res.status(500).json({ error: 'No se pudo generar el archivo portable.' });
    }
  });

  app.get('/api/download-project', async (_req, res) => {
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder('aldea-ia-local');
      if (!rootFolder) throw new Error('No se pudo inicializar el archivo ZIP');

      const srcFiles = collectSourceFiles(path.join(ROOT_DIR, 'src'), 'src');
      for (const file of srcFiles) {
        rootFolder.file(file.relPath, fs.readFileSync(file.absPath));
      }

      for (const rootFile of ['index.html', 'tsconfig.json', 'vite.config.ts']) {
        const abs = path.join(ROOT_DIR, rootFile);
        if (fs.existsSync(abs)) {
          rootFolder.file(rootFile, fs.readFileSync(abs));
        }
      }

      rootFolder.file('package.json', buildStandalonePackageJson());
      rootFolder.file('README.md', buildLocalReadme());
      rootFolder.file('INICIAR_WINDOWS.bat', buildWindowsLauncher());
      rootFolder.file('iniciar.sh', buildUnixLauncher(), { unixPermissions: '755' });

      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="aldea-ia-proyecto.zip"');
      res.send(buffer);
    } catch (err) {
      console.error('Error generando ZIP del proyecto:', err);
      res.status(500).json({ error: 'No se pudo generar el paquete del proyecto.' });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aldea IA ejecutándose en http://localhost:${PORT}`);
  });
}

startServer();
