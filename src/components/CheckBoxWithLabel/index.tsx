import classNames from "classnames";
import { ComponentPropsWithoutRef, FC, memo } from "react";

interface CheckBoxWithLabelProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "onChange"
> {
  label: string;
  onChange?: (checked: boolean) => void;
}

export const CheckBoxWithLabel: FC<CheckBoxWithLabelProps> = memo(
  ({ label, onChange, className, style, ...inputProps }) => (
    <label
      className={classNames(
        "flex cursor-pointer items-center gap-3",
        className,
      )}
      style={style}
    >
      <input
        type='checkbox'
        onChange={(e) => onChange?.(e.target.checked)}
        className={`
          size-5 cursor-pointer rounded-sm border-gray-300 text-primary
          focus:ring-2 focus:ring-primary/20
        `}
        {...inputProps}
      />
      <span className='text-sm text-gray-700'>{label}</span>
    </label>
  ),
);
