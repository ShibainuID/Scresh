import Link from "next/link";
import type { LinkProps } from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type ButtonBaseProps = {
  className?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "lime" | "forest";
};

type NativeButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: LinkProps["href"];
  };

type ButtonProps = NativeButtonProps | LinkButtonProps;

const buttonClassName =
  "inline-flex items-center justify-center rounded-[6px] font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizeClassName: Record<NonNullable<ButtonBaseProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

const buttonVariantClassName: Record<
  NonNullable<ButtonBaseProps["variant"]>,
  string
> = {
  lime: "bg-lime text-forest",
  forest: "bg-forest text-white",
};

export function Button(props: ButtonProps) {
  const { className = "", children, size = "md", variant = "lime" } = props;
  const classes = `${buttonClassName} ${buttonVariantClassName[variant]} ${buttonSizeClassName[size]} ${className}`;

  if (props.href !== undefined) {
    const {
      href,
      className: _className,
      children: _children,
      size: _size,
      variant: _variant,
      ...linkProps
    } = props;

    return (
      <Link className={classes} href={href} {...linkProps}>
        {children}
      </Link>
    );
  }

  const {
    className: _className,
    children: _children,
    size: _size,
    variant: _variant,
    type = "button",
    ...buttonProps
  } = props;

  return (
    <button
      className={classes}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
