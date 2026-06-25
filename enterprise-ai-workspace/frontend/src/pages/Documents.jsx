import { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Download, Trash2, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/client';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function fetchDocuments() {
    api.get('/documents')
      .then((res) => setDocuments(res.data))
      .catch(() => setError('Could not load documents.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDocuments(); }, []);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/upload', formData);
      setSuccess(`"${file.name}" uploaded successfully.`);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    uploadFile(e.target.files[0]);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    uploadFile(e.dataTransfer.files[0]);
  }

  async function deleteDocument(id, filename) {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError('Could not delete document.');
    }
  }

  function downloadDocument(id) {
    window.open(`${import.meta.env.VITE_API_URL}/documents/${id}/download`, '_blank');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">Upload and manage your workspace documents.</p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-indigo-600">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload size={32} className="text-indigo-400" />
            <p className="font-medium text-gray-700">Drop a file here or click to browse</p>
            <p className="text-xs">PDF, DOCX, TXT and more</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm">Upload your first file above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors"
            >
              <FileText size={20} className="text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{doc.filename}</p>
                <p className="text-gray-400 text-xs">
                  {formatBytes(doc.file_size)} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => downloadDocument(doc.id)}
                  title="Download"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => deleteDocument(doc.id, doc.filename)}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
