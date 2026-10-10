import AdminSidebar from "./AdminSidebar";

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fffaf3] flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
