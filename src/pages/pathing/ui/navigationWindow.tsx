import { FunctionComponent } from "react";
import { BackArrowIcon } from "./backArrowIcon";

import "./navigationWindow.css";

export const NavWindow: FunctionComponent = () => {
  return <div className="navWindow">
    <a href="/" className="navLink">
      <BackArrowIcon />
      Back
    </a>
  </div>
}