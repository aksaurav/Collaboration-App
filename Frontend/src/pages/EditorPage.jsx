import { useEffect, useState, useContext, useRef, useCallback } from "react";
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
  AlertCircle,
} from "lucide-react";
import API from "../services/api";

const SAVE_INTERVAL_MS = 2000;

const EditorPage = () => {
  const { id: documentId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Refs for stable instances
  const socketRef = useRef();
  const quillRef = useRef();

  // State
  const [title, setTitle] = useState("Loading...");
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Presence & History
  const [activeUsers, setActiveUsers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);

  // 1. Setup Socket Connection
  useEffect(() => {
    const rawUrl = "https://collaboration-app-1.onrender.com/api";

    if (typeof rawUrl !== "string") {
      console.error("API URL is not a valid string.");
      return;
    }

    // Strip /api for the socket connection
    const socketUrl = rawUrl.replace("/api", "");

    const s = io(socketUrl, {
      auth: { token: localStorage.getItem("token") },
    });

    socketRef.current = s;

    s.on("connect", () => {
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  // 2. Document Loading & REAL-TIME Sync
  useEffect(() => {
    if (!socketRef.current || !isConnected) return;
    const socket = socketRef.current;
    const quill = quillRef.current?.getEditor();

    if (!quill) return;

    // Join room and load initial data
    socket.once("load-document", (doc) => {
      quill.setContents(doc.content);
      setTitle(doc.title || "Untitled Document");
      quill.enable();
    });

    socket.emit("get-document", documentId);

    // LIVE UPDATE HANDLER: This makes changes show for other users
    const receiveHandler = (delta) => {
      // updateContents merges changes from others without moving your own cursor
      quill.updateContents(delta);
    };

    socket.on("receive-changes", receiveHandler);
    socket.on("receive-title-update", (newTitle) => setTitle(newTitle));
    socket.on("update-presence", (users) => setActiveUsers(users));

    return () => {
      socket.off("receive-changes", receiveHandler);
      socket.off("receive-title-update");
      socket.off("update-presence");
    };
  }, [documentId, isConnected]);

  // 3. Emit Local Changes to Server
  const handleTextChange = useCallback((delta, oldDelta, source) => {
    if (source !== "user" || !socketRef.current) return;
    socketRef.current.emit("send-changes", delta);
    setIsSaving(true);
  }, []);

  // 4. Debounced Title Sync
  useEffect(() => {
    if (!socketRef.current || title === "Loading...") return;
    const delayDebounceFn = setTimeout(() => {
      socketRef.current.emit("update-title", title);
      setIsSaving(false);
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [title]);

  // 5. Automatic Persistence (Save to DB)
  useEffect(() => {
    if (!socketRef.current) return;
    const interval = setInterval(() => {
      const quill = quillRef.current?.getEditor();
      if (quill && socketRef.current.connected) {
        socketRef.current.emit("save-document", quill.getContents());
        setIsSaving(false);
      }
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // --- VERSION HISTORY ---
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
        name: `Snapshot - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      });
      fetchVersions();
    } catch (err) {
      alert("Snapshot failed");
    } finally {
      setIsSaving(false);
    }
  };

  const restoreVersion = (versionContent) => {
    if (
      !window.confirm(
        "Restore this version? current progress will be replaced.",
      )
    )
      return;
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    quill.setContents(versionContent);
    const fullContent = quill.getContents();
    socketRef.current.emit("send-changes", fullContent);
    socketRef.current.emit("save-document", fullContent);
    setShowHistory(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/docs/${documentId}/share`, {
        email: shareEmail,
      });
      socketRef.current.emit("user-shared", data.user);
      alert("Shared successfully!");
      setShareEmail("");
      setShowShareModal(false);
    } catch (err) {
      alert("Sharing failed");
    }
  };

  const handleAiAction = async (command) => {
    const quill = quillRef.current?.getEditor();
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

      quill.insertText(range.index, aiText, "user");
      const fullContent = quill.getContents();
      socketRef.current.emit("send-changes", fullContent);
      socketRef.current.emit("save-document", fullContent);
      setIsSaving(true);
    } catch (err) {
      alert("AI Assistant error");
    } finally {
      setIsAiLoading(false);
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 overflow-hidden relative">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-white px-3 sm:px-6 py-2 sm:py-3 shadow-sm border-b z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <button
            onClick={() => navigate("/")}
            className="rounded-full p-2 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex flex-col">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsSaving(true);
              }}
              className="text-sm sm:text-lg font-bold text-gray-800 outline-none truncate w-full max-w-[200px] sm:max-w-md"
            />
            <div className="text-[10px] sm:text-xs font-medium">
              {!isConnected ? (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> Offline
                </span>
              ) : isSaving ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <Cloud size={12} className="animate-pulse" /> Saving...
                </span>
              ) : (
                <span className="text-green-600 flex items-center gap-1">
                  <CloudCheck size={12} /> Saved
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((u) => (
              <div
                key={u.id}
                style={{ backgroundColor: u.color || "#6366f1" }}
                className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
              >
                {u.username?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setShowHistory(true);
              fetchVersions();
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <History size={20} />
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-indigo-600 px-3 py-1.5 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
          >
            Share
          </button>
        </div>
      </nav>

      {/* AI Assistant Tool Bar */}
      <div className="bg-indigo-50 border-b px-4 py-2 flex items-center gap-3 overflow-x-auto">
        <Sparkles size={14} className="text-indigo-600" />
        <button
          disabled={isAiLoading || !isConnected}
          onClick={() => handleAiAction("Summarize this content.")}
          className="px-2 py-1 bg-white text-[11px] border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Summarize
        </button>
        <button
          disabled={isAiLoading || !isConnected}
          onClick={() => handleAiAction("Fix grammar errors.")}
          className="px-2 py-1 bg-white text-[11px] border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Fix Grammar
        </button>
        <button
          disabled={isAiLoading || !isConnected}
          onClick={() => handleAiAction("Continue writing.")}
          className="px-2 py-1 bg-indigo-600 text-white text-[11px] rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAiLoading ? "Processing..." : "Continue Writing"}
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-[#F8F9FA]">
          <div className="w-full max-w-[816px] bg-white shadow-md min-h-full p-8 sm:p-16">
            <ReactQuill
              theme="snow"
              ref={quillRef}
              onChange={handleTextChange}
              className="editor-container"
            />
          </div>
        </div>

        {/* Sidebar */}
        {showHistory && (
          <div className="w-72 bg-white border-l shadow-xl flex flex-col z-30">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">History</h3>
              <button onClick={() => setShowHistory(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <button
                onClick={saveManualVersion}
                className="w-full py-2 mb-4 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold"
              >
                Create Snapshot
              </button>
              {versions.map((v) => (
                <div
                  key={v._id}
                  className="p-3 border rounded-lg mb-2 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold truncate">{v.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(v.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreVersion(v.content)}
                    className="text-indigo-600"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Invite collaborator</h3>
              <button onClick={() => setShowShareModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShare}>
              <input
                type="email"
                required
                placeholder="Collaborator's email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="text-sm text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ql-container.ql-snow { border: none !important; font-size: 16px; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f3f4f6 !important; background: white; padding: 4px !important; }
        .editor-container .ql-editor { min-height: 70vh; padding: 0 !important; }
      `}</style>
    </div>
  );
};

export default EditorPage;
