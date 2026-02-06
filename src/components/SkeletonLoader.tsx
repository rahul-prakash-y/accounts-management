const SkeletonLoader = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="w-full animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-700/50">
          <div className="h-4 bg-gray-700 rounded w-1/12"></div>
          <div className="h-4 bg-gray-700 rounded w-3/12"></div>
          <div className="h-4 bg-gray-700 rounded w-2/12"></div>
          <div className="h-4 bg-gray-700 rounded w-2/12"></div>
          <div className="h-4 bg-gray-700 rounded w-2/12"></div>
          <div className="h-4 bg-gray-700 rounded w-2/12"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
