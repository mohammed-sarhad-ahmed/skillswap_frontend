import {
  Calendar,
  ClipboardList,
  Settings,
  CreditCard,
  User,
  LogOut,
  MessageCircleCodeIcon,
} from "lucide-react";
import { API_BASE_URL } from "./Config";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./components/ui/sidebar";

import { NavLink, useNavigate } from "react-router";

import { getToken, removeToken } from "./ManageToken";
import { useEffect } from "react";

const navItems = [
  { title: "Sessions", to: "/sessions", icon: ClipboardList },
  { title: "Appointments", to: "/appointments", icon: Calendar },
  { title: "Skills", to: "/skills", icon: Settings },
  { title: "Buy Credits", to: "/buy-credits", icon: CreditCard },
  { title: "Chats", to: "/Chat", icon: MessageCircleCodeIcon },
];

export default function AppSidebar() {
  const navigate = useNavigate();

  useEffect(() => {}, []);

  const handleLogout = async () => {
    try {
      const token = getToken();

      if (token) {
        const res = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          throw new Error("Server responded with error");
        }
      }

      removeToken();
      SidebarGroup;
      location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      removeToken();
      location.href = "/login";
    }
  };

  return (
    <Sidebar className="bg-white border-r border-slate-200">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-8">
            <div className="px-2 py-2 font-bold text-xl text-blue-600 tracking-wide uppercase">
              SkillSwap
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 mt-auto space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`
                }
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
