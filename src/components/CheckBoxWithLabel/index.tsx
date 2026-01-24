import classNames from "classnames";
import { ComponentPropsWithoutRef, forwardRef } from "react";

interface CheckBoxWithLabelProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type"
> {
  label: string;
}

export const CheckBoxWithLabel = forwardRef<
  HTMLInputElement,
  CheckBoxWithLabelProps
>(({ label, className, style, ...inputProps }, ref) => (
  <label
    className={classNames("flex cursor-pointer items-center gap-3", className)}
    style={style}
  >
    <input
      type='checkbox'
      ref={ref}
      className={`
        size-5 cursor-pointer rounded-sm border-gray-300 text-primary
        focus:ring-2 focus:ring-primary/20
      `}
      {...inputProps}
    />
    <span className='text-sm text-gray-700'>{label}</span>
  </label>
));

// eslint-disable-next-line functional/immutable-data
CheckBoxWithLabel.displayName = "CheckBoxWithLabel";
