const Skeleton = ({ className = '', variant = 'rectangular', width, height }) => {
  const variants = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  }

  return (
    <div
      className={`shimmer-bg ${variants[variant] || variants.rectangular} ${className}`}
      style={{ width, height }}
    />
  )
}

export const JobCardSkeleton = () => (
  <div className="card-standard p-6">
    <div className="flex items-start gap-4">
      <Skeleton variant="circular" className="h-12 w-12 shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" className="h-6 w-20" />
          <Skeleton variant="rectangular" className="h-6 w-16" />
        </div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-5/6" />
    </div>
    <div className="mt-4 flex justify-between">
      <Skeleton variant="text" className="h-4 w-24" />
      <Skeleton variant="rectangular" className="h-9 w-24 rounded-lg" />
    </div>
  </div>
)

export const WorkerCardSkeleton = () => (
  <div className="card-standard p-6 text-center">
    <Skeleton variant="circular" className="mx-auto h-20 w-20" />
    <Skeleton variant="text" className="mx-auto mt-4 h-5 w-2/3" />
    <Skeleton variant="text" className="mx-auto mt-2 h-4 w-1/2" />
    <div className="mt-3 flex justify-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="circular" className="h-4 w-4" />
      ))}
    </div>
    <Skeleton variant="rectangular" className="mx-auto mt-4 h-10 w-full rounded-xl" />
  </div>
)

export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
    <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="h-4 w-1/3" />
      <Skeleton variant="text" className="h-3 w-1/4" />
    </div>
    <Skeleton variant="rectangular" className="h-8 w-20 rounded-lg" />
  </div>
)

export const StatCardSkeleton = () => (
  <div className="card-standard p-6">
    <div className="flex items-center justify-between">
      <Skeleton variant="circular" className="h-12 w-12" />
      <Skeleton variant="text" className="h-4 w-16" />
    </div>
    <Skeleton variant="text" className="mt-4 h-8 w-20" />
    <Skeleton variant="text" className="mt-2 h-4 w-32" />
  </div>
)

export default Skeleton
