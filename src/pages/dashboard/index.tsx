import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useT } from '@/i18n';
import { useAuth } from '@/stores/auth';

interface NavCard {
  icon: string;
  label: string;
  path: string;
  roles: Array<'superAdmin' | 'tenantAdmin' | 'all'>;
}

const navCards: NavCard[] = [
  {
    icon: 'lucide:users',
    label: '用户管理',
    path: '/system/users',
    roles: ['all'],
  },
  {
    icon: 'lucide:shield',
    label: '角色管理',
    path: '/system/roles',
    roles: ['all'],
  },
  {
    icon: 'lucide:building-2',
    label: '租户管理',
    path: '/system/tenants',
    roles: ['superAdmin'],
  },
  {
    icon: 'lucide:menu',
    label: '菜单管理',
    path: '/system/menus',
    roles: ['all'],
  },
  {
    icon: 'lucide:book',
    label: '字典管理',
    path: '/system/dicts',
    roles: ['all'],
  },
  {
    icon: 'lucide:languages',
    label: '国际化',
    path: '/system/i18n',
    roles: ['all'],
  },
  {
    icon: 'lucide:file-text',
    label: '文件管理',
    path: '/system/files',
    roles: ['all'],
  },
  {
    icon: 'lucide:settings-2',
    label: '配置中心',
    path: '/system/sys-configs',
    roles: ['superAdmin'],
  },
];

const DashboardPage = () => {
  const t = useT();
  const { user } = useAuth();

  if (!user) return null;

  const visibleCards = navCards.filter((card) => {
    if (card.roles.includes('all')) return true;
    if (card.roles.includes('superAdmin') && user.isSuperAdmin) return true;
    if (card.roles.includes('tenantAdmin') && user.isTenantAdmin) return true;
    return false;
  });

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Profile + Tenant summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('Dashboard.profile', '账户信息')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {user.isSuperAdmin && (
                  <Badge variant="default" className="text-xs">
                    {t('Dashboard.superAdmin', '超管')}
                  </Badge>
                )}
                {user.isTenantAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    {t('Dashboard.tenantAdmin', '租户管理员')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('Dashboard.tenant', '当前租户')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:building-2"
                className="h-4 w-4 text-muted-foreground shrink-0"
              />
              <span className="font-medium">{user.tenantName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:hash"
                className="h-4 w-4 text-muted-foreground shrink-0"
              />
              <code className="text-sm text-muted-foreground">
                {user.tenantCode}
              </code>
            </div>
            <Separator className="!mt-3" />
            <div className="flex items-center gap-2 pt-1">
              <Icon
                icon="lucide:shield-check"
                className="h-4 w-4 text-muted-foreground shrink-0"
              />
              <span className="text-sm text-muted-foreground">
                {user.roles.length} {t('Dashboard.roleCountSuffix', '个角色')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick navigation */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          {t('Dashboard.quickNav', '快捷入口')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
            >
              <Icon
                icon={card.icon}
                className="mb-3 h-6 w-6 text-muted-foreground group-hover:text-foreground"
              />
              <h3 className="text-sm font-medium">
                {t(card.label, card.label)}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
