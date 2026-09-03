import Home from "@/components/Home";
import Marquee from "@/components/marquee";
import Statement from "@/components/statement";
import HowItWorks from "@/components/how-it-works";
import Bentogrid from "@/components/bentogrid/Bentogrid";
import Faq from "@/components/faq";

export default function LandingPage() {
  return (
    <>
      <Home />
      <Marquee />
      <HowItWorks />
      <Bentogrid />
      <Statement />
      <Faq />
    </>
  );
}
