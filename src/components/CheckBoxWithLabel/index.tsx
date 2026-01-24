import { FC, memo } from "react";

interface CheckBoxWithLabelProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const CheckBoxWithLabel: FC<CheckBoxWithLabelProps> = memo(
  ({ label, checked, onChange }) => (
    <label className='flex cursor-pointer items-center gap-3'>
      <input
        type='checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`
          size-5 cursor-pointer rounded-sm border-gray-300 text-primary
          focus:ring-2 focus:ring-primary/20
        `}
      />
      <span className='text-sm text-gray-700'>{label}</span>
    </label>
  ),
);
