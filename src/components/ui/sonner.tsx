import * as React from "react";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * forwardRef prevents occasional "Function components cannot be given refs" warnings
 * when consumers or providers attach refs to the Toaster.
 */
const Toaster = React.forwardRef<React.ElementRef<typeof Sonner>, ToasterProps>(function Toaster(
  props,
  ref,
) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      ref={ref}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle className="w-5 h-5 text-success" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
});

Toaster.displayName = "SonnerToaster";

export { Toaster, toast };
