import { useState } from 'react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { SmartDateInput } from '@/components/ui/smart-date-input';

const TestDateTimePickerPage = () => {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [smartValue, setSmartValue] = useState<string | undefined>(undefined);

  return (
    <div className="mx-auto max-w-lg space-y-8 p-8">
      <h1 className="text-lg font-semibold">日期时间组件测试</h1>

      {/* SmartDateInput */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          SmartDateInput（重输入轻选择）
        </h2>
        <p className="text-xs text-muted-foreground">
          支持：自然语言（明天、下周五3点）、快捷指令（+3d、-1w）、紧凑数字（250203→2025-02-03）、↑↓光标感知调整
        </p>
        <SmartDateInput
          value={smartValue}
          onChange={setSmartValue}
          placeholder="输入日期，如：明天、+3d、2025-06-01 14:30"
          showSeconds={true}
        />
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">value:</p>
          <p className="font-mono text-sm break-all">
            {smartValue ?? '(undefined)'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">预设值</p>
          <SmartDateInput
            value="2026-12-31T23:59:59"
            onChange={(v) => console.log('smart preset:', v)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">仅日期（showTime=false）</p>
          <SmartDateInput
            value={undefined}
            onChange={(v) => console.log('date only:', v)}
            showTime={false}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Disabled</p>
          <SmartDateInput value="2026-06-01T12:00:00" disabled />
        </div>
      </section>

      <hr />

      {/* DateTimePicker (original) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          DateTimePicker（重选择轻输入）
        </h2>
        <div className="space-y-2">
          <p className="text-sm font-medium">选择日期时间</p>
          <DateTimePicker
            value={value}
            onChange={setValue}
            placeholder="请选择日期和时间"
          />
        </div>

        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">value:</p>
          <p className="font-mono text-sm break-all">
            {value ?? '(undefined)'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">预设值测试</p>
          <DateTimePicker
            value="2026-12-31T23:59:59.000Z"
            onChange={(v) => console.log('preset:', v)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Disabled</p>
          <DateTimePicker value="2026-06-01T12:00:00.000Z" disabled />
        </div>
      </section>
    </div>
  );
};

export default TestDateTimePickerPage;
