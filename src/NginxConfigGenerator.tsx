import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Sun, Moon, Languages, Server } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'Nginx Config Generator',
    subtitle: 'Generate nginx server blocks with SSL, proxy_pass, static files, rate limiting, and redirects. Client-side only.',
    config: 'Configuration',
    configDesc: 'Set your server block options',
    output: 'Output',
    outputDesc: 'Generated nginx configuration',
    preset: 'Preset Template',
    presetReverseProxy: 'Reverse Proxy',
    presetStaticSite: 'Static Site',
    presetRedirect: 'HTTP Redirect',
    serverName: 'Server Name',
    serverNamePlaceholder: 'e.g. example.com www.example.com',
    listenPort: 'Listen Port',
    enableSsl: 'Enable SSL/TLS',
    sslCert: 'SSL Certificate Path',
    sslKey: 'SSL Key Path',
    enableProxy: 'Enable proxy_pass',
    proxyPass: 'Proxy Pass URL',
    proxyPassPlaceholder: 'e.g. http://localhost:3000',
    enableStatic: 'Serve Static Files',
    documentRoot: 'Document Root',
    documentRootPlaceholder: '/var/www/html',
    enableRedirect: 'HTTP to HTTPS Redirect',
    redirectTarget: 'Redirect Target',
    redirectTargetPlaceholder: 'https://example.com$request_uri',
    enableRateLimit: 'Enable Rate Limiting',
    rateLimitZone: 'Limit Zone Name',
    rateLimitRate: 'Rate',
    rateLimitBurst: 'Burst',
    enableGzip: 'Enable Gzip',
    enableAccessLog: 'Enable Access Log',
    accessLogPath: 'Access Log Path',
    enableErrorLog: 'Enable Error Log',
    errorLogPath: 'Error Log Path',
    copy: 'Copy',
    copied: 'Copied!',
    builtBy: 'Built by',
  },
  pt: {
    title: 'Gerador de Config Nginx',
    subtitle: 'Gere blocos de servidor nginx com SSL, proxy_pass, arquivos estaticos, rate limiting e redirecionamentos. Tudo no navegador.',
    config: 'Configuracao',
    configDesc: 'Defina as opcoes do bloco de servidor',
    output: 'Saida',
    outputDesc: 'Configuracao nginx gerada',
    preset: 'Template Predefinido',
    presetReverseProxy: 'Proxy Reverso',
    presetStaticSite: 'Site Estatico',
    presetRedirect: 'Redirecionamento HTTP',
    serverName: 'Nome do Servidor',
    serverNamePlaceholder: 'ex: exemplo.com www.exemplo.com',
    listenPort: 'Porta de Escuta',
    enableSsl: 'Habilitar SSL/TLS',
    sslCert: 'Caminho do Certificado SSL',
    sslKey: 'Caminho da Chave SSL',
    enableProxy: 'Habilitar proxy_pass',
    proxyPass: 'URL do Proxy Pass',
    proxyPassPlaceholder: 'ex: http://localhost:3000',
    enableStatic: 'Servir Arquivos Estaticos',
    documentRoot: 'Raiz dos Documentos',
    documentRootPlaceholder: '/var/www/html',
    enableRedirect: 'Redirecionamento HTTP para HTTPS',
    redirectTarget: 'Destino do Redirecionamento',
    redirectTargetPlaceholder: 'https://exemplo.com$request_uri',
    enableRateLimit: 'Habilitar Rate Limiting',
    rateLimitZone: 'Nome da Zona de Limite',
    rateLimitRate: 'Taxa',
    rateLimitBurst: 'Burst',
    enableGzip: 'Habilitar Gzip',
    enableAccessLog: 'Habilitar Log de Acesso',
    accessLogPath: 'Caminho do Log de Acesso',
    enableErrorLog: 'Habilitar Log de Erro',
    errorLogPath: 'Caminho do Log de Erro',
    copy: 'Copiar',
    copied: 'Copiado!',
    builtBy: 'Criado por',
  },
} as const

type Lang = keyof typeof translations

// ── Config state ──────────────────────────────────────────────────────────────
interface NginxConfig {
  serverName: string
  listenPort: string
  enableSsl: boolean
  sslCert: string
  sslKey: string
  enableProxy: boolean
  proxyPass: string
  enableStatic: boolean
  documentRoot: string
  enableRedirect: boolean
  redirectTarget: string
  enableRateLimit: boolean
  rateLimitZone: string
  rateLimitRate: string
  rateLimitBurst: string
  enableGzip: boolean
  enableAccessLog: boolean
  accessLogPath: string
  enableErrorLog: boolean
  errorLogPath: string
}

const defaultConfig: NginxConfig = {
  serverName: 'example.com www.example.com',
  listenPort: '80',
  enableSsl: false,
  sslCert: '/etc/letsencrypt/live/example.com/fullchain.pem',
  sslKey: '/etc/letsencrypt/live/example.com/privkey.pem',
  enableProxy: true,
  proxyPass: 'http://localhost:3000',
  enableStatic: false,
  documentRoot: '/var/www/html',
  enableRedirect: false,
  redirectTarget: 'https://example.com$request_uri',
  enableRateLimit: false,
  rateLimitZone: 'api',
  rateLimitRate: '10r/s',
  rateLimitBurst: '20',
  enableGzip: true,
  enableAccessLog: true,
  accessLogPath: '/var/log/nginx/access.log',
  enableErrorLog: true,
  errorLogPath: '/var/log/nginx/error.log',
}

const presets: Record<string, Partial<NginxConfig>> = {
  reverseProxy: {
    listenPort: '80',
    enableSsl: false,
    enableProxy: true,
    proxyPass: 'http://localhost:3000',
    enableStatic: false,
    enableRedirect: false,
    enableRateLimit: false,
    enableGzip: true,
  },
  staticSite: {
    listenPort: '443',
    enableSsl: true,
    enableProxy: false,
    enableStatic: true,
    documentRoot: '/var/www/html',
    enableRedirect: false,
    enableRateLimit: false,
    enableGzip: true,
  },
  redirect: {
    listenPort: '80',
    enableSsl: false,
    enableProxy: false,
    enableStatic: false,
    enableRedirect: true,
    enableRateLimit: false,
    enableGzip: false,
  },
}

// ── Config generator ───────────────────────────────────────────────────────────
function generateConfig(c: NginxConfig): string {
  const lines: string[] = []

  if (c.enableRateLimit) {
    lines.push(`limit_req_zone $binary_remote_addr zone=${c.rateLimitZone || 'api'}:10m rate=${c.rateLimitRate || '10r/s'};`)
    lines.push('')
  }

  lines.push('server {')
  lines.push(`    listen ${c.listenPort || '80'};`)

  if (c.enableSsl) {
    lines.push(`    listen 443 ssl;`)
    lines.push(`    http2 on;`)
  }

  if (c.serverName.trim()) {
    lines.push(`    server_name ${c.serverName.trim()};`)
  }

  if (c.enableSsl && c.sslCert && c.sslKey) {
    lines.push('')
    lines.push(`    ssl_certificate     ${c.sslCert};`)
    lines.push(`    ssl_certificate_key ${c.sslKey};`)
    lines.push(`    ssl_protocols       TLSv1.2 TLSv1.3;`)
    lines.push(`    ssl_ciphers         HIGH:!aNULL:!MD5;`)
  }

  if (c.enableGzip) {
    lines.push('')
    lines.push('    gzip on;')
    lines.push('    gzip_vary on;')
    lines.push('    gzip_types text/plain text/css application/json application/javascript text/xml;')
  }

  if (c.enableAccessLog) {
    lines.push('')
    lines.push(`    access_log ${c.accessLogPath || '/var/log/nginx/access.log'};`)
  }

  if (c.enableErrorLog) {
    lines.push(`    error_log  ${c.errorLogPath || '/var/log/nginx/error.log'};`)
  }

  if (c.enableRedirect) {
    lines.push('')
    lines.push('    location / {')
    lines.push(`        return 301 ${c.redirectTarget || 'https://example.com$request_uri'};`)
    lines.push('    }')
  } else if (c.enableProxy) {
    lines.push('')
    lines.push('    location / {')
    if (c.enableRateLimit) {
      lines.push(`        limit_req zone=${c.rateLimitZone || 'api'} burst=${c.rateLimitBurst || '20'} nodelay;`)
    }
    lines.push(`        proxy_pass ${c.proxyPass || 'http://localhost:3000'};`)
    lines.push('        proxy_http_version 1.1;')
    lines.push('        proxy_set_header Upgrade $http_upgrade;')
    lines.push('        proxy_set_header Connection "upgrade";')
    lines.push('        proxy_set_header Host $host;')
    lines.push('        proxy_set_header X-Real-IP $remote_addr;')
    lines.push('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
    lines.push('        proxy_set_header X-Forwarded-Proto $scheme;')
    lines.push('        proxy_cache_bypass $http_upgrade;')
    lines.push('    }')
  } else if (c.enableStatic) {
    lines.push('')
    lines.push('    location / {')
    lines.push(`        root  ${c.documentRoot || '/var/www/html'};`)
    lines.push('        index index.html index.htm;')
    lines.push('        try_files $uri $uri/ =404;')
    lines.push('    }')
  }

  lines.push('}')

  return lines.join('\n')
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NginxConfigGenerator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [config, setConfig] = useState<NginxConfig>(defaultConfig)
  const [copied, setCopied] = useState(false)

  const t = translations[lang]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const output = generateConfig(config)

  const patch = (p: Partial<NginxConfig>) => setConfig(c => ({ ...c, ...p }))

  const applyPreset = (key: keyof typeof presets) => setConfig(c => ({ ...c, ...presets[key] }))

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }, [output])

  const inputCls = 'w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
  const checkboxCls = 'h-4 w-4 cursor-pointer accent-green-500 rounded'
  const labelCls = 'block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Server size={18} className="text-white" />
            </div>
            <span className="font-semibold">Nginx Config Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/nginx-config-generator" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Config panel */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
              <div>
                <h2 className="font-semibold">{t.config}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.configDesc}</p>
              </div>

              {/* Presets */}
              <div>
                <label className={labelCls}>{t.preset}</label>
                <div className="flex flex-wrap gap-2">
                  {(['reverseProxy', 'staticSite', 'redirect'] as const).map(key => (
                    <button key={key} onClick={() => applyPreset(key)} className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors">
                      {key === 'reverseProxy' ? t.presetReverseProxy : key === 'staticSite' ? t.presetStaticSite : t.presetRedirect}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server name + port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>{t.serverName}</label>
                  <input className={inputCls} placeholder={t.serverNamePlaceholder} value={config.serverName} onChange={e => patch({ serverName: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{t.listenPort}</label>
                  <input className={inputCls} value={config.listenPort} onChange={e => patch({ listenPort: e.target.value })} />
                </div>
              </div>

              {/* SSL */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableSsl} onChange={e => patch({ enableSsl: e.target.checked })} />
                  <span className="text-sm font-medium">{t.enableSsl}</span>
                </label>
                {config.enableSsl && (
                  <div className="pl-6 space-y-2">
                    <div>
                      <label className={labelCls}>{t.sslCert}</label>
                      <input className={inputCls} value={config.sslCert} onChange={e => patch({ sslCert: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>{t.sslKey}</label>
                      <input className={inputCls} value={config.sslKey} onChange={e => patch({ sslKey: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>

              {/* Proxy */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableProxy} onChange={e => patch({ enableProxy: e.target.checked, enableStatic: false, enableRedirect: false })} />
                  <span className="text-sm font-medium">{t.enableProxy}</span>
                </label>
                {config.enableProxy && (
                  <div className="pl-6">
                    <label className={labelCls}>{t.proxyPass}</label>
                    <input className={inputCls} placeholder={t.proxyPassPlaceholder} value={config.proxyPass} onChange={e => patch({ proxyPass: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Static */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableStatic} onChange={e => patch({ enableStatic: e.target.checked, enableProxy: false, enableRedirect: false })} />
                  <span className="text-sm font-medium">{t.enableStatic}</span>
                </label>
                {config.enableStatic && (
                  <div className="pl-6">
                    <label className={labelCls}>{t.documentRoot}</label>
                    <input className={inputCls} placeholder={t.documentRootPlaceholder} value={config.documentRoot} onChange={e => patch({ documentRoot: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Redirect */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableRedirect} onChange={e => patch({ enableRedirect: e.target.checked, enableProxy: false, enableStatic: false })} />
                  <span className="text-sm font-medium">{t.enableRedirect}</span>
                </label>
                {config.enableRedirect && (
                  <div className="pl-6">
                    <label className={labelCls}>{t.redirectTarget}</label>
                    <input className={inputCls} placeholder={t.redirectTargetPlaceholder} value={config.redirectTarget} onChange={e => patch({ redirectTarget: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Rate limiting */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableRateLimit} onChange={e => patch({ enableRateLimit: e.target.checked })} />
                  <span className="text-sm font-medium">{t.enableRateLimit}</span>
                </label>
                {config.enableRateLimit && (
                  <div className="pl-6 grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>{t.rateLimitZone}</label>
                      <input className={inputCls} value={config.rateLimitZone} onChange={e => patch({ rateLimitZone: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>{t.rateLimitRate}</label>
                      <input className={inputCls} value={config.rateLimitRate} onChange={e => patch({ rateLimitRate: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>{t.rateLimitBurst}</label>
                      <input className={inputCls} value={config.rateLimitBurst} onChange={e => patch({ rateLimitBurst: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>

              {/* Gzip + Logs */}
              <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableGzip} onChange={e => patch({ enableGzip: e.target.checked })} />
                  <span className="text-sm">{t.enableGzip}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableAccessLog} onChange={e => patch({ enableAccessLog: e.target.checked })} />
                  <span className="text-sm">{t.enableAccessLog}</span>
                </label>
                {config.enableAccessLog && (
                  <div className="pl-6">
                    <input className={inputCls} value={config.accessLogPath} onChange={e => patch({ accessLogPath: e.target.value })} />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={config.enableErrorLog} onChange={e => patch({ enableErrorLog: e.target.checked })} />
                  <span className="text-sm">{t.enableErrorLog}</span>
                </label>
                {config.enableErrorLog && (
                  <div className="pl-6">
                    <input className={inputCls} value={config.errorLogPath} onChange={e => patch({ errorLogPath: e.target.value })} />
                  </div>
                )}
              </div>
            </div>

            {/* Output */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="font-semibold text-sm">{t.output}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.outputDesc}</p>
                </div>
                <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre">{output}</pre>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-green-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
