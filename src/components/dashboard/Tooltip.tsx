import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<'top' | 'bottom'>('top')
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos(rect.top < 80 ? 'bottom' : 'top')
    }
  }, [visible])

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={`pointer-events-none absolute z-50 w-56 rounded-md border border-surface-border bg-surface-card px-3 py-2 text-xs text-gray-300 shadow-xl leading-relaxed
            ${pos === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'}`}
        >
          {content}
          <span
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${pos === 'top' ? 'top-full border-t-surface-border -mt-px' : 'bottom-full border-b-surface-border -mb-px'}`}
          />
        </span>
      )}
    </span>
  )
}
