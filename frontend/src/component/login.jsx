import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

const LoginButton = ({ className }) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button  
      onClick={() => loginWithRedirect()} 
      className={`${className} px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/30`}
    >
      Sign Up
    </button>
  );
};

export default LoginButton;
