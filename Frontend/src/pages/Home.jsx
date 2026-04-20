import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  FileText,
  Plus,
  Users,
  LogOut,
  Trash2,
  ShieldAlert,
} from "lucide-react";

const Home = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data } = await API.get("/docs");
        setDocuments(data);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const createNewDoc = async () => {
    try {
      const { data } = await API.post("/docs");
      navigate(`/documents/${data._id}`);
    } catch (err) {
      alert("Error creating document");
    }
  };

  const deleteDocument = async (e, id) => {
    // Prevent navigation to the editor when clicking delete
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Are you sure? This will permanently delete the document and all its version history. This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await API.delete(`docs/${id}`);
      // Optimistic UI update: remove from list immediately
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to delete document";
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 sm:px-8 py-4 shadow-sm border-b border-gray-100 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl sm:text-2xl">
          <FileText size={24} className="sm:w-[28px]" />
          <span>Collaboratron</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[80px] sm:max-w-none">
              {user?.username}
            </span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Your Documents
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Manage and collaborate on your projects
            </p>
          </div>
          <button
            onClick={createNewDoc}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
          >
            <Plus size={20} /> New Document
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-sm">Loading your workspace...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 px-4">
            <FileText
              size={40}
              className="mx-auto text-gray-300 mb-4 sm:w-[48px]"
            />
            <p className="text-sm sm:text-base text-gray-500">
              No documents yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {documents.map((doc) => {
              const isOwner = doc.owner?._id === user?._id;

              return (
                <Link
                  key={doc._id}
                  to={`/documents/${doc._id}`}
                  className="group relative bg-white p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all active:bg-gray-50 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText size={20} className="sm:w-[24px]" />
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {!isOwner && (
                          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            <Users size={10} className="sm:w-[12px]" /> Shared
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-full">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </div>
                          <span className="text-[9px] font-black text-indigo-600 tracking-tighter uppercase">
                            Live
                          </span>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate mb-1">
                      {doc.title || "Untitled Document"}
                    </h2>

                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-[11px] sm:text-xs font-medium">
                        {isOwner ? (
                          <span className="text-gray-400 italic">
                            You own this
                          </span>
                        ) : (
                          <span className="text-indigo-600">
                            Shared by {doc.owner?.username}
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400">
                        Last updated{" "}
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* DELETE BUTTON SECTION */}
                  {isOwner && (
                    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                      <button
                        onClick={(e) => deleteDocument(e, doc._id)}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-red-600 transition-colors py-1 px-2 rounded-md hover:bg-red-50"
                        title="Delete Permanently"
                      >
                        <Trash2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          Delete
                        </span>
                      </button>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
