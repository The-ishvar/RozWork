import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const Card = ({
  children,
  className = '',
  hover = true,
  glass = false,
  padding = true,
  animate = true,
  onClick,
  ...props
}) => {
  const baseClasses = glass ? 'glass-card' : 'card-standard'
  const paddingClass = padding ? '' : 'p-0'

  const Wrapper = animate ? motion.div : 'div'
  const animateProps = animate
    ? {
        variants: cardVariants,
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, margin: '-50px' },
        transition: { duration: 0.4, ease: 'easeOut' },
      }
    : {}

  return (
    <Wrapper
      className={`${baseClasses} ${paddingClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...animateProps}
      {...props}
    >
      {children}
    </Wrapper>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm text-slate-500 dark:text-slate-400 ${className}`}>
    {children}
  </p>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 flex items-center gap-3 ${className}`}>{children}</div>
)

export default Card
