import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect, useState } from "react";
import { LoginContext } from "./loginContext.jsx";
import ErrorBoundary from './ErrorBoundary.jsx';
import AuthCallback from './components/AuthCallback/index.jsx';

// Import Pages
import Login from './Pages/Login/index.jsx'
import Dashboard from './Pages/Dashboard/index.jsx';
import Trips from './Pages/Trips/index.jsx';
import Bookings from './Pages/Bookings/index.jsx';
import Profile from './Pages/Profile/index.jsx';
import View from './Pages/ViewTrips/index.jsx';
import New from './Pages/NewTrips/index.jsx';
import Edit from './Pages/EditTrips/index.jsx';
import Vehicle from './Pages/Vehicle/index.jsx';

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard />},
  { path: "/trips", element: <Trips />},
  { path: "/bookings", element: <Bookings />},
  { path: "/profile", element: <Profile />},
  { path: "/auth/callback", element: <AuthCallback />},
  { path: "/trips/view", element: <View />},
  { path: "/trips/new", element: <New />},
  { path: "/trips/edit", element: <Edit />},
  { path: "/trips/edit/:id", element: <Edit />},
  { path: "/vehicles", element: <Vehicle />}
]);

export default function AppWrapper() {
  // Use localStorage for persistence (not sessionStorage)
  const getValue = (key, fallback = "") => {
    return localStorage.getItem(key) || fallback;
  };

  // Only keep what's needed for your app
  const [userName, setUserName] = useState(() => getValue("userName"));
  const [email, setEmail] = useState(() => getValue("email"));
  const [token, setToken] = useState(() => getValue("token"));
  const [user_id, setUser_id] = useState(() => getValue("user_id"));
  const [profile_pic, setProfile_pic] = useState(() => getValue(null));
  const [firstTimeLogin, setFirstTimeLogin] = useState(() => {
    const hasSeenTour = localStorage.getItem("hasCompletedOnboardingTour");
    return hasSeenTour !== "true";
  });

  // Sync state to localStorage (persistent)
  useEffect(() => {
    if (userName) localStorage.setItem("userName", userName);
    else localStorage.removeItem("userName");
  }, [userName]);

  useEffect(() => {
    if (email) localStorage.setItem("email", email);
    else localStorage.removeItem("email");
  }, [email]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user_id) localStorage.setItem("user_id", user_id);
    else localStorage.removeItem("user_id");
  }, [user_id]);

  useEffect(() => {
    if (profile_pic) localStorage.setItem("profile_pic", profile_pic);
    else localStorage.removeItem("profile_pic");
  }, [profile_pic]);

  useEffect(() => {
    localStorage.setItem("firstTimeLogin", JSON.stringify(firstTimeLogin));
  }, [firstTimeLogin]);

  return (
    <ErrorBoundary>
      <LoginContext.Provider
        value={{
          userName, setUserName,
          email, setEmail,
          token, setToken,
          user_id, setUser_id,
          profile_pic, setProfile_pic,
          firstTimeLogin, setFirstTimeLogin
        }}
      >
        <RouterProvider router={router} />
      </LoginContext.Provider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')).render(<AppWrapper />);