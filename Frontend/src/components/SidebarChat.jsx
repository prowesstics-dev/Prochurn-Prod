
import React, { useState } from "react";
import { FaPlus, FaUpload, FaDatabase, FaCheckCircle } from "react-icons/fa";
import toast from 'react-hot-toast';

export default function SidebarChat({
  conversations,
  onSelectConversation,
  onNewChat,
  onOpenDbModal,
  activeSource,
  onFileUploaded
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const toastId = toast.loading("Uploading file...");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("File uploaded successfully!", { id: toastId });
        if (onFileUploaded) onFileUploaded({ filename: uploadedFile.name });
      } else {
        toast.error(data.error || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error.", { id: toastId });
    }

    setUploading(false);
    event.target.value = null;
  };

  return (
    <div className="w-72 bg-gradient-to-b from-blue-600 to-cyan-500 text-white flex flex-col p-4 shadow-lg">
      <div>
        <h2 className="text-xl font-bold mb-4">Conversational Analytics</h2>

        <button
          onClick={onNewChat}
          className="flex items-center gap-2 mb-4 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md w-full"
        >
          <FaPlus size={16} /> New Chat
        </button>

        <label className="block cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md text-sm text-center">
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileUpload}
          />
          <div className="flex items-center justify-center gap-2">
            <FaUpload size={16} /> Upload File {activeSource === 'file' && <FaCheckCircle className="text-green-400" />}
          </div>
        </label>

        <button
          onClick={onOpenDbModal}
          className="mt-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md w-full"
        >
          <FaDatabase size={16} /> Connect to Database {activeSource === 'database' && <FaCheckCircle className="text-green-400" />}
        </button>

        <div className="mt-6 text-sm">
          <p className="mb-2 text-white/80">Recent Chats</p>
          <div className="flex flex-col gap-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`cursor-pointer px-3 py-1 rounded ${conv.selected ? 'bg-yellow-200 text-black font-semibold' : 'hover:bg-white/10'}`}
                onClick={() => onSelectConversation(conv.id)}
              >
                {conv.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
