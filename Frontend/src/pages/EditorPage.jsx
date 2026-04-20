import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { io } from "socket.io-client";

import { AuthContext } from "../context/AuthContext";
import {
  ArrowLeft,
  Users,
  CloudCheck,
  Cloud,
  X,
  Sparkles,
  Wand2,
  Type,
  Send,
  History,
  RotateCcw,
  Save,
} from "lucide-react";
import axios from "axios";
import API from "../services/api";

const SAVE_INTERVAL_MS = 2000;

const EditorPage = () => {
  const { id: documentId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [title, setTitle] = useState("Loading...");
  const [isSaving, setIsSaving] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- PRESENCE & HISTORY STATE ---
  const [activeUsers, setActiveUsers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);

  // 1. Setup Socket
  useEffect(() => {
    const s = io("http://127.0.0.1:8000");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // 2. Join & Load Data
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (doc) => {
      quill.setContents(doc.content);
      setTitle(doc.title || "Untitled Document");
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // 3. Sync Presence
  useEffect(() => {
    if (socket == null) return;

    socket.on("update-presence", (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.off("update-presence");
      socket.emit("leave-document");
    };
  }, [socket]);

  // 4. Sync Content Changes
  useEffect(() => {
    if (socket == null || quill == null) return;
    const sendHandler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
      setIsSaving(true);
    };
    const receiveHandler = (delta) => {
      quill.updateContents(delta);
    };
    quill.on("text-change", sendHandler);
    socket.on("receive-changes", receiveHandler);
    return () => {
      quill.off("text-change", sendHandler);
      socket.off("receive-changes", receiveHandler);
    };
  }, [socket, quill]);

  // 5. Sync Title
  useEffect(() => {
    if (socket == null) return;
    socket.on("receive-title-update", (newTitle) => setTitle(newTitle));
    return () => socket.off("receive-title-update");
  }, [socket]);

  // 6. Debounced Title Save
  useEffect(() => {
    if (socket == null || title === "Loading...") return;
    const delayDebounceFn = setTimeout(() => {
      socket.emit("update-title", title);
      setIsSaving(false);
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [title, socket]);

  // 7. Auto-Save Content
  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
      setIsSaving(false);
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [socket, quill]);

  // --- VERSION HISTORY LOGIC ---
  const fetchVersions = async () => {
    try {
      const { data } = await API.get(`/docs/${documentId}/versions`);
      setVersions(data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const saveManualVersion = async () => {
    try {
      setIsSaving(true);
      await API.post(`/docs/${documentId}/versions`, {
        name: `Manual Save - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      });
      fetchVersions();
    } catch (err) {
      alert("Failed to save snapshot");
    } finally {
      setIsSaving(false);
    }
  };

  const restoreVersion = (versionContent) => {
    if (
      !window.confirm(
        "Restore this version? Unsaved changes will be overwritten.",
      )
    )
      return;
    quill.setContents(versionContent);
    const fullContent = quill.getContents();
    socket.emit("send-changes", fullContent);
    socket.emit("save-document", fullContent);
    setShowHistory(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `http://127.0.0.1:8000/api/docs/${documentId}/share`,
        { email: shareEmail },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
      socket.emit("user-shared", data.user);
      alert("Document shared successfully!");
      setShareEmail("");
      setShowShareModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Sharing failed");
    }
  };

  const handleAiAction = async (command) => {
    if (!quill) return;
    setIsAiLoading(true);
    const currentText = quill.getText();
    try {
      const { data } = await API.post("/ai/generate", {
        prompt: command,
        context: currentText,
      });
      const range = quill.getSelection() || {
        index: quill.getLength(),
        length: 0,
      };
      const aiText = `\n${data.suggestion}\n`;
      quill.insertText(range.index, aiText, {}, "user");
      const fullContent = quill.getContents();
      socket.emit("send-changes", fullContent);
      socket.emit("save-document", fullContent);
      setIsSaving(true);
    } catch (err) {
      alert("AI service is busy.");
    } finally {
      setIsAiLoading(false);
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 overflow-hidden relative">
      {/* Responsive Navigation Header */}
      <nav className="flex items-center justify-between bg-white px-3 sm:px-6 py-2 sm:py-3 shadow-sm border-b z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <button
            onClick={() => navigate("/")}
            className="rounded-full p-1.5 sm:p-2 hover:bg-gray-100 transition shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex flex-col overflow-hidden">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsSaving(true);
              }}
              className="text-sm sm:text-lg font-bold text-gray-800 outline-none bg-transparent truncate"
              placeholder="Untitled Document"
            />
            <div className="text-[10px] sm:text-xs font-medium">
              {isSaving ? (
                <div className="flex items-center gap-1 text-amber-600">
                  <Cloud size={12} className="animate-pulse" />{" "}
                  <span className="hidden xs:inline">Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <CloudCheck size={12} />{" "}
                  <span className="hidden xs:inline">Saved</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex -space-x-1.5 sm:-space-x-2 overflow-hidden mr-2">
            {activeUsers.slice(0, 3).map((activeUser) => (
              <div
                key={activeUser.id}
                title={activeUser.username}
                style={{ backgroundColor: activeUser.color || "#6366f1" }}
                className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0 transition-all hover:scale-110"
              >
                {activeUser.username?.charAt(0).toUpperCase()}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-400 border border-white"></span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setShowHistory(true);
                fetchVersions();
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
              title="Version History"
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1 sm:gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <Users size={14} />{" "}
              <span className="hidden xs:inline">Share</span>
            </button>
          </div>
        </div>
      </nav>

      {/* AI Tool Bar */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 text-indigo-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
          <Sparkles size={12} />{" "}
          <span className="hidden sm:inline">AI Assistant</span>
        </div>
        <div className="h-4 w-px bg-indigo-200 shrink-0" />
        <div className="flex gap-2 shrink-0">
          <button
            disabled={isAiLoading}
            onClick={() =>
              handleAiAction("Summarize current content into bullet points.")
            }
            className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-md text-[11px] font-medium text-indigo-600 border border-indigo-200 whitespace-nowrap"
          >
            <Type size={12} /> Summarize
          </button>
          <button
            disabled={isAiLoading}
            onClick={() => handleAiAction("Check grammar and spelling.")}
            className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-md text-[11px] font-medium text-indigo-600 border border-indigo-200 whitespace-nowrap"
          >
            <Wand2 size={12} /> Fix Grammar
          </button>
          <button
            disabled={isAiLoading}
            onClick={() =>
              handleAiAction("Continue writing the next paragraph.")
            }
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 rounded-md text-[11px] font-medium text-white shadow-sm whitespace-nowrap"
          >
            {isAiLoading ? "Typing..." : "Continue"} <Send size={10} />
          </button>
        </div>
      </div>

      {/* Main Editor & History Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Space */}
        <div className="flex-1 overflow-y-auto p-0 sm:p-4 md:p-8 flex justify-center bg-[#F8F9FA]">
          <div className="w-full sm:max-w-[816px] bg-white shadow-none sm:shadow-md min-h-full sm:min-h-[1056px] p-4 sm:p-8 md:p-[96px] relative">
            <ReactQuill
              theme="snow"
              ref={(el) => {
                if (el) setQuill(el.getEditor());
              }}
              className="editor-container"
            />
          </div>
        </div>

        {/* History Sidebar Overlay/Side */}
        {showHistory && (
          <div className="w-72 bg-white border-l shadow-xl flex flex-col z-30 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <History size={16} /> History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="hover:bg-gray-200 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <button
                onClick={saveManualVersion}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
              >
                <Save size={14} /> Create Snapshot
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <History size={32} className="mb-2 opacity-20" />
                  <p className="text-[11px] text-center px-4">
                    No snapshots yet. Click "Create Snapshot" to save the
                    current progress.
                  </p>
                </div>
              ) : (
                versions.map((v) => (
                  <div
                    key={v._id}
                    className="p-3 border rounded-lg bg-white hover:border-indigo-300 transition group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          {v.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(v.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreVersion(v.content)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Restore this version"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Share document
              </h3>
              <button onClick={() => setShowShareModal(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShare}>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                Enter collaborator's email.
              </p>
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4 text-sm"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ql-container.ql-snow { border: none !important; font-size: 16px; }
        .ql-toolbar.ql-snow { 
          border: none !important; 
          border-bottom: 1px solid #f3f4f6 !important; 
          position: sticky; 
          top: 0; 
          z-index: 10; 
          background: white; 
          display: flex; 
          flex-wrap: wrap;
          justify-content: center; 
          padding: 4px !important; 
        }
        @media (max-width: 640px) {
          .ql-toolbar.ql-snow { justify-content: flex-start; }
          .ql-editor { padding: 0 !important; font-size: 14px; }
        }
        .editor-container .ql-editor { min-height: 70vh; padding: 0 !important; line-height: 1.6; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default EditorPage;
