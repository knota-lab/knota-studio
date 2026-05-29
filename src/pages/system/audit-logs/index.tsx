import { startTransition, useMemo, useRef, useState } from 'react';
import type { ProTableColumnDef } from '@/components/pro-table';
import { buildColumns, ProTable } from '@/components/pro-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { useAuditLogAgent } from './agent';
import type { AuditLogResponse, DiffEntry } from './options';
import { createAuditLogColumns, listAuditLogs } from './options';

const DiffDetailTable = ({ diff }: { diff: DiffEntry[] }) => {
  const t = useT();
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>{t('AuditLogMgmt.diffField', '字段')}</TableHead>
          <TableHead>{t('AuditLogMgmt.diffBefore', '变更前')}</TableHead>
          <TableHead>{t('AuditLogMgmt.diffAfter', '变更后')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diff.map((d) => (
          <TableRow key={d.field}>
            <TableCell className="font-medium">{d.field}</TableCell>
            <TableCell className="bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 break-all whitespace-pre-wrap">
              {d.before == null ? '-' : String(d.before)}
            </TableCell>
            <TableCell className="bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 break-all whitespace-pre-wrap">
              {d.after == null ? '-' : String(d.after)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const actionVariant = new Map([
  ['create', 'default'],
  ['update', 'secondary'],
  ['delete', 'destructive'],
  ['soft_delete', 'destructive'],
  ['restore', 'default'],
]);

type ActionVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const DetailSheet = ({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLogResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const t = useT();
  const logRef = useRef(log);
  if (open) logRef.current = log;
  const d = logRef.current;
  if (!d) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex flex-col sm:max-w-xl">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-sm">
            {t('AuditLogMgmt.detailTitle', '审计日志详情')}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge
              variant={
                (actionVariant.get(d.action) ?? 'outline') as ActionVariant
              }
            >
              {d.action}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {d.resourceType}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border bg-card p-3 text-sm">
            <KV l={t('AuditLogMgmt.resourceId', '资源ID')}>
              <span className="font-mono text-xs break-all">
                {d.resourceId}
              </span>
            </KV>
            <KV l={t('AuditLogMgmt.ipAddress', 'IP')}>{d.ipAddress ?? '-'}</KV>
            <KV l={t('AuditLogMgmt.createdAt', '时间')}>
              {d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}
            </KV>
            <KV l={t('AuditLogMgmt.status', '状态')}>
              <span
                className={cn(
                  'font-medium',
                  d.status === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-destructive',
                )}
              >
                {d.status === 'success'
                  ? t('AuditLogMgmt.statusSuccess', '成功')
                  : t('AuditLogMgmt.statusFailed', '失败')}
              </span>
            </KV>
          </div>

          {d.diff && d.diff.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t('AuditLogMgmt.diffDetail', '变更详情')}
              </p>
              <DiffDetailTable diff={d.diff} />
            </div>
          )}

          {d.action === 'create' && d.afterState && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t('AuditLogMgmt.createContent', '创建内容')}
              </p>
              <pre className="overflow-auto whitespace-pre-wrap break-all rounded-md bg-green-50 p-3 text-xs dark:bg-green-950/30">
                {JSON.stringify(d.afterState, null, 2)}
              </pre>
            </div>
          )}

          {d.action === 'delete' && d.beforeState && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t('AuditLogMgmt.deleteContent', '删除内容')}
              </p>
              <pre className="overflow-auto whitespace-pre-wrap break-all rounded-md bg-red-50 p-3 text-xs dark:bg-red-950/30">
                {JSON.stringify(d.beforeState, null, 2)}
              </pre>
            </div>
          )}

          {d.errorMessage && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                错误
              </p>
              <p className="break-all rounded-md bg-destructive/5 p-3 text-sm text-destructive">
                {d.errorMessage}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function KV({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{l}</span>
      <p className="text-sm">{children}</p>
    </div>
  );
}

const AuditLogsPage = () => {
  const t = useT();
  useAuditLogAgent();

  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);

  const auditLogColumns = useMemo(() => createAuditLogColumns(t), [t]);

  const actionVariantMap = useMemo(
    () =>
      new Map([
        ['create', 'default'],
        ['update', 'secondary'],
        ['delete', 'destructive'],
        ['soft_delete', 'destructive'],
        ['restore', 'default'],
        ['reset_password', 'secondary'],
      ]),
    [],
  );

  const actionLabelMap = useMemo(
    () =>
      new Map([
        ['create', t('AuditLogMgmt.actionCreate', '新增')],
        ['update', t('AuditLogMgmt.actionUpdate', '修改')],
        ['delete', t('AuditLogMgmt.actionDelete', '删除')],
        ['soft_delete', t('AuditLogMgmt.actionSoftDelete', '软删除')],
        ['restore', t('AuditLogMgmt.actionRestore', '恢复')],
        ['reset_password', t('AuditLogMgmt.actionResetPassword', '重置密码')],
      ]),
    [t],
  );

  const resourceLabelMap = useMemo(
    () =>
      new Map([
        ['user', t('AuditLogMgmt.resUser', '用户')],
        ['role', t('AuditLogMgmt.resRole', '角色')],
        ['tenant', t('AuditLogMgmt.resTenant', '租户')],
        ['file', t('AuditLogMgmt.resFile', '文件')],
        ['dict_type', t('AuditLogMgmt.resDictType', '字典类型')],
        ['dict_item', t('AuditLogMgmt.resDictItem', '字典项')],
        ['sys_config', t('AuditLogMgmt.resSysConfig', '系统配置')],
        ['permission', t('AuditLogMgmt.resPermission', '权限')],
        ['menu', t('AuditLogMgmt.resMenu', '菜单')],
      ]),
    [t],
  );

  const columns = useMemo(
    () =>
      buildColumns<AuditLogResponse>(auditLogColumns, {
        action: ({ row }) => {
          const { action } = row.original;
          const variant = actionVariantMap.get(action) ?? 'outline';
          return (
            <Badge variant={variant as ActionVariant}>
              {actionLabelMap.get(action) ?? action}
            </Badge>
          );
        },
        resourceType: ({ row }) =>
          resourceLabelMap.get(row.original.resourceType) ??
          row.original.resourceType,
        ipAddress: ({ row }) => row.original.ipAddress ?? '-',
        status: ({ row }) => {
          const isSuccess = row.original.status === 'success';
          return (
            <Badge
              variant={isSuccess ? 'default' : 'destructive'}
              className={isSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSuccess
                ? t('AuditLogMgmt.statusSuccess', '成功')
                : t('AuditLogMgmt.statusFailed', '失败')}
            </Badge>
          );
        },
        createdAt: ({ row }) => {
          const val = row.original.createdAt;
          return val ? new Date(val).toLocaleString() : '-';
        },
        details: ({ row }) => {
          const has = !!(
            row.original.diff?.length ||
            row.original.beforeState ||
            row.original.afterState ||
            row.original.errorMessage
          );
          return has ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                startTransition(() => setSelectedLog(row.original))
              }
            >
              {t('AuditLogMgmt.viewDetail', '查看')}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          );
        },
      }) as ProTableColumnDef<AuditLogResponse>[],
    [auditLogColumns, actionVariantMap, actionLabelMap, resourceLabelMap, t],
  );

  return (
    <>
      <ProTable
        columns={columns}
        request={(params) => listAuditLogs(params)}
        header={{ title: t('AuditLogMgmt.title', '审计日志') }}
      />

      <DetailSheet
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </>
  );
};

export default AuditLogsPage;
