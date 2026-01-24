import * as React from "react";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

/**
 * forwardRef here prevents "Function components cannot be given refs" warnings
 * in certain provider compositions.
 */
const Toaster = React.forwardRef<
  React.ElementRef<typeof ToastViewport>,
  Record<string, never>
>(function Toaster(_props, ref) {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport ref={ref} />
    </ToastProvider>
  );
});

Toaster.displayName = "Toaster";

export { Toaster };
