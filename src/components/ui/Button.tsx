interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className,
  type = 'button',
}: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'border border-amber-600 text-amber-700 hover:bg-amber-50';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 font-medium transition-colors disabled:opacity-50 ${variantClasses}${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
