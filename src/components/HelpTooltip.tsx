import { HelpCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
  type: 'info' | 'help';
}

export function HelpTooltip({ content, type }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = type === 'info' ? Info : HelpCircle;

  return (
    <div className="relative inline-block" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-[var(--color-primary)] hover:opacity-80 transition-opacity"
      >
        <Icon size={16} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-64 p-4 mt-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-xl text-sm text-[var(--color-text)]">
          {content}
        </div>
      )}
    </div>
  );
}
