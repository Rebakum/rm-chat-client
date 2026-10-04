import AuthGuard from "@/components/common/AuthGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SocketProvider } from "@/constants/SocketContext";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["ADMIN", "MODERATOR"]}>
      <SocketProvider>
        <DashboardShell>{children}</DashboardShell>
      </SocketProvider>
    </AuthGuard>
  );
}
