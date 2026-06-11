import { Icon } from '@iconify/react';
import { useLocalStorageState, useRequest } from 'ahooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getUserMenus } from '@/api/menu';
import ForcedNotificationModal from '@/components/ForcedNotificationModal';
import NotificationBell from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { DynamicIcon } from '@/components/ui/icon-picker';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useI18n, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import KbChat from '@/pages/chat';
import { useAuth } from '@/stores/auth';
import type { MergedMenuTreeResponse } from '@/types/api';

// ─── Constants ──────────────────────────────────────────

const chatPanelDefaultWidth = 480;
const chatPanelMinWidth = 320;
const chatPanelMaxWidth = 720;

// ─── Types ──────────────────────────────────────────────

// ─── Navigation Config ──────────────────────────────────

/** Static top-level entry (dashboard) */
const staticEntry = {
  key: 'dashboard',
  path: '/',
  icon: 'Home' as const,
} as const;

// ─── Component ──────────────────────────────────────────

const MainLayout = () => {
  const t = useT();
  const { locale, locales, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar state
  const [collapsed = false, setCollapsed] = useLocalStorageState<boolean>(
    'knota-sidebar-collapsed',
  );
  // Nav group expand state — auto-expand groups containing the active route
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Dynamic menu
  const { data: menuTree } = useRequest(getUserMenus, {
    cacheKey: 'sidebar-menus',
  });

  // Theme state
  const [darkMode = false, setDarkMode] =
    useLocalStorageState<boolean>('knota-theme-dark');

  // Chat panel state
  const [chatOpen = false, setChatOpen] =
    useLocalStorageState<boolean>('knota-chat-open');
  const [chatWidth = chatPanelDefaultWidth, setChatWidth] =
    useLocalStorageState<number>('knota-chat-width');
  const [isChatResizing, setIsChatResizing] = useState(false);
  const isChatResizingRef = useRef(false);

  const handleChatToggle = useCallback(
    () => setChatOpen((prev = false) => !prev),
    [setChatOpen],
  );
  // Chat panel resizer
  const handleChatResizerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsChatResizing(true);
      isChatResizingRef.current = true;
      document.body.classList.add('select-none');

      const startX = e.clientX;
      const startWidth = chatWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isChatResizingRef.current) return;
        const delta = startX - moveEvent.clientX;
        const nextWidth = Math.max(
          chatPanelMinWidth,
          Math.min(chatPanelMaxWidth, startWidth + delta),
        );
        setChatWidth(nextWidth);
      };

      const handleMouseUp = () => {
        isChatResizingRef.current = false;
        setIsChatResizing(false);
        document.body.classList.remove('select-none');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [chatWidth, setChatWidth],
  );

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Navigation
  const handleNavClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  // Active path detection
  const isActive = useCallback(
    (path: string) =>
      path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path),
    [location.pathname],
  );

  const toggleGroup = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Auto-expand the menu group that contains the current route
  useEffect(() => {
    if (!menuTree) return;
    const activeGroupIds: string[] = [];
    menuTree.forEach((item) => {
      if (item.children.some((c) => c.path && isActive(c.path))) {
        activeGroupIds.push(item.id);
      }
    });
    if (activeGroupIds.length > 0) {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        for (const id of activeGroupIds) {
          next.add(id);
        }
        return next;
      });
    }
  }, [menuTree, isActive]);

  // Breadcrumb — match against static entries + dynamic menu tree
  const breadcrumb = useMemo(() => {
    if (isActive(staticEntry.path)) {
      return t('Layout.sidebar.dashboard', '仪表盘');
    }
    if (menuTree) {
      const findPath = (
        items: MergedMenuTreeResponse[],
        parentName?: string,
      ): string | undefined => {
        for (const item of items) {
          if (item.path && isActive(item.path)) {
            return parentName ? `${parentName} / ${item.name}` : item.name;
          }
          if (item.children.length > 0) {
            const found = findPath(item.children, item.name);
            if (found) return found;
          }
        }
        return undefined;
      };
      const found = findPath(menuTree);
      if (found) return found;
    }
    return 'Knota';
  }, [isActive, menuTree, t]);

  // User initials
  const initials = useMemo(() => {
    if (!user) return '';
    return user.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  // Locale helpers
  const enabledLocales = useMemo(
    () => locales.filter((loc) => loc.isEnabled),
    [locales],
  );

  const currentLocaleLabel = useMemo(() => {
    const current = locales.find((loc) => loc.locale === locale);
    return current?.label ?? locale;
  }, [locale, locales]);

  const sidebarOpen = !collapsed;

  return (
    <TooltipProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(open) => setCollapsed(!open)}
        className="h-screen min-h-0 overflow-hidden bg-background"
      >
        <ForcedNotificationModal />
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Knota"
                  onClick={() => handleNavClick('/')}
                >
                  <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    K
                  </span>
                  <span className="truncate text-xl">Knota</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive(staticEntry.path)}
                      tooltip={t('Layout.sidebar.dashboard', '仪表盘')}
                      onClick={() => handleNavClick(staticEntry.path)}
                    >
                      <DynamicIcon
                        name={staticEntry.icon}
                        className="size-4 shrink-0"
                      />
                      <span>{t('Layout.sidebar.dashboard', '仪表盘')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {menuTree?.map((menuItem) => {
                    const hasChildren = menuItem.children.length > 0;
                    const expanded = expandedKeys.has(menuItem.id);
                    const isDirectlyActive = menuItem.path
                      ? isActive(menuItem.path)
                      : false;
                    const isChildActive = hasChildren
                      ? menuItem.children.some((child) =>
                          child.path ? isActive(child.path) : false,
                        )
                      : false;
                    const active = isDirectlyActive || isChildActive;

                    if (hasChildren && !sidebarOpen) {
                      return (
                        <SidebarMenuItem key={menuItem.id}>
                          <HoverCard openDelay={80} closeDelay={120}>
                            <HoverCardTrigger asChild>
                              <SidebarMenuButton isActive={active}>
                                {menuItem.icon ? (
                                  <DynamicIcon
                                    name={menuItem.icon}
                                    className="size-4 shrink-0"
                                  />
                                ) : (
                                  <Icon
                                    icon="lucide:settings"
                                    className="size-4 shrink-0"
                                  />
                                )}
                                <span>{menuItem.name}</span>
                              </SidebarMenuButton>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="right"
                              align="start"
                              className="w-56 p-2"
                            >
                              <div className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                                {menuItem.name}
                              </div>
                              <div className="space-y-1">
                                {menuItem.children.map((child) => {
                                  const childActive = child.path
                                    ? isActive(child.path)
                                    : false;
                                  return (
                                    <button
                                      key={child.id}
                                      type="button"
                                      className={cn(
                                        'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors',
                                        childActive
                                          ? 'bg-primary/10 font-medium text-primary'
                                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                      )}
                                      onClick={() =>
                                        child.path && handleNavClick(child.path)
                                      }
                                    >
                                      {child.icon ? (
                                        <DynamicIcon
                                          name={child.icon}
                                          className="size-4 shrink-0"
                                        />
                                      ) : (
                                        <span className="size-4 shrink-0" />
                                      )}
                                      <span className="truncate">
                                        {child.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={menuItem.id}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={hasChildren ? undefined : menuItem.name}
                          onClick={() => {
                            if (hasChildren) {
                              toggleGroup(menuItem.id);
                              return;
                            }
                            if (menuItem.path) handleNavClick(menuItem.path);
                          }}
                        >
                          {menuItem.icon ? (
                            <DynamicIcon
                              name={menuItem.icon}
                              className="size-4 shrink-0"
                            />
                          ) : (
                            <Icon
                              icon="lucide:settings"
                              className="size-4 shrink-0"
                            />
                          )}
                          <span>{menuItem.name}</span>
                          {hasChildren && (
                            <Icon
                              icon="lucide:chevron-down"
                              className={cn(
                                'ml-auto size-4 shrink-0 transition-transform',
                                !expanded && '-rotate-90',
                              )}
                            />
                          )}
                        </SidebarMenuButton>
                        {hasChildren && expanded && (
                          <SidebarMenuSub>
                            {menuItem.children.map((child) => {
                              const childActive = child.path
                                ? isActive(child.path)
                                : false;
                              return (
                                <SidebarMenuSubItem key={child.id}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={childActive}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        child.path && handleNavClick(child.path)
                                      }
                                    >
                                      {child.icon ? (
                                        <DynamicIcon
                                          name={child.icon}
                                          className="size-4 shrink-0"
                                        />
                                      ) : (
                                        <span className="size-4 shrink-0" />
                                      )}
                                      <span>{child.name}</span>
                                    </button>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0 overflow-hidden">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4">
            <SidebarTrigger
              aria-label={t('Layout.header.toggleMenu', '菜单')}
            />

            {/* Breadcrumb */}
            <span className="text-sm font-medium text-foreground">
              {breadcrumb}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Chat toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(chatOpen && 'bg-primary/10 text-primary')}
              onClick={handleChatToggle}
              aria-label={t('Layout.header.toggleChat', '知识库问答')}
            >
              <Icon icon="lucide:message-square" className="size-4" />
            </Button>

            {/* Notification bell */}
            <NotificationBell />

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <Icon icon="lucide:sun" className="size-4" />
              ) : (
                <Icon icon="lucide:moon" className="size-4" />
              )}
            </Button>

            {/* Language switcher */}
            {enabledLocales.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Icon icon="lucide:globe" className="size-4" />
                    <span className="text-xs">{currentLocaleLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {enabledLocales.map((loc) => (
                    <DropdownMenuItem
                      key={loc.locale}
                      className={cn(loc.locale === locale && 'bg-accent')}
                      onClick={() => setLocale(loc.locale)}
                    >
                      {loc.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar size="sm">
                    {user?.avatarFileId && (
                      <AvatarImage
                        src={`/api/files/${user.avatarFileId}`}
                        alt={user.name}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline-block">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNavClick('/profile')}>
                  <Icon icon="lucide:settings" className="size-4" />
                  {t('Layout.header.profile', '个人设置')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <Icon icon="lucide:log-out" className="size-4" />
                  {t('Layout.header.logout', '退出登录')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-hidden p-6">
            <Outlet />
          </main>
        </SidebarInset>

        {/* ─── Chat Panel ─── */}
        {chatOpen && (
          <>
            {/* Divider + resizer */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle is mouse-only */}
            <div
              className="relative z-10 w-px shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/30 active:bg-primary/50"
              onMouseDown={handleChatResizerMouseDown}
            />
            {/* Panel */}
            <div
              className={cn(
                'flex shrink-0 flex-col overflow-hidden bg-chat-canvas',
                !isChatResizing &&
                  'transition-[width] duration-200 ease-in-out',
              )}
              style={{ width: chatWidth }}
            >
              <KbChat />
            </div>
          </>
        )}
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default MainLayout;
