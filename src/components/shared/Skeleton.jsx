import { useWorkspaces } from "../../hooks/useWorkspaces";

/**
 * Global loading overlay component with smoke/skeleton effect
 */
export const LoadingOverlay = () => {
  const { isLoading } = useWorkspaces();
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700"></div>
        </div>
        <div className="animate-pulse text-center text-sm font-medium text-slate-600">Loading data...</div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for list items
 */
export const SkeletonListItem = ({ className = "" }) => {
  return (
    <div className={`space-y-2 rounded-lg p-3 ${className}`}>
      <div className="h-4 w-3/4 animate-pulse rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"></div>
      <div className="h-3 w-1/2 animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"></div>
    </div>
  );
};

/**
 * Skeleton loader for content area
 */
export const SkeletonContent = () => {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <div className="h-8 w-1/3 animate-pulse rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"></div>
        <div className="h-4 w-full animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"></div>
        <div className="h-4 w-5/6 animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"></div>
      </div>

      <div className="space-y-3 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"></div>
            <div className="h-3 w-1/2 animate-pulse rounded bg-gradient-to-r from-slate-50 via-slate-30 to-slate-50"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for sidebar list
 */
export const SkeletonSidebarList = () => {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
        ></div>
      ))}
    </div>
  );
};
