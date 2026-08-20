import type { Transition, Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes, MouseEvent } from 'react';
import {
   forwardRef, useCallback, useEffect, useImperativeHandle, useRef,
} from 'react';
import { cn } from '../../utils/cn';
import type { AnimatedIconHandle } from './activity';

type LoaderCircleIconProps = HTMLAttributes<HTMLDivElement> & {
   size?: number,
   spinning?: boolean,
}

const G_VARIANTS: Variants = {
   normal: { rotate: 0 },
   animate: {
      rotate: 360,
      transition: {
         repeat: Number.POSITIVE_INFINITY,
         duration: 0.8,
         ease: 'linear',
      },
   },
};

const DEFAULT_TRANSITION: Transition = {
   type: 'spring',
   stiffness: 50,
   damping: 10,
};

const LoaderCircleIcon = forwardRef<AnimatedIconHandle, LoaderCircleIconProps>(
   ({
      onMouseEnter, onMouseLeave, className, size = 16, spinning = false, ...props
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
            controls.start('animate');
            return undefined;
         }
         controls.start('normal');
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
            <svg
               fill="none"
               height={size}
               stroke="currentColor"
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth="2"
               viewBox="0 0 24 24"
               width={size}
               xmlns="http://www.w3.org/2000/svg"
            >
               <motion.path
                  animate={controls}
                  d="M21 12a9 9 0 1 1-6.219-8.56"
                  style={{ transformOrigin: '12px 12px' }}
                  transition={DEFAULT_TRANSITION}
                  variants={G_VARIANTS}
               />
            </svg>
         </div>
      );
   },
);

LoaderCircleIcon.displayName = 'LoaderCircleIcon';

export { LoaderCircleIcon };
