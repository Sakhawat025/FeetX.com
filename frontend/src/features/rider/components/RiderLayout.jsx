import RiderSidebar from "./RiderSidebar";
import RiderHeader from "./RiderHeader";
import RiderLocationSharing from "./RiderLocationSharing";

function RiderLayout({ children }) {
  return (
    <div className="min-h-screen bg-orange-50 flex">
      {/* Sidebar */}
      <RiderSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <RiderHeader />

        {/* Page Content */}
        <main className="px-6 py-5">
          <RiderLocationSharing />
          {children}
        </main>
      </div>
    </div>
  );
}

export default RiderLayout;
