import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { LoginContext } from "/src/loginContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token } = useContext(LoginContext);
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
