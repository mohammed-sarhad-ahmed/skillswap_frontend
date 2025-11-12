import {
  Calendar,
  ClipboardList,
  Settings,
  CreditCard,
  User,
  LogOut,
  MessageCircleCodeIcon,
  Bell,
  Search,
  StarIcon,
  BookOpen,
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

import { useNavigate, useLocation } from "react-router";
import { getToken, removeToken } from "./ManageToken";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io(API_BASE_URL);

const navItems = [
  { title: "Sessions", to: "/sessions", icon: ClipboardList },
  { title: "Appointments", to: "/appointments", icon: Calendar },
  { title: "Find Teacher", to: "/skills", icon: Search },
  { title: "Buy Credits", to: "/buy-credits", icon: CreditCard },
  { title: "Chats", to: "/Chat", icon: MessageCircleCodeIcon },
  { title: "Connections", to: "/ConnectionPage", icon: User },
  { title: "Reviews", to: "/reviews", icon: StarIcon },
  { title: "Courses", to: "/courses", icon: BookOpen },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePath, setActivePath] = useState(location.pathname);

  // Update activePath whenever URL changes
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnread();

    socket.on("new_notification", () => {
      setUnreadCount((c) => c + 1);
    });
  }, []);

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error("Server error");
      }
      removeToken();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      removeToken();
      window.location.href = "/login";
    }
  };

  const activeClass = "bg-blue-100 text-blue-700 border-l-4 border-blue-500";
  const inactiveClass = "text-slate-600 hover:bg-blue-50 hover:text-blue-600";

  const renderNavItem = (item) => {
    const isActive =
      activePath === item.to || activePath.startsWith(item.to + "/");

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <button
            onClick={() => {
              setActivePath(item.to);
              navigate(item.to);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium w-full text-left transition-colors ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
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
              {navItems.map(renderNavItem)}

              {/* Notifications */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => {
                      setActivePath("/ConnectionRequests");
                      navigate("/ConnectionRequests");
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium w-full text-left relative transition-colors ${
                      activePath === "/ConnectionRequests"
                        ? activeClass
                        : inactiveClass
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Connection Requests</span>
                    {unreadCount > 0 && (
                      <span className="absolute right-3 top-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 mt-auto space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={() => {
                  setActivePath("/profile");
                  navigate("/profile");
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium w-full text-left transition-colors ${
                  activePath === "/profile" ? activeClass : inactiveClass
                }`}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>
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
