import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { DiamondBalance } from "./DiamondBalance";
import { DiamondIcon } from "./DiamondIcon";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ShoppingBag, Package, Users, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { isConnected, lastMessage } = useWebSocket(user?.id);

  // Listen for WebSocket balance updates
  useEffect(() => {
    if (lastMessage?.type === "balance_update" && lastMessage.userId === user?.id) {
      queryClient.setQueryData(["/api/auth/user"], (old: any) => ({
        ...old,
        diamondBalance: lastMessage.newBalance,
      }));
    }
  }, [lastMessage, user?.id]);

  const userMenuItems = [
    {
      title: "Store",
      url: "/",
      icon: ShoppingBag,
    },
    {
      title: "My Orders",
      url: "/orders",
      icon: Package,
    },
  ];

  const adminMenuItems = user?.isAdmin ? [
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Order Management",
      url: "/admin/orders",
      icon: Settings,
    },
  ] : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <DiamondIcon className="w-6 h-6" withShimmer />
          <span className="text-lg font-bold gradient-text">Diamond Store</span>
        </div>
        
        {user && (
          <div className="glass p-4 rounded-lg">
            <DiamondBalance balance={user.diamondBalance} size="lg" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Shop</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.isAdmin && adminMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t space-y-3">
        <ConnectionIndicator isConnected={isConnected} />
        
        {user && (
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>
                {user.firstName?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = "/api/logout"}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
