import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

// Updated Imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; // Changed from Dashboard to Home
import EditorPage from "./pages/EditorPage";

// A simple wrapper to protect private routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-medium text-gray-500">
        <div className="animate-pulse">Loading workspace...</div>
      </div>
    );

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home /> {/* This now renders your new Home.jsx component */}
              </ProtectedRoute>
            }
          />

          {/* Note: Changed path to /documents/:id to match your 
            navigate calls and controller logic 
          */}
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
