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
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useI18n, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import KbChat from '@/pages/chat';
import { useAuth } from '@/stores/auth';
import type { MergedMenuTreeResponse } from '@/types/api';

// ─── Constants ──────────────────────────────────────────

const sidebarExpandedWidth = 240;
const sidebarCollapsedWidth = 64;
const sidebarMinWidth = 180;
const sidebarMaxWidth = 360;
const chatPanelDefaultWidth = 480;
const chatPanelMinWidth = 320;
const chatPanelMaxWidth = 720;
const mobileBreakpoint = 768;

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
  const [sidebarWidth, setSidebarWidth] = useState(sidebarExpandedWidth);
  const [isResizing, setIsResizing] = useState(false);

  // Nav group expand state — auto-expand groups containing the active route
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Dynamic menu
  const { data: menuTree } = useRequest(getUserMenus, {
    cacheKey: 'sidebar-menus',
  });

  // Theme state
  const [darkMode = false, setDarkMode] =
    useLocalStorageState<boolean>('knota-theme-dark');

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Resize tracking
  const isResizingRef = useRef(false);

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Detect mobile viewport
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    setIsMobile(query.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  // Computed width
  const actualWidth = collapsed ? sidebarCollapsedWidth : sidebarWidth;

  // Navigation
  const handleNavClick = useCallback(
    (path: string) => {
      navigate(path);
      if (isMobile) setMobileOpen(false);
    },
    [isMobile, navigate],
  );

  // Collapse toggle
  const handleToggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  // Sidebar resizer
  const handleResizerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      isResizingRef.current = true;

      document.body.classList.add('select-none');

      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizingRef.current) return;
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.max(
          sidebarMinWidth,
          Math.min(sidebarMaxWidth, startWidth + delta),
        );
        setSidebarWidth(nextWidth);
      };

      const handleMouseUp = () => {
        isResizingRef.current = false;
        setIsResizing(false);
        document.body.classList.remove('select-none');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidebarWidth],
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

  const isCollapsedDesktop = collapsed && !isMobile;

  return (
    <TooltipProvider>
      <ForcedNotificationModal />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* ─── Mobile backdrop ─── */}
        {isMobile && mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label={t('Layout.header.toggleMenu', '菜单')}
          />
        )}

        {/* ─── Sidebar ─── */}
        <aside
          className={cn(
            'relative flex flex-col border-r bg-card',
            isMobile
              ? cn(
                  'fixed inset-y-0 left-0 z-50 transition-transform duration-200',
                  mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )
              : cn(
                  'shrink-0',
                  !isResizing && 'transition-[width] duration-200 ease-in-out',
                ),
          )}
          style={{
            width: isMobile ? sidebarExpandedWidth : actualWidth,
          }}
        >
          {/* Logo */}
          <div className="flex h-14 shrink-0 items-center px-4">
            {isCollapsedDesktop ? (
              <span className="text-xl font-bold text-primary">K</span>
            ) : (
              <span className="text-xl font-bold text-primary">Knota</span>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {/* Static entries (dashboard etc.) */}
            {(() => {
              const entry = staticEntry;
              const label = t('Layout.sidebar.dashboard', '仪表盘');
              const active = isActive(entry.path);

              const itemClassName = cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsedDesktop && 'justify-center px-2',
              );

              if (isCollapsedDesktop) {
                return (
                  <HoverCard key={entry.key} openDelay={0} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        className={itemClassName}
                        onClick={() => handleNavClick(entry.path)}
                      >
                        <DynamicIcon
                          name={entry.icon}
                          className="size-5 shrink-0"
                        />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" className="w-auto p-2">
                      <span className="text-sm font-medium">{label}</span>
                    </HoverCardContent>
                  </HoverCard>
                );
              }

              return (
                <button
                  key={entry.key}
                  type="button"
                  className={itemClassName}
                  onClick={() => handleNavClick(entry.path)}
                >
                  <DynamicIcon name={entry.icon} className="size-5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })()}

            {/* Dynamic menu entries */}
            {menuTree?.map((menuItem) => {
              const hasChildren = menuItem.children.length > 0;
              const expanded = expandedKeys.has(menuItem.id);
              const isDirectlyActive = menuItem.path
                ? isActive(menuItem.path)
                : false;
              const isChildActive = hasChildren
                ? menuItem.children.some((c) =>
                    c.path ? isActive(c.path) : false,
                  )
                : false;
              const active = isDirectlyActive || isChildActive;

              const itemClassName = cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsedDesktop && 'justify-center px-2',
              );

              const handleClick = hasChildren
                ? () => toggleGroup(menuItem.id)
                : () => menuItem.path && handleNavClick(menuItem.path);

              if (isCollapsedDesktop) {
                return (
                  <HoverCard key={menuItem.id} openDelay={0} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        className={itemClassName}
                        onClick={handleClick}
                      >
                        {menuItem.icon ? (
                          <DynamicIcon
                            name={menuItem.icon}
                            className="size-5 shrink-0"
                          />
                        ) : (
                          <Icon
                            icon="lucide:settings"
                            className="size-5 shrink-0"
                          />
                        )}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" className="w-auto p-2">
                      {hasChildren ? (
                        <div className="space-y-0.5">
                          <p className="mb-1 text-xs font-semibold text-foreground">
                            {menuItem.name}
                          </p>
                          {menuItem.children.map((child) => {
                            const childActive = child.path
                              ? isActive(child.path)
                              : false;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                className={cn(
                                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                                  childActive
                                    ? 'bg-primary/10 text-primary font-medium'
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
                                <span className="whitespace-nowrap">
                                  {child.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-sm font-medium">
                          {menuItem.name}
                        </span>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                );
              }

              return (
                <div key={menuItem.id}>
                  <button
                    type="button"
                    className={itemClassName}
                    onClick={handleClick}
                  >
                    {menuItem.icon ? (
                      <DynamicIcon
                        name={menuItem.icon}
                        className="size-5 shrink-0"
                      />
                    ) : (
                      <Icon
                        icon="lucide:settings"
                        className="size-5 shrink-0"
                      />
                    )}
                    <span className="truncate">{menuItem.name}</span>
                    {hasChildren && (
                      <Icon
                        icon="lucide:chevron-down"
                        className={cn(
                          'ml-auto size-4 shrink-0 transition-transform duration-200',
                          !expanded && '-rotate-90',
                        )}
                      />
                    )}
                  </button>
                  {hasChildren && expanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                      {menuItem.children.map((child) => {
                        const childActive = child.path
                          ? isActive(child.path)
                          : false;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                              childActive
                                ? 'bg-primary/10 text-primary font-medium'
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
                            <span className="truncate">{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <>
              <Separator />
              <div className="shrink-0 p-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleToggleCollapse}
                    >
                      {collapsed ? (
                        <Icon icon="lucide:chevrons-right" className="size-4" />
                      ) : (
                        <>
                          <Icon
                            icon="lucide:chevrons-left"
                            className="size-4"
                          />
                          <span className="ml-2 text-xs">
                            {t('Layout.sidebar.collapse', '收起侧边栏')}
                          </span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {t('Layout.sidebar.expand', '展开侧边栏')}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </>
          )}

          {/* Resizer handle (desktop, expanded only) */}
          {!collapsed && !isMobile && (
            // biome-ignore lint/a11y/noStaticElementInteractions: drag handle is mouse-only
            <div
              className="absolute inset-y-0 right-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50"
              onMouseDown={handleResizerMouseDown}
            />
          )}
        </aside>

        {/* ─── Main content area ─── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4">
            {/* Mobile hamburger */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label={t('Layout.header.toggleMenu', '菜单')}
              >
                <Icon icon="lucide:menu" className="size-5" />
              </Button>
            )}

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
        </div>

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
      </div>
    </TooltipProvider>
  );
};

export default MainLayout;
