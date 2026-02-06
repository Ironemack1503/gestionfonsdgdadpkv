interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 5, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div 
                    className="skeleton h-4 rounded-md"
                    style={{ 
                      width: `${60 + Math.random() * 40}%`,
                      animationDelay: `${i * 100}ms`
                    }} 
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="border-b border-border"
                style={{ animationDelay: `${rowIndex * 50}ms` }}
              >
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div 
                      className="skeleton h-5 rounded-md"
                      style={{ 
                        width: colIndex === 0 ? '80px' : `${50 + Math.random() * 50}%`,
                        animationDelay: `${(rowIndex * columns + colIndex) * 30}ms`
                      }} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
