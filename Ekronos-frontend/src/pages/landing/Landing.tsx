import React, {useRef} from "react";
import {useGSAP} from "@gsap/react";
import "./ekron-landing.css";
import {Header} from "./Header";
import {Hero} from "./Hero";
import {Capabilities} from "./Capabilities";
import {UxPhilosophy} from "./UxPhilosophy";
import {Roadmap} from "./Roadmap";
import {Footer} from "./Footer";
import {initLandingAnimations} from "./animations";

export default function Landing() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!rootRef.current) {
        return undefined;
      }
      return initLandingAnimations(rootRef.current);
    },
    {scope: rootRef},
  );

  return (
    <div className="ekron" ref={rootRef}>
      <Header/>
      <Hero/>
      <Capabilities/>
      <UxPhilosophy/>
      <Roadmap/>
      <Footer/>
    </div>
  );
}
