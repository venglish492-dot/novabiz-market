import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as: Tag = 'h2',
  className = '',
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: 'h1' | 'h2';
  className?: string;
  id?: string;
}) {
  return (
    <div className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="t-eyebrow mb-4">{eyebrow}</p>}
        <Tag id={id} className={`${Tag === 'h1' ? 't-h1' : 't-h2'} text-balance text-fg`}>
          {title}
        </Tag>
        {description && <p className="t-lead mt-4 max-w-xl text-pretty">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
