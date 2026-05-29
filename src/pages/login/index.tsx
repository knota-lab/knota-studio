import { useRequest } from 'ahooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaptcha, isLoginErrorResponse } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/i18n';
import { useAuth } from '@/stores/auth';
import type { CaptchaResponse, LoginErrorResponse } from '@/types/api';

const buildLoginErrorMessages = (
  t: (key: string, fallback: string) => string,
): Record<string, string> => ({
  // biome-ignore lint/style/useNamingConvention: key matches server LoginErrorCode enum
  INVALID_CREDENTIALS: t('Login.error.invalidCredentials', '邮箱或密码错误'),
  // biome-ignore lint/style/useNamingConvention: key matches server LoginErrorCode enum
  CAPTCHA_REQUIRED: t('Login.error.captchaRequired', '请输入验证码'),
  // biome-ignore lint/style/useNamingConvention: key matches server LoginErrorCode enum
  CAPTCHA_INVALID: t('Login.error.captchaInvalid', '验证码错误'),
  // biome-ignore lint/style/useNamingConvention: key matches server LoginErrorCode enum
  ACCOUNT_DISABLED: t('Login.error.accountDisabled', '账户已禁用'),
  // biome-ignore lint/style/useNamingConvention: key matches server LoginErrorCode enum
  ACCOUNT_LOCKED: '',
});

const LoginPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaData, setCaptchaData] = useState<CaptchaResponse | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockCountdown, setLockCountdown] = useState(0);

  const captchaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCaptchaTimer = useCallback(() => {
    if (captchaTimerRef.current) {
      clearTimeout(captchaTimerRef.current);
      captchaTimerRef.current = null;
    }
  }, []);

  const fetchCaptchaRef = useRef<() => void>(() => {});

  const scheduleCaptchaRefresh = useCallback(
    (ttlSeconds: number) => {
      clearCaptchaTimer();
      captchaTimerRef.current = setTimeout(() => {
        fetchCaptchaRef.current();
      }, ttlSeconds * 1000);
    },
    [clearCaptchaTimer],
  );

  const { run: fetchCaptcha } = useRequest(getCaptcha, {
    manual: true,
    onSuccess: (data: CaptchaResponse) => {
      setCaptchaData(data);
      setShowCaptcha(true);
      scheduleCaptchaRefresh(data.ttlSeconds);
    },
  });

  fetchCaptchaRef.current = fetchCaptcha;

  useEffect(() => {
    return clearCaptchaTimer;
  }, [clearCaptchaTimer]);

  const loginErrorMessages = useMemo(() => buildLoginErrorMessages(t), [t]);

  const handleError = useCallback(
    (errorBody: LoginErrorResponse) => {
      if (errorBody.requireCaptcha && !showCaptcha) {
        fetchCaptchaRef.current();
      }

      if (errorBody.code === 'ACCOUNT_LOCKED' && errorBody.unlockAtEpoch) {
        const remaining = errorBody.unlockAtEpoch * 1000 - Date.now();
        if (remaining > 0) {
          setLockCountdown(Math.ceil(remaining / 1000));
        }
        return;
      }

      const message =
        loginErrorMessages[errorBody.code] ??
        t('Login.error.default', '登录失败，请重试');
      setErrorMessage(message);
    },
    [showCaptcha, loginErrorMessages, t],
  );

  useEffect(() => {
    if (lockCountdown <= 0) return;

    const timer = setTimeout(() => {
      setLockCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [lockCountdown]);

  useEffect(() => {
    if (lockCountdown > 0) {
      const mins = Math.floor(lockCountdown / 60);
      const secs = lockCountdown % 60;
      const formatted =
        mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
      setErrorMessage(
        t(
          'Login.error.accountLocked',
          '账户已锁定，请 {{time}} 后重试',
        ).replace('{{time}}', formatted),
      );
    }
  }, [lockCountdown, t]);

  const { run: submitLogin, loading: submitting } = useRequest(
    async () => {
      const captcha = captchaData
        ? { token: captchaData.token, answer: captchaAnswer }
        : undefined;
      await authLogin(email, password, captcha);
      navigate('/', { replace: true });
    },
    {
      manual: true,
      onError: (error: Error) => {
        if (error instanceof ApiError && isLoginErrorResponse(error.body)) {
          handleError(error.body);
        } else {
          setErrorMessage(t('Login.error.default', '登录失败，请重试'));
        }

        if (showCaptcha) {
          fetchCaptchaRef.current();
        }
        setCaptchaAnswer('');
      },
    },
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage('');
      setLockCountdown(0);
      submitLogin();
    },
    [submitLogin],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-tight">
            Knota Studio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('Login.email', '邮箱')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('Login.emailPlaceholder', '请输入邮箱')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{t('Login.password', '密码')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('Login.passwordPlaceholder', '请输入密码')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {showCaptcha && (
              <div className="grid gap-2">
                <Label htmlFor="captcha">{t('Login.captcha', '验证码')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="captcha"
                    placeholder={t('Login.captchaPlaceholder', '请输入验证码')}
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                    autoComplete="off"
                    className="flex-1"
                  />
                  {captchaData && (
                    <button
                      type="button"
                      onClick={() => fetchCaptchaRef.current()}
                      className="h-9 w-[120px] shrink-0 cursor-pointer overflow-hidden rounded-md border border-input"
                    >
                      <img
                        src={captchaData.image}
                        alt="captcha"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || lockCountdown > 0}
            >
              {submitting
                ? t('Login.loading', '登录中...')
                : t('Login.submit', '登录')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
