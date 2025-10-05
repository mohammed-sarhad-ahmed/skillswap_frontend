// MainLayout.jsx
import AppSidebar from "./SideBar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Outlet } from "react-router";

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <div className="flex-1">
          <SidebarTrigger />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
