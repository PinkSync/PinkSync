/**
 * PinkSync - Deno Server Entry Point
 * Lightweight web server using Deno's native HTTP capabilities
 */

// Import routes
import { handler as platformHandler } from "./routes/api/platform.ts";
import { handler as authHandler } from "./routes/api/auth.ts";
import { handler as workersHandler } from "./routes/api/workers.ts";
import { handler as transformHandler } from "./routes/api/transform.ts";
import { handler as researchHandler } from "./routes/api/research.ts";
import { handler as providersHandler } from "./routes/api/providers.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000");

// Simple router
async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // API Routes
  if (path === "/api/platform" && req.method === "GET") {
    return await platformHandler.GET(req);
  }
  
  if (path === "/api/auth" && req.method === "POST") {
    return await authHandler.POST(req);
  }
  
  if (path === "/api/workers") {
    if (req.method === "GET") {
      return await workersHandler.GET(req);
    } else if (req.method === "POST") {
      return await workersHandler.POST(req);
    }
  }
  
  if (path === "/api/transform") {
    if (req.method === "GET") {
      return await transformHandler.GET(req);
    } else if (req.method === "POST") {
      return await transformHandler.POST(req);
    }
  }
  
  if (path === "/api/research") {
    if (req.method === "GET") {
      return await researchHandler.GET(req);
    } else if (req.method === "POST") {
      return await researchHandler.POST(req);
    }
  }
  
  if (path === "/api/providers") {
    if (req.method === "GET") {
      return await providersHandler.GET(req);
    } else if (req.method === "POST") {
      return await providersHandler.POST(req);
    }
  }

  // Static files
  if (path.startsWith("/static/") || path.startsWith("/public/")) {
    try {
      const requestedPath = decodeURIComponent(path);
      const filePath = `${Deno.cwd()}${requestedPath}`;
      const root = `${Deno.cwd()}/`;
      if (!filePath.startsWith(root) || requestedPath.includes('..')) {
        return new Response('Not Found', { status: 404 });
      }
      const file = await Deno.readFile(filePath);
      const ext = path.split('.').pop() || '';
      const contentType = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml',
      }[ext] || 'application/octet-stream';
      
      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    } catch {
      // File not found, continue to 404
    }
  }

  // Home page
  if (path === "/" || path === "/index.html") {
    return new Response(await renderHomePage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // 404
  return new Response(await render404Page(), {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Render home page (server-side)
async function renderHomePage(): Promise<string> {
  try {
    // Fetch stats
    const statsResponse = await platformHandler.GET(new Request("http://localhost/api/platform"));
    const statsData = await statsResponse.json();
    const stats = statsData.success ? statsData.data : null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PinkSync - Accessibility Orchestration Platform</title>
  <meta name="description" content="Comprehensive accessibility platform for deaf users. One layer connecting services, transforming content, and enhancing digital experiences.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #eff6ff 100%); min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e5e7eb; padding: 1.5rem 0; }
    .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .logo-section { display: flex; align-items: center; gap: 1rem; }
    .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); border-radius: 0.75rem; display: flex; align-items: center; justify-center; color: white; font-weight: bold; font-size: 1.25rem; }
    .logo-text h1 { font-size: 1.875rem; font-weight: bold; background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-text p { font-size: 0.875rem; color: #6b7280; }
    .btn { padding: 0.5rem 1rem; border-radius: 0.375rem; text-decoration: none; display: inline-block; font-weight: 500; }
    .btn-primary { background: #db2777; color: white; }
    .btn-primary:hover { background: #be185d; }
    .btn-outline { border: 1px solid #d1d5db; color: #374151; }
    .btn-outline:hover { background: #f9fafb; }
    .hero { text-align: center; padding: 4rem 1rem; }
    .hero h2 { font-size: 3rem; font-weight: bold; background: linear-gradient(90deg, #db2777 0%, #9333ea 50%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1.5rem; }
    .hero p { font-size: 1.25rem; color: #6b7280; max-width: 48rem; margin: 0 auto 2rem; }
    .btn-group { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; }
    .btn-lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
    .btn-gradient { background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); color: white; }
    .btn-gradient:hover { opacity: 0.9; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 3rem 0; }
    .stat-card { background: white; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .stat-title { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
    .stat-icon { font-size: 1.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem; }
    .stat-subtitle { font-size: 0.75rem; color: #9ca3af; }
    .score-card { background: linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #dbeafe 100%); border-radius: 0.5rem; padding: 2rem; margin: 3rem 0; }
    .score-card h3 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .score-card .subtitle { color: #6b7280; margin-bottom: 1rem; }
    .score-value { font-size: 3rem; font-weight: bold; background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1rem; }
    .progress-bar { height: 0.5rem; background: #e5e7eb; border-radius: 9999px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); }
    footer { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-top: 1px solid #e5e7eb; padding: 2rem 0; margin-top: 4rem; }
    .footer-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .footer-link { color: #6b7280; text-decoration: none; font-size: 0.875rem; }
    .footer-link:hover { color: #db2777; }
    @media (max-width: 768px) {
      .hero h2 { font-size: 2rem; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">PS</div>
          <div class="logo-text">
            <h1>PinkSync</h1>
            <p>Accessibility Orchestration Platform</p>
          </div>
        </div>
        <div class="btn-group">
          ${stats ? `<span class="btn btn-outline">${stats.environment}</span>` : ''}
          <a href="/pinksync" class="btn btn-primary">Launch Demo</a>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <h2>One Layer of Accessibility</h2>
      <p>
        A comprehensive accessibility orchestration platform designed for deaf users.
        PinkSync listens, transforms, connects, and learns to provide seamless access to digital services.
      </p>
      <div class="btn-group">
        <a href="/pinksync" class="btn btn-lg btn-gradient">Try Demo</a>
        <a href="/docs" class="btn btn-lg btn-outline">Documentation</a>
      </div>
    </section>

    ${stats ? `
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Service Providers</span>
          <span class="stat-icon">🌐</span>
        </div>
        <div class="stat-value">${stats.services.apiBroker.activeProviders}</div>
        <div class="stat-subtitle">${stats.services.apiBroker.totalProviders} total providers</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Research Documents</span>
          <span class="stat-icon">📄</span>
        </div>
        <div class="stat-value">${stats.services.ragEngine.documentCount}</div>
        <div class="stat-subtitle">${stats.services.ragEngine.verifiedDocuments} verified</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Transformations</span>
          <span class="stat-icon">⚡</span>
        </div>
        <div class="stat-value">${stats.services.pinkFlow.totalTransformations}</div>
        <div class="stat-subtitle">~${Math.round(stats.services.pinkFlow.averageProcessingTime)}ms avg</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Background Jobs</span>
          <span class="stat-icon">📊</span>
        </div>
        <div class="stat-value">${stats.services.workers.totalJobs}</div>
        <div class="stat-subtitle">${stats.services.workers.activeWorkers} active workers</div>
      </div>
    </section>

    <section class="score-card">
      <h3>📈 Average Accessibility Score</h3>
      <p class="subtitle">Across all service providers</p>
      <div class="score-value">${stats.services.apiBroker.averageAccessibilityScore.toFixed(1)}%</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${stats.services.apiBroker.averageAccessibilityScore}%"></div>
      </div>
      <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
        PinkSync continuously evaluates and scores service providers based on their accessibility features and deaf-user friendliness.
      </p>
    </section>
    ` : `
    <section style="text-align: center; padding: 3rem 0;">
      <p style="color: #6b7280;">Loading platform statistics...</p>
    </section>
    `}
  </main>

  <footer>
    <div class="container">
      <div class="footer-content">
        <p style="color: #6b7280; font-size: 0.875rem;">
          © 2025 PinkSync. Built for and with the deaf community.
        </p>
        <div class="footer-links">
          <a href="/docs" class="footer-link">Documentation</a>
          <a href="/api" class="footer-link">API</a>
          <a href="/about" class="footer-link">About</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>
    `;
  } catch (error) {
    console.error("Error rendering home page:", error);
    return renderErrorPage("Unable to load platform statistics");
  }
}

async function render404Page(): Promise<string> {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page not found | PinkSync</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #eff6ff 100%); min-height: 100vh; display: flex; align-items: center; justify-center; }
    .error-container { text-align: center; padding: 2rem; }
    h1 { font-size: 8rem; font-weight: bold; background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    h2 { font-size: 2rem; color: #6b7280; margin: 1rem 0; }
    p { color: #9ca3af; margin-bottom: 2rem; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>404</h1>
    <h2>Page not found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/" class="btn">Go back home</a>
  </div>
</body>
</html>
  `;
}

function renderErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error | PinkSync</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #eff6ff 100%); min-height: 100vh; display: flex; align-items: center; justify-center; }
    .error-container { text-align: center; padding: 2rem; max-width: 600px; }
    h1 { font-size: 3rem; color: #6b7280; margin-bottom: 1rem; }
    p { color: #9ca3af; margin-bottom: 2rem; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(90deg, #db2777 0%, #9333ea 100%); color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>⚠️ Error</h1>
    <p>${message}</p>
    <a href="/" class="btn">Go back home</a>
  </div>
</body>
</html>
  `;
}

// Start server
console.log(`🚀 PinkSync server starting on http://localhost:${PORT}`);
console.log(`📚 Platform: Deno ${Deno.version.deno}`);
console.log(`🎯 Environment: ${Deno.env.get("PLATFORM_ENV") || "standalone"}`);

await Deno.serve({ port: PORT }, router);
