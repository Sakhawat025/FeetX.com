import CustomerSidebar from "./components/CustomerSidebar";

function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fffaf3] flex">
      {/* Customer Sidebar */}
      <CustomerSidebar />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

export default CustomerLayout;
