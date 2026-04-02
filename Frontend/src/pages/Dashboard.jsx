import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import {
  Plus,
  FileText,
  LogOut,
  User,
  Clock,
  ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 1. Fetch user's documents on load
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data } = await API.get("/docs");
        setDocuments(data);
      } catch (err) {
        console.error("Failed to fetch documents");
      }
    };
    fetchDocs();
  }, []);

  // 2. Create a new document and jump straight to it
  const createNewDoc = async () => {
    try {
      const { data } = await API.post("/docs", { title: "Untitled Document" });
      navigate(`/document/${data._id}`);
    } catch (err) {
      alert("Error creating document");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <div className="rounded-lg bg-indigo-600 p-1.5 text-white">
              <FileText size={20} />
            </div>
            CollabDoc
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User size={18} className="text-gray-400" />
              {user?.username}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 hover:border-red-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header Section */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Documents</h1>
            <p className="mt-1 text-gray-500">
              Manage and collaborate on your recent projects
            </p>
          </div>
          <button
            onClick={createNewDoc}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
          >
            <Plus size={20} />
            New Document
          </button>
        </div>

        {/* Documents Grid */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/document/${doc._id}`)}
                className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                  {doc.title || "Untitled Document"}
                </h3>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1 text-indigo-400"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
            <div className="rounded-full bg-gray-100 p-4 text-gray-400">
              <Plus size={32} />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No documents yet
            </h3>
            <p className="mt-1 text-gray-500">
              Create your first document to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
