/**
 * Settings Page - Configuration and system status
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Palette,
  Server,
  Code2,
  Zap,
  Globe,
  Clock,
  Info,
  Plus,
  Trash2,
  TestTube,
  Loader2,
  AlertTriangle,
  Key,
  Pencil,
} from 'lucide-react';
import { useSystemStatus, useFunctions, useTokenUsage } from '@/lib/hooks/useApi';
import { useTranslation } from '@/lib/i18n';
import { formatNumber, cn } from '@/lib/utils';
import { connectionsService } from '@/lib/services/connections';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import type { WeaviateConnection, ConnectionCreateRequest, ConnectionTestRequest } from '@/lib/types/auth';

// ============ Status Card ============
interface StatusCardProps {
  title: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'loading';
  details?: string;
  action?: React.ReactNode;
}

function StatusCard({ title, icon, status, details, action }: StatusCardProps) {
  const { t } = useTranslation();
  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-all',
      status === 'connected' && 'border-green-500/30 bg-green-500/5',
      status === 'disconnected' && 'border-red-500/30 bg-red-500/5',
      status === 'loading' && 'border-border bg-card'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-xl p-2.5',
            status === 'connected' && 'bg-green-500/10 text-green-500',
            status === 'disconnected' && 'bg-red-500/10 text-red-500',
            status === 'loading' && 'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              {status === 'connected' && (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-sm text-green-500">{t('settings.connected')}</span>
                </>
              )}
              {status === 'disconnected' && (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-sm text-red-500">{t('settings.disconnected')}</span>
                </>
              )}
              {status === 'loading' && (
                <span className="text-sm text-muted-foreground">{t('settings.checking')}</span>
              )}
            </div>
            {details && (
              <p className="text-xs text-muted-foreground mt-1">{details}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

// ============ Config Item ============
interface ConfigItemProps {
  label: string;
  value: string;
  description?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}

function ConfigItem({ label, value, description, editable = false, onChange }: ConfigItemProps) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {editable ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <code className="text-sm bg-muted px-2 py-1 rounded">{value}</code>
      )}
    </div>
  );
}

// ============ Stats Overview ============
function StatsOverview() {
  const { data: functions } = useFunctions();
  const { data: tokens } = useTokenUsage();
  const { t } = useTranslation();

  const stats = [
    {
      label: t('settings.registeredFunctions'),
      value: formatNumber(functions?.total || 0),
      icon: <Code2 className="h-4 w-4" />,
    },
    {
      label: t('settings.totalTokensUsed'),
      value: formatNumber(tokens?.total_tokens || 0),
      icon: <Zap className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {stat.icon}
            <span className="text-xs">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// ============ Connection Manager ============
function ConnectionManager() {
  const [connections, setConnections] = useState<WeaviateConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formType, setFormType] = useState<'self_hosted' | 'wcs_cloud'>('self_hosted');
  const [formName, setFormName] = useState('');
  const [formHost, setFormHost] = useState('localhost');
  const [formPort, setFormPort] = useState(8080);
  const [formGrpcPort, setFormGrpcPort] = useState(50051);
  const [formApiKey, setFormApiKey] = useState('');
  const [formVectorizerModel, setFormVectorizerModel] = useState('openai');

  const fetchConnections = useCallback(async () => {
    try {
      const data = await connectionsService.list();
      setConnections(data.items);
    } catch {
      // not logged in or error
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
    setFormVectorizerModel('openai');
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
      const vectorizerModel = formType === 'self_hosted'
        ? 'openai'
        : formVectorizerModel;
      const req: ConnectionCreateRequest = {
        name: formName || (formType === 'wcs_cloud' ? 'WCS Cloud' : 'Self-Hosted'),
        connection_type: formType,
        host: formHost,
        port: formPort,
        grpc_port: formGrpcPort,
        api_key: formApiKey || undefined,
        vectorizer_type: vectorizerModel === 'openai' ? 'openai' : 'huggingface',
        vectorizer_model: vectorizerModel === 'openai' ? 'text-embedding-3-small' : 'sentence-transformers/all-MiniLM-L6-v2',
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVectorizer, setEditVectorizer] = useState('openai');

  // Per-connection API key state
  const [keyEditingId, setKeyEditingId] = useState<string | null>(null);
  const [connApiKey, setConnApiKey] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { checkAuth } = useAuthStore();

  const handleKeySave = async (connectionId: string) => {
    if (!connApiKey.trim()) return;
    setKeySaving(true);
    setKeyMessage(null);
    try {
      await connectionsService.updateApiKey(connectionId, connApiKey.trim());
      setConnApiKey('');
      setKeyMessage({ type: 'success', text: t('settings.apiKeySaved') });
      setTimeout(() => { setKeyMessage(null); setKeyEditingId(null); }, 3000);
      await fetchConnections();
      await checkAuth();
    } catch (e: any) {
      setKeyMessage({ type: 'error', text: e.message });
    } finally {
      setKeySaving(false);
    }
  };

  const handleKeyDelete = async (connectionId: string) => {
    setKeySaving(true);
    setKeyMessage(null);
    try {
      await connectionsService.deleteApiKey(connectionId);
      setKeyMessage({ type: 'success', text: t('settings.apiKeyDeleted') });
      setTimeout(() => { setKeyMessage(null); setKeyEditingId(null); }, 3000);
      await fetchConnections();
      await checkAuth();
    } catch (e: any) {
      setKeyMessage({ type: 'error', text: e.message });
    } finally {
      setKeySaving(false);
    }
  };

  const handleEdit = (conn: WeaviateConnection) => {
    setEditingId(conn.id);
    setEditVectorizer(conn.vectorizer_type === 'openai' ? 'openai' : 'huggingface');
  };

  const handleEditSave = async (id: string) => {
    try {
      await connectionsService.update(id, {
        vectorizer_type: editVectorizer,
        vectorizer_model: editVectorizer === 'openai' ? 'text-embedding-3-small' : 'sentence-transformers/all-MiniLM-L6-v2',
      });
      setEditingId(null);
      await fetchConnections();
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    }
  };

  const handleActivate = async (id: string) => {
    await connectionsService.activate(id);
    await fetchConnections();
    await checkAuth();
  };

  const handleDelete = async (id: string) => {
    await connectionsService.remove(id);
    await fetchConnections();
  };

  const { t } = useTranslation();

  if (loading) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;

  return (
    <div className="space-y-4">
      {/* Connection List */}
      {connections.length > 0 ? (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.id} className="space-y-2">
              <div
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 transition-all',
                  conn.is_active
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center gap-3">
                  <Database className={cn('h-4 w-4', conn.is_active ? 'text-green-500' : 'text-muted-foreground')} />
                  <div>
                    <p className="text-sm font-medium">
                      {conn.name}
                      {conn.is_active && <span className="ml-2 text-xs text-green-500">(Active)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conn.connection_type === 'wcs_cloud' ? 'WCS Cloud' : 'Self-Hosted'} - {conn.host}:{conn.port}
                      {conn.connection_type === 'wcs_cloud' && (
                        <span className={cn(
                          'ml-2 text-xs',
                          conn.vectorizer_type ? 'opacity-60' : 'text-yellow-500'
                        )}>
                          ({conn.vectorizer_type === 'openai' ? 'OpenAI' : conn.vectorizer_type === 'huggingface' ? 'HuggingFace' : 'Vectorizer not set'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setKeyEditingId(keyEditingId === conn.id ? null : conn.id); setConnApiKey(''); setKeyMessage(null); }}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      conn.has_openai_key
                        ? 'text-green-500 hover:bg-green-500/10'
                        : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'
                    )}
                    title={conn.has_openai_key ? 'OpenAI API Key configured' : 'Set OpenAI API Key'}
                  >
                    <Key className="h-3.5 w-3.5" />
                  </button>
                  {conn.connection_type === 'wcs_cloud' && (
                    <button
                      onClick={() => handleEdit(conn)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!conn.is_active && (
                    <button
                      onClick={() => handleActivate(conn.id)}
                      className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      {t('projects.activate')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {editingId === conn.id && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">{t('settings.vectorizerModel')}</label>
                    <div className="flex gap-2 mt-1">
                      {(['openai', 'huggingface'] as const).map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => setEditVectorizer(model)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                            editVectorizer === model
                              ? 'bg-primary text-white'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {model === 'openai' ? 'OpenAI (text-embedding-3-small)' : 'HuggingFace (all-MiniLM-L6-v2)'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(conn.id)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 transition-colors"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
              {keyEditingId === conn.id && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{t('settings.openaiApiKey')}</p>
                    {conn.has_openai_key && (
                      <span className="flex items-center gap-1.5 text-xs text-green-500">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {t('settings.hasApiKey')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={connApiKey}
                      onChange={(e) => setConnApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={() => handleKeySave(conn.id)}
                      disabled={keySaving || !connApiKey.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {keySaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      {t('common.save')}
                    </button>
                    {conn.has_openai_key && (
                      <button
                        onClick={() => handleKeyDelete(conn.id)}
                        disabled={keySaving}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => { setKeyEditingId(null); setConnApiKey(''); setKeyMessage(null); }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                  {keyMessage && (
                    <div className={cn(
                      'rounded-lg p-3 text-sm',
                      keyMessage.type === 'success'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    )}>
                      {keyMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t('settings.noConnections')}
        </div>
      )}

      {/* Add Connection Button / Form */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('settings.addConnection')}
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h4 className="text-sm font-semibold">{t('settings.newConnection')}</h4>

          {/* Type Tabs */}
          <div className="flex gap-2">
            {(['self_hosted', 'wcs_cloud'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setFormType(type); resetForm(); }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  formType === type
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {type === 'self_hosted' ? t('projects.selfHosted') : t('projects.wcsCloud')}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="grid gap-3">
            <div>
              <label className="text-xs text-muted-foreground">{t('settings.name')}</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={formType === 'wcs_cloud' ? 'My WCS Cluster' : 'My Local Weaviate'}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {formType === 'wcs_cloud' ? t('projects.clusterUrl') : t('projects.host')}
              </label>
              {formType === 'self_hosted' && /^(localhost|127\.0\.0\.1)$/i.test(formHost.trim()) && (
                <div className="mt-1 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-2.5 text-xs text-yellow-500">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{t('projects.localhostWarning')}</span>
                </div>
              )}
              <input
                value={formHost}
                onChange={(e) => setFormHost(e.target.value)}
                placeholder={formType === 'wcs_cloud' ? 'my-cluster.weaviate.network' : 'localhost'}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {formType === 'self_hosted' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{t('projects.httpPort')}</label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('projects.grpcPort')}</label>
                  <input
                    type="number"
                    value={formGrpcPort}
                    onChange={(e) => setFormGrpcPort(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {formType === 'wcs_cloud' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">{t('projects.apiKey')}</label>
                  <input
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Your WCS API key"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('settings.vectorizerModel')}</label>
                  <div className="flex gap-2 mt-1">
                    {(['openai', 'huggingface'] as const).map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => setFormVectorizerModel(model)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          formVectorizerModel === model
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {model === 'openai' ? 'OpenAI (text-embedding-3-small)' : 'HuggingFace (all-MiniLM-L6-v2)'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t('settings.vectorizerModelDesc')}</p>
                </div>
              </>
            )}

          </div>

          {/* Test Result */}
          {testResult && (
            <div className={cn(
              'rounded-lg p-3 text-sm',
              testResult.success
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            )}>
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !formHost}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
              {t('settings.test')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formHost}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {t('common.save')}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ AI Settings ============
function AISettings() {
  const { t } = useTranslation();
  const { user, setHasOpenaiKey } = useAuthStore();
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasKey = user?.has_openai_key ?? false;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await authService.updateApiKey(apiKey.trim());
      setHasOpenaiKey(result.has_key);
      setApiKey('');
      setMessage({ type: 'success', text: t('settings.apiKeySaved') });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await authService.updateApiKey(null);
      setHasOpenaiKey(result.has_key);
      setMessage({ type: 'success', text: t('settings.apiKeyDeleted') });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t('settings.openaiApiKey')} (Global Fallback)</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('settings.openaiApiKeyDesc')} Used when no per-connection key is set.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasKey ? (
            <span className="flex items-center gap-1.5 text-xs text-green-500">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('settings.hasApiKey')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('settings.noApiKey')}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {t('common.save')}
        </button>
        {hasKey && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            {t('settings.deleteApiKey')}
          </button>
        )}
      </div>

      {message && (
        <div className={cn(
          'rounded-lg p-3 text-sm',
          message.type === 'success'
            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        )}>
          {message.text}
        </div>
      )}
    </div>
  );
}

// ============ Quick Links ============
function QuickLinks() {
  const links = [
    {
      title: 'API Documentation',
      description: 'Swagger UI for VectorSurfer API',
      href: 'http://localhost:8000/docs',
      icon: <Server className="h-5 w-5" />,
    },
    {
      title: 'VectorWave SDK',
      description: 'GitHub repository',
      href: 'https://github.com/your-repo/vectorwave',
      icon: <Code2 className="h-5 w-5" />,
    },
    {
      title: 'Weaviate Console',
      description: 'Vector database management',
      href: 'http://localhost:8080',
      icon: <Database className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <a
          key={link.title}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-muted/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground group-hover:text-primary transition-colors">
              {link.icon}
            </div>
            <div>
              <p className="font-medium text-sm">{link.title}</p>
              <p className="text-xs text-muted-foreground">{link.description}</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      ))}
    </div>
  );
}

// ============ Main Page Component ============
export default function SettingsPage() {
  const { data: status, refetch, isRefetching } = useSystemStatus();
  const { t } = useTranslation();
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  );

  const dbStatus = status?.db_connected ? 'connected' : 'disconnected';
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Connection Status */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          {t('settings.connectionStatus')}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <StatusCard
            title={t('settings.weaviateDb')}
            icon={<Database className="h-5 w-5" />}
            status={isRefetching ? 'loading' : dbStatus}
            details={status ? `${status.registered_functions_count} ${t('settings.functionsRegistered')}` : undefined}
            action={
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="rounded-lg border border-border p-2 hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
              </button>
            }
          />
          
          <StatusCard
            title={t('settings.apiServer')}
            icon={<Server className="h-5 w-5" />}
            status={status ? 'connected' : 'disconnected'}
            details={apiUrl}
          />
        </div>
      </section>

      {/* Database Connections [BYOD] */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          {t('settings.databaseConnections')}
        </h2>
        <ConnectionManager />
      </section>

      {/* AI Settings */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          {t('settings.aiSettings')}
        </h2>
        <AISettings />
      </section>

      {/* Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          {t('settings.overview')}
        </h2>
        <StatsOverview />
      </section>

      {/* Configuration */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          {t('settings.configuration')}
        </h2>
        
        <div className="rounded-2xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('settings.configEnvNote')}
              </span>
            </div>
          </div>
          
          <div className="px-4">
            <ConfigItem
              label={t('settings.apiBaseUrl')}
              value={apiUrl}
              description="NEXT_PUBLIC_API_URL"
            />
            <ConfigItem
              label={t('settings.dataMode')}
              value={useMock ? t('settings.mockData') : t('settings.realApi')}
              description="NEXT_PUBLIC_USE_MOCK"
            />
            <ConfigItem
              label={t('settings.weaviateHost')}
              value={process.env.NEXT_PUBLIC_WEAVIATE_HOST || 'localhost:8080'}
              description="NEXT_PUBLIC_WEAVIATE_HOST"
            />
          </div>
        </div>

        {/* Mock Mode Warning */}
        {useMock && (
          <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Info className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="font-medium text-yellow-500">{t('settings.mockModeActive')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings.mockModeDesc')}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          {t('settings.quickLinks')}
        </h2>
        <QuickLinks />
      </section>

      {/* About */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          {t('settings.about')}
        </h2>
        
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">VectorSurfer</h3>
              <p className="text-sm text-muted-foreground">
                Vector-based Application Observability
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('settings.version')}</p>
              <p className="font-medium">2.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.framework')}</p>
              <p className="font-medium">Next.js 16 + React 19</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.styling')}</p>
              <p className="font-medium">Tailwind CSS v4</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.backend')}</p>
              <p className="font-medium">FastAPI + VectorWave</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        <p>VectorSurfer Dashboard • Built with 💙 for VectorWave SDK</p>
      </div>
    </div>
  );
}
