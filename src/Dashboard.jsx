import AppSidebar from "./SideBar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";

export default function Dashboard() {
  console.log("Dashboard rendered");
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </main>
      </div>
    </SidebarProvider>
  );
}
