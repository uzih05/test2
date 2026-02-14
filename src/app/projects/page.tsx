/**
 * Project Selection Page
 * [BYOD] After login, user picks or adds a Weaviate connection ("project").
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Waves,
  Plus,
  Trash2,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  Server,
  Cloud,
  ArrowRight,
  LogOut,
  Rocket,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { connectionsService } from '@/lib/services/connections';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useTranslation } from '@/lib/i18n';
import { QuickStartGuide } from '@/components/projects/QuickStartGuide';
import type { WeaviateConnection, ConnectionCreateRequest, ConnectionTestRequest } from '@/lib/types/auth';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [connections, setConnections] = useState<WeaviateConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Form state
  const [formType, setFormType] = useState<'self_hosted' | 'wcs_cloud'>('self_hosted');
  const [formName, setFormName] = useState('');
  const [formHost, setFormHost] = useState('localhost');
  const [formPort, setFormPort] = useState(8080);
  const [formGrpcPort, setFormGrpcPort] = useState(50051);
  const [formApiKey, setFormApiKey] = useState('');

  const fetchConnections = useCallback(async () => {
    try {
      const data = await connectionsService.list();
      setConnections(data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const resetForm = () => {
    setFormName('');
    setFormHost(formType === 'wcs_cloud' ? '' : 'localhost');
    setFormPort(8080);
    setFormGrpcPort(50051);
    setFormApiKey('');
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const req: ConnectionTestRequest = {
        connection_type: formType,
        host: formHost,
        port: formPort,
        grpc_port: formGrpcPort,
        api_key: formApiKey || undefined,
      };
      const result = await connectionsService.test(req);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const req: ConnectionCreateRequest = {
        name: formName || (formType === 'wcs_cloud' ? 'WCS Cloud' : 'Self-Hosted'),
        connection_type: formType,
        host: formHost,
        port: formPort,
        grpc_port: formGrpcPort,
        api_key: formApiKey || undefined,
      };
      await connectionsService.create(req);
      setShowForm(false);
      resetForm();
      await fetchConnections();
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (conn: WeaviateConnection) => {
    setActivating(conn.id);
    try {
      if (!conn.is_active) {
        await connectionsService.activate(conn.id);
      }
      sessionStorage.setItem('project_selected', 'true');
      router.push('/');
    } catch {
      setActivating(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await connectionsService.remove(id);
    await fetchConnections();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('project_selected');
    logout();
    router.push('/login');
  };

  const handleQuickStart = (type: 'self_hosted' | 'wcs_cloud') => {
    setFormType(type);
    setFormName('');
    setFormHost(type === 'self_hosted' ? 'localhost' : '');
    setFormPort(8080);
    setFormGrpcPort(50051);
    setFormApiKey('');
    setTestResult(null);
    setShowQuickStart(false);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Purple glow orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-border/50 px-8 py-4 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Waves className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">VectorSurfer</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('projects.logout')}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className={cn(
        'relative z-10 flex-1 flex flex-col items-center px-6',
        connections.length > 0 ? 'py-8' : 'py-12'
      )}>
        <div className={cn(
          'w-full max-w-3xl',
          connections.length > 0 ? 'space-y-5' : 'space-y-8'
        )}>
          {/* Title */}
          <div className={cn(
            'text-center',
            connections.length > 0 ? 'space-y-1' : 'space-y-2'
          )}>
            <h1 className={cn(
              'font-bold tracking-tight',
              connections.length > 0 ? 'text-2xl' : 'text-3xl'
            )}>{t('projects.title')}</h1>
            {connections.length === 0 && (
              <p className="text-muted-foreground">
                {t('projects.subtitle')}
              </p>
            )}
          </div>

          {/* Connection List */}
          {connections.length > 0 && (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  onClick={() => !activating && handleSelect(conn)}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'w-full flex items-center justify-between rounded-2xl border p-6 text-left transition-all cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/[0.08] hover-glow',
                    conn.is_active
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'rounded-xl p-3',
                      conn.connection_type === 'wcs_cloud'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-orange-500/10 text-orange-500'
                    )}>
                      {conn.connection_type === 'wcs_cloud'
                        ? <Cloud className="h-5 w-5" />
                        : <Server className="h-5 w-5" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold">
                        {conn.name}
                        {conn.is_active && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="h-3 w-3" /> {t('projects.active')}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conn.connection_type === 'wcs_cloud' ? t('projects.wcsCloud') : t('projects.selfHosted')} — {conn.host}:{conn.port}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(conn.id, e)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {activating === conn.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State → Quick Start Guide */}
          {connections.length === 0 && !showForm && (
            <QuickStartGuide
              onStartWCS={() => handleQuickStart('wcs_cloud')}
              onStartDocker={() => handleQuickStart('self_hosted')}
            />
          )}

          {/* Quick Start for existing users (toggled) */}
          {connections.length > 0 && showQuickStart && !showForm && (
            <QuickStartGuide
              onStartWCS={() => handleQuickStart('wcs_cloud')}
              onStartDocker={() => handleQuickStart('self_hosted')}
            />
          )}

          {/* Add Project Button / Form */}
          {!showForm ? (
            connections.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowForm(true); resetForm(); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {t('projects.addNew')}
                </button>
                <button
                  onClick={() => setShowQuickStart(!showQuickStart)}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-medium transition-colors',
                    showQuickStart
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary'
                  )}
                >
                  <Rocket className="h-4 w-4" />
                  {t('quickStart.showQuickStart')}
                </button>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-border card-glass p-6 space-y-5">
              <h3 className="font-semibold text-lg">{t('projects.newProject')}</h3>

              {/* Type Tabs */}
              <div className="flex gap-2">
                {(['self_hosted', 'wcs_cloud'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setFormType(type); resetForm(); }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                      formType === type
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {type === 'self_hosted'
                      ? <><Server className="h-4 w-4" /> {t('projects.selfHosted')}</>
                      : <><Cloud className="h-4 w-4" /> {t('projects.wcsCloud')}</>
                    }
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="grid gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">{t('projects.projectName')}</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={formType === 'wcs_cloud' ? 'My WCS Cluster' : 'My Local Weaviate'}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    {formType === 'wcs_cloud' ? t('projects.clusterUrl') : t('projects.host')}
                  </label>
                  {formType === 'self_hosted' && /^(localhost|127\.0\.0\.1)$/i.test(formHost.trim()) && (
                    <div className="mt-1.5 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-500">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{t('projects.localhostWarning')}</span>
                    </div>
                  )}
                  <input
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder={formType === 'wcs_cloud' ? 'my-cluster.weaviate.network' : 'localhost'}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                {formType === 'self_hosted' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">{t('projects.httpPort')}</label>
                      <input
                        type="number"
                        value={formPort}
                        onChange={(e) => setFormPort(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t('projects.grpcPort')}</label>
                      <input
                        type="number"
                        value={formGrpcPort}
                        onChange={(e) => setFormGrpcPort(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {formType === 'wcs_cloud' && (
                  <div>
                    <label className="text-sm text-muted-foreground">{t('projects.apiKey')}</label>
                    <input
                      type="password"
                      value={formApiKey}
                      onChange={(e) => setFormApiKey(e.target.value)}
                      placeholder="Your WCS API key"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

              </div>

              {/* Privacy Note */}
              <p className="text-xs text-muted-foreground">
                {t('projects.privacyNote')}
              </p>

              {/* Test Result */}
              {testResult && (
                <div className={cn(
                  'flex items-center gap-2 rounded-xl p-4 text-sm',
                  testResult.success
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                )}>
                  {testResult.success
                    ? <CheckCircle className="h-4 w-4 shrink-0" />
                    : <XCircle className="h-4 w-4 shrink-0" />
                  }
                  {testResult.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleTest}
                  disabled={testing || !formHost}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  {t('projects.testConnection')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formHost}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {t('projects.addProject')}
                </button>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
