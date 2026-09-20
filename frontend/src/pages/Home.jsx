import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import Stats from "../components/home/Stats";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import DashboardPreview from "../components/home/DashboardPreview";
import Footer from "../components/home/Footer";


function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Footer />
    </div>
  );
}

export default Home;
