import { useId, useState, type ComponentProps } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';

export function CharacterCount({ id, count, limit }: { id: string; count: number; limit: number }) {
  return (
    <small id={id} className={count > limit ? 'text-xs text-ui-error' : 'text-xs text-ui-muted'}>
      {count} / {limit}자
    </small>
  );
}

export function LimitedInput({
  maxLength,
  value,
  defaultValue,
  onChange,
  onBlur,
  ...props
}: Omit<ComponentProps<typeof Input>, 'maxLength' | 'value' | 'defaultValue'> & {
  maxLength: number;
  value?: string;
  defaultValue?: string;
}) {
  const id = useId();
  const [count, setCount] = useState(defaultValue?.length ?? 0);
  return (
    <>
      <Input
        {...props}
        aria-describedby={id}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          setCount(event.currentTarget.value.length);
          onChange?.(event);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setCount(event.currentTarget.value.length);
        }}
      />
      <CharacterCount id={id} count={value?.length ?? count} limit={maxLength} />
    </>
  );
}

export function LimitedTextarea({
  maxLength,
  defaultValue = '',
  ...props
}: Omit<ComponentProps<typeof Textarea>, 'maxLength' | 'value' | 'defaultValue'> & {
  maxLength: number;
  defaultValue?: string;
}) {
  const id = useId();
  const [count, setCount] = useState(defaultValue.length);
  return (
    <>
      <Textarea
        {...props}
        aria-describedby={id}
        maxLength={maxLength}
        defaultValue={defaultValue}
        onChange={(event) => setCount(event.currentTarget.value.length)}
      />
      <CharacterCount id={id} count={count} limit={maxLength} />
    </>
  );
}
