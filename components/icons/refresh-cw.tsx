import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes, MouseEvent } from 'react';
import {
   forwardRef, useCallback, useEffect, useImperativeHandle, useRef,
} from 'react';
import { cn } from '../../utils/cn';
import type { AnimatedIconHandle } from './activity';

type RefreshCWIconProps = HTMLAttributes<HTMLDivElement> & {
   size?: number,
   spinning?: boolean,
}

const RefreshCWIcon = forwardRef<AnimatedIconHandle, RefreshCWIconProps>(
   ({
      onMouseEnter, onMouseLeave, className, size = 14, spinning = false, ...props
   }, ref) => {
      const controls = useAnimation();
      const isControlledRef = useRef(false);

      useImperativeHandle(ref, () => {
         isControlledRef.current = true;
         return {
            startAnimation: () => controls.start('animate'),
            stopAnimation: () => controls.start('normal'),
         };
      });

      useEffect(() => {
         if (spinning) {
            controls.start({
               rotate: 360,
               transition: { repeat: Infinity, duration: 0.8, ease: 'linear' },
            });
            return undefined;
         }
         controls.start({ rotate: 0, transition: { duration: 0.2 } });
         return undefined;
      }, [spinning, controls]);

      const handleMouseEnter = useCallback((e: MouseEvent<HTMLDivElement>) => {
         if (isControlledRef.current || spinning) {
            onMouseEnter?.(e);
            return;
         }
         controls.start('animate');
      }, [controls, onMouseEnter, spinning]);

      const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>) => {
         if (isControlledRef.current || spinning) {
            onMouseLeave?.(e);
            return;
         }
         controls.start('normal');
      }, [controls, onMouseLeave, spinning]);

      return (
         <div
            className={cn(className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
         >
            <motion.svg
               animate={controls}
               fill="none"
               height={size}
               stroke="currentColor"
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth="2"
               transition={{ type: 'spring', stiffness: 250, damping: 25 }}
               variants={{
                  normal: { rotate: 0 },
                  animate: { rotate: 50 },
               }}
               viewBox="0 0 24 24"
               width={size}
               xmlns="http://www.w3.org/2000/svg"
            >
               <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
               <path d="M21 3v5h-5" />
               <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
               <path d="M8 16H3v5" />
            </motion.svg>
         </div>
      );
   },
);

RefreshCWIcon.displayName = 'RefreshCWIcon';

export default RefreshCWIcon;
