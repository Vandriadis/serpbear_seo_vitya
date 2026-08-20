import type { Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes, MouseEvent } from 'react';
import {
   forwardRef, useCallback, useEffect, useImperativeHandle, useRef,
} from 'react';
import { cn } from '../../utils/cn';

export type AnimatedIconHandle = {
   startAnimation: () => void,
   stopAnimation: () => void,
}

type AnimatedIconProps = HTMLAttributes<HTMLDivElement> & {
   size?: number,
   /** Keep drawing the path in a loop (used for "alive" pulse). */
   loop?: boolean,
}

const VARIANTS: Variants = {
   normal: {
      opacity: 1,
      pathLength: 1,
      pathOffset: 0,
      transition: {
         duration: 0.4,
         opacity: { duration: 0.1 },
      },
   },
   animate: {
      opacity: [0, 1],
      pathLength: [0, 1],
      pathOffset: [1, 0],
      transition: {
         duration: 0.7,
         ease: 'linear',
         opacity: { duration: 0.1 },
         repeat: Infinity,
         repeatDelay: 0.35,
      },
   },
   animateOnce: {
      opacity: [0, 1],
      pathLength: [0, 1],
      pathOffset: [1, 0],
      transition: {
         duration: 0.6,
         ease: 'linear',
         opacity: { duration: 0.1 },
      },
   },
};

const ActivityIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
   ({
      onMouseEnter, onMouseLeave, className, size = 16, loop = false, ...props
   }, ref) => {
      const controls = useAnimation();
      const isControlledRef = useRef(false);

      useImperativeHandle(ref, () => {
         isControlledRef.current = true;
         return {
            startAnimation: () => controls.start(loop ? 'animate' : 'animateOnce'),
            stopAnimation: () => controls.start('normal'),
         };
      });

      useEffect(() => {
         if (loop) {
            controls.start('animate');
            return undefined;
         }
         controls.start('normal');
         return undefined;
      }, [loop, controls]);

      const handleMouseEnter = useCallback((e: MouseEvent<HTMLDivElement>) => {
         if (isControlledRef.current || loop) {
            onMouseEnter?.(e);
            return;
         }
         controls.start('animateOnce');
      }, [controls, loop, onMouseEnter]);

      const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>) => {
         if (isControlledRef.current || loop) {
            onMouseLeave?.(e);
            return;
         }
         controls.start('normal');
      }, [controls, loop, onMouseLeave]);

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
                  d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
                  initial="normal"
                  variants={VARIANTS}
               />
            </svg>
         </div>
      );
   },
);

ActivityIcon.displayName = 'ActivityIcon';

export default ActivityIcon;
