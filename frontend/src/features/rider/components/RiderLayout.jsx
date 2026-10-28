import RiderSidebar from "./RiderSidebar";
import RiderHeader from "./RiderHeader";
import RiderLocationSharing from "./RiderLocationSharing";

export default function RiderLayout({ children }) {
  return (
    <div className="min-h-screen bg-orange-50 md:flex">
      <RiderSidebar />

      <div className="min-w-0 flex-1 md:ml-64">
        <RiderHeader />

        <main className="px-3 pb-6 pt-3 sm:px-6">
          <RiderLocationSharing />
          {children}
        </main>
      </div>
    </div>
  );
}