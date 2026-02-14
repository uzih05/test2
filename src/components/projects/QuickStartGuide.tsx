'use client';

import { useState } from 'react';
import {
  Cloud,
  Server,
  Package,
  ExternalLink,
  Copy,
  Check,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface QuickStartGuideProps {
  onStartWCS: () => void;
  onStartDocker: () => void;
}

export function QuickStartGuide({ onStartWCS, onStartDocker }: QuickStartGuideProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const dockerCommand = 'docker compose -f vw_docker-compose.yml up -d';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Rocket className="h-4 w-4" />
          {t('quickStart.title')}
        </div>
        <p className="text-muted-foreground">{t('quickStart.subtitle')}</p>
      </div>

      {/* Two cards: WCS + Docker */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* WCS Cloud Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="rounded-xl p-3 bg-blue-500/10 text-blue-500">
              <Cloud className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{t('quickStart.wcsTitle')}</h3>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                  {t('quickStart.recommended')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t('quickStart.wcsDesc')}</p>
            </div>
          </div>

          <ol className="space-y-2 text-sm text-muted-foreground pl-1">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-500">1</span>
              {t('quickStart.wcsStep1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-500">2</span>
              {t('quickStart.wcsStep2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-500">3</span>
              {t('quickStart.wcsStep3')}
            </li>
          </ol>

          <a
            href="https://console.weaviate.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors"
          >
            {t('quickStart.wcsConsoleLink')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="mt-auto pt-2">
            <button
              onClick={onStartWCS}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              {t('quickStart.startWCS')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Self-Hosted Docker Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="rounded-xl p-3 bg-orange-500/10 text-orange-500">
              <Server className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('quickStart.dockerTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('quickStart.dockerDesc')}</p>
            </div>
          </div>

          {/* Docker command */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-4 py-2.5">
            <code className="flex-1 text-xs text-foreground font-mono truncate">$ {dockerCommand}</code>
            <button
              onClick={() => handleCopy(dockerCommand, 'docker')}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={t('quickStart.copyCommand')}
            >
              {copied === 'docker' ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <ol className="space-y-2 text-sm text-muted-foreground pl-1">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-medium text-orange-500">1</span>
              {t('quickStart.dockerStep1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-medium text-orange-500">2</span>
              {t('quickStart.dockerStep2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-medium text-orange-500">3</span>
              {t('quickStart.dockerStep3')}
            </li>
          </ol>

          {/* Default connection info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
              <span className="text-muted-foreground">Host</span>
              <p className="font-mono font-medium">localhost</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
              <span className="text-muted-foreground">HTTP</span>
              <p className="font-mono font-medium">8080</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
              <span className="text-muted-foreground">gRPC</span>
              <p className="font-mono font-medium">50051</p>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <button
              onClick={onStartDocker}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {t('quickStart.startDocker')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SDK Section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl p-3 bg-violet-500/10 text-violet-500">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{t('quickStart.sdkTitle')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('quickStart.sdkDesc')}</p>
          </div>
        </div>

        {/* pip install command */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-4 py-2.5">
          <code className="flex-1 text-sm text-foreground font-mono">$ {t('quickStart.sdkCommand')}</code>
          <button
            onClick={() => handleCopy(t('quickStart.sdkCommand'), 'sdk')}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t('quickStart.copyCommand')}
          >
            {copied === 'sdk' ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <p className="text-sm text-muted-foreground">{t('quickStart.sdkStep1')}</p>

        <a
          href="https://docs.vectorwave.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-400 transition-colors"
        >
          {t('quickStart.sdkDocsLink')}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
