import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSideBar";
import { LoadingOverlay } from "./components/shared/Skeleton";
import { uiClasses } from "./components/shared/uiClasses";
import AppNavTabs from "./AppNavTabs";
import { useWorkspaces } from "./hooks/useWorkspaces";

export default function AppLayout() {
  const {isLoading} = useWorkspaces();
  return (
    <div className={uiClasses.pageSurface}>
      <LoadingOverlay visible={isLoading} />
      <AppHeader />
      <div className={uiClasses.pageSurface}>
        <div className={uiClasses.pageGrid}>
          <AppSidebar />
          <main className="grid content-start gap-0">
            <AppNavTabs/>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
