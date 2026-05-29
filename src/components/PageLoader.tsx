import { Icon } from '@iconify/react';

export const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <Icon
      icon="lucide:loader-circle"
      className="h-8 w-8 animate-spin text-muted-foreground"
    />
  </div>
);
