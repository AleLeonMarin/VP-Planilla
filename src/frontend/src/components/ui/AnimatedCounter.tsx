'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DigitProps {
  digit: string;
}

const Digit: React.FC<DigitProps> = ({ digit }) => {
  return (
    <div className="relative inline-block h-[1em] overflow-hidden leading-none align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

interface RollingNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  precision?: number;
}

/**
 * AnimatedCounter implementing the "Up and Down" / Rolling number effect.
 * Each digit slides vertically when changed.
 */
const AnimatedCounter: React.FC<RollingNumberProps> = ({
  value,
  className = "",
  prefix = "",
  suffix = "",
  precision = 0,
}) => {
  const [displayString, setDisplayString] = useState("");

  useEffect(() => {
    const formatted = value.toLocaleString('es-CR', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
    setDisplayString(formatted);
  }, [value, precision]);

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {prefix && <span>{prefix}</span>}
      {displayString.split('').map((char, index) => {
        // Only animate digits, leave separators static
        if (/[0-9]/.test(char)) {
          return <Digit key={index} digit={char} />;
        }
        return <span key={index}>{char}</span>;
      })}
      {suffix && <span>{suffix}</span>}
    </span>
  );
};

export default AnimatedCounter;
