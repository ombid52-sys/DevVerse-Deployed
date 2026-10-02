import React from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="flex-1 p-6 sm:p-10 max-w-7xl overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
