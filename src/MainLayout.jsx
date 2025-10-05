import AppSidebar from "./SideBar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Outlet } from "react-router"; // use react-router-dom

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <SidebarTrigger />
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
