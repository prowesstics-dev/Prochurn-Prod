
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';

export default function DatabaseConnectModal({ isOpen, onClose, onConnect }) {
  const [form, setForm] = useState({
    dialect: 'postgresql',
    host: '',
    port: '5432',
    username: '',
    password: '',
    database: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Connecting to database...");

    const formData = new FormData();
    formData.append("db_config", JSON.stringify(form));

    try {
      const res = await fetch("http://localhost:8000/upload_file/", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Connected and schema embedded!", { id: toastId });
        onConnect(form);
        onClose();
      } else {
        toast.error(data.error || "Connection failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error", { id: toastId });
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
        <Dialog.Title className="text-xl font-semibold text-gray-800 mb-4 text-center">Connect to Database</Dialog.Title>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
              <input
                type="text"
                placeholder={`Enter ${key}`}
                value={value}
                onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 text-gray-600 hover:underline">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 shadow">Connect</button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}