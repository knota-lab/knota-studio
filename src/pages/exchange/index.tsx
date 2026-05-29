import { Icon } from '@iconify/react';
import { useRequest } from 'ahooks';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exchangeKey, getExchangeInfo } from '@/api/api-keys';
import { ApiError } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useT } from '@/i18n';
import { toast } from '@/utils/toast';

// ─── Types ──────────────────────────────────────────────────

type PageState = 'loading' | 'preview' | 'result' | 'error';

interface ErrorState {
  title: string;
  description: string;
}

// ─── Masking helper ─────────────────────────────────────────

const maskApiKey = (key: string): string => {
  if (key.length <= 12) {
    return `${key.slice(0, 4)}${'*'.repeat(key.length - 4)}`;
  }
  return `${key.slice(0, 6)}${'*'.repeat(key.length - 10)}${key.slice(-4)}`;
};

// ─── Sub-components ─────────────────────────────────────────

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{children}</span>
  </div>
);

const LoadingView = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center gap-3 py-8">
    <Icon
      icon="svg-spinners:ring-resize"
      className="size-8 text-muted-foreground"
    />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const ErrorView = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center gap-3 py-8">
    <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
      <Icon icon="lucide:shield-x" className="size-6 text-destructive" />
    </div>
    <div className="text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

// ─── Main component ─────────────────────────────────────────

const ExchangePage = () => {
  const t = useT();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorInfo, setErrorInfo] = useState<ErrorState>({
    title: '',
    description: '',
  });
  const [tenantName, setTenantName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [resultKey, setResultKey] = useState('');
  const [resultRole, setResultRole] = useState('');
  const [resultExpires, setResultExpires] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);

  const showError = useCallback((title: string, description: string) => {
    setErrorInfo({ title, description });
    setPageState('error');
  }, []);

  const formatExpiry = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Fetch exchange info on mount
  useRequest(
    async () => {
      if (!token) {
        showError(
          t('Exchange.error.noToken', '缺少兑换令牌'),
          t('Exchange.error.noTokenDesc', '链接无效，请检查兑换链接是否完整'),
        );
        return null;
      }
      const data = await getExchangeInfo(token);
      return data;
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        if (data.alreadyUsed) {
          showError(
            t('Exchange.error.alreadyUsed', '令牌已使用'),
            t(
              'Exchange.error.alreadyUsedDesc',
              '此兑换链接已被使用，无法再次兑换',
            ),
          );
          return;
        }
        setTenantName(data.tenantName);
        setRoleName(data.roleName);
        setExpiresAt(data.expiresAt);
        setPageState('preview');
      },
      onError: (error: Error) => {
        let desc = t(
          'Exchange.error.fetchFailedDesc',
          '获取兑换信息失败，请检查链接是否有效',
        );
        if (error instanceof ApiError) {
          desc = error.message || desc;
        }
        showError(t('Exchange.error.fetchFailed', '加载失败'), desc);
      },
    },
  );

  // Exchange the key
  const { run: doExchange, loading: exchanging } = useRequest(
    async () => {
      if (!token) return null;
      const result = await exchangeKey(token);
      return result;
    },
    {
      manual: true,
      onSuccess: (data) => {
        if (!data) return;
        setResultKey(data.apiKey);
        setResultRole(data.roleName);
        setResultExpires(data.expiresAt);
        setKeyVisible(false);
        setPageState('result');
      },
    },
  );

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(resultKey);
    toast.success(t('Exchange.copied', '已复制到剪贴板'));
  }, [resultKey, t]);

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[480px]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Icon icon="lucide:key-round" className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl tracking-tight">
            {t('Exchange.title', 'API Key 兑换')}
          </CardTitle>
          <CardDescription>
            {pageState === 'result'
              ? t('Exchange.subtitle.success', '兑换成功，请妥善保存以下信息')
              : t(
                  'Exchange.subtitle.preview',
                  '确认以下信息后完成 API Key 兑换',
                )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {pageState === 'loading' && (
            <LoadingView
              message={t('Exchange.loading', '正在加载兑换信息...')}
            />
          )}

          {pageState === 'error' && (
            <ErrorView
              title={errorInfo.title}
              description={errorInfo.description}
            />
          )}

          {pageState === 'preview' && (
            <div className="flex flex-col gap-4">
              <InfoRow label={t('Exchange.info.tenant', '租户')}>
                <Badge variant="secondary">{tenantName}</Badge>
              </InfoRow>
              <InfoRow label={t('Exchange.info.role', '角色')}>
                <Badge variant="outline">{roleName}</Badge>
              </InfoRow>
              <InfoRow label={t('Exchange.info.expires', '过期时间')}>
                {formatExpiry(expiresAt)}
              </InfoRow>
              <Separator />
              <p className="text-sm text-muted-foreground">
                {t(
                  'Exchange.info.confirmHint',
                  '确认兑换后，系统将生成 API Key。请确保以上信息正确。',
                )}
              </p>
            </div>
          )}

          {pageState === 'result' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <Icon
                    icon="lucide:alert-triangle"
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                  />
                  <p className="text-sm font-medium text-destructive">
                    {t(
                      'Exchange.warning.showOnce',
                      '此 API Key 仅显示一次，请立即复制保存。关闭页面后无法再次查看。',
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('Exchange.result.apiKey', 'API Key')}
                </span>
                <code className="break-all rounded-md bg-muted p-3 font-mono text-sm leading-relaxed">
                  {keyVisible ? resultKey : maskApiKey(resultKey)}
                </code>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKeyVisible(!keyVisible)}
                  >
                    <Icon
                      icon={keyVisible ? 'lucide:eye-off' : 'lucide:eye'}
                      className="mr-1.5 size-4"
                    />
                    {keyVisible
                      ? t('Exchange.action.hide', '隐藏')
                      : t('Exchange.action.reveal', '显示')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Icon icon="lucide:copy" className="mr-1.5 size-4" />
                    {t('Exchange.action.copy', '复制')}
                  </Button>
                </div>
              </div>

              {resultExpires && (
                <InfoRow label={t('Exchange.result.expires', '过期时间')}>
                  {formatExpiry(resultExpires)}
                </InfoRow>
              )}

              <InfoRow label={t('Exchange.result.role', '角色')}>
                <Badge variant="outline">{resultRole}</Badge>
              </InfoRow>
            </div>
          )}
        </CardContent>

        {pageState === 'preview' && (
          <CardFooter>
            <Button
              className="w-full"
              onClick={doExchange}
              disabled={exchanging}
            >
              {exchanging
                ? t('Exchange.action.exchanging', '兑换中...')
                : t('Exchange.action.confirm', '确认兑换')}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ExchangePage;
