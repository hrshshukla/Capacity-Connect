import { type ReactNode, useState } from "react";
import { CircleAlert, Eye, EyeOff, X } from "lucide-react";
export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PasswordInput({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        {...props}
        className={`input ${className}`.trim()}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function QueryState({
  loading,
  error,
  retry,
  children,
  label = "content",
}: {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  children: ReactNode;
  label?: string;
}) {
  if (loading)
    return (
      <div
        className="loading-stack"
        aria-label={`Loading ${label}`}
        data-testid={`loading-${label}`}
      >
        <div className="skeleton" style={{ height: 70 }} />
        <div className="skeleton" style={{ height: 150 }} />
        <div className="skeleton" style={{ height: 92 }} />
      </div>
    );
  if (error)
    return (
      <div className="error-state" data-testid={`error-${label}`}>
        <CircleAlert
          size={24}
          style={{ margin: "0 auto 10px", color: "#ad593d" }}
        />
        <h3>We could not load this view</h3>
        <p>The signal may be delayed. Try again when you are ready.</p>
        {retry && (
          <button
            className="btn btn-outline"
            onClick={retry}
            data-testid={`button-retry-${label}`}
          >
            Try again
          </button>
        )}
      </div>
    );
  return <>{children}</>;
}

export function Flash({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast-success" role="status" data-testid="status-success">
      <span>{message}</span>
      <button
        className="text-button"
        style={{ color: "#f7c84b", marginLeft: 16 }}
        onClick={onClose}
        data-testid="button-dismiss-toast"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

