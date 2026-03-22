import * as React from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2Icon,
  InfoIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
} from "lucide-react";

export interface NoticeAlertProps
  extends React.PropsWithChildren<{}>,
    React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "info" | "warning" | "destructive";
}

export const NoticeAlert: React.FC<NoticeAlertProps> = ({
  variant = "info",
  children,
  className,
  ...props
}) => {
  let IconComponent: React.ElementType;
  switch (variant) {
    case "success":
      IconComponent = CheckCircle2Icon;
      break;
    case "warning":
      IconComponent = AlertTriangleIcon;
      break;
    case "destructive":
      IconComponent = AlertCircleIcon;
      break;
    case "info":
    default:
      IconComponent = InfoIcon;
      break;
  }

  return (
    <Alert
      variant={variant}
      className={cn("flex justify-center space-x-2 p-2", className)}
      {...props}
    >
      <IconComponent className="h-4 w-4 text-current" />
      <AlertTitle>{children}</AlertTitle>
    </Alert>
  );
};
