import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';

export interface CountUpProps {
  /** Target numeric value to count up to */
  value: number;
  /** Animation duration in seconds (default: 0.7s) */
  duration?: number;
  /** Number of decimal places to format */
  decimals?: number;
  /** Optional custom formatter function (e.g. formatMoney) */
  formatter?: (val: number) => string;
  /** Prefix string before number (e.g. "+", "$") */
  prefix?: string;
  /** Suffix string after number (e.g. "%", " dona", " kun") */
  suffix?: string;
  /** Additional CSS class names */
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 0.7,
  decimals = 0,
  formatter,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const startVal = isFirstRender.current ? 0 : prevValueRef.current;
    isFirstRender.current = false;
    const endVal = Number.isFinite(value) ? value : 0;
    prevValueRef.current = endVal;

    // If starting and ending at identical values after first render, no need to re-run
    if (startVal === endVal && displayValue === endVal) {
      return;
    }

    const controls = animate(startVal, endVal, {
      duration,
      ease: [0.16, 1, 0.3, 1], // Smooth easeOutExpo curve
      onUpdate: (latest) => {
        setDisplayValue(latest);
      }
    });

    return () => controls.stop();
  }, [value, duration]);

  let formatted: string;
  if (formatter) {
    const rounded = decimals > 0 
      ? Number(displayValue.toFixed(decimals)) 
      : Math.round(displayValue);
    formatted = formatter(rounded);
  } else if (decimals > 0) {
    formatted = displayValue.toFixed(decimals);
  } else {
    formatted = Math.round(displayValue).toLocaleString('uz-UZ');
  }

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
