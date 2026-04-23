import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastApi {
  toast: (options: ToastOptions) => void;
}

export function useToast(): ToastApi {
  const toast = ({ title, description, variant = "default" }: ToastOptions) => {
    const message = title || description || "Notificacao";
    const details = title && description ? { description } : undefined;

    if (variant === "destructive") {
      sonnerToast.error(message, details);
      return;
    }

    sonnerToast(message, details);
  };

  return { toast };
}
