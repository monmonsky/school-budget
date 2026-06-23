"use client";

export default function ConfirmSubmit({
  action,
  message,
  children,
  className = "btn-danger",
}: {
  action: () => void | Promise<void>;
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
