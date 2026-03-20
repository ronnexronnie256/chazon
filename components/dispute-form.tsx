'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, X, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileWithPreview {
  file: File;
  preview: string;
}

interface DisputeFormProps {
  taskId: string;
  taskTitle: string;
  agreedPrice: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

const disputeReasons = [
  {
    value: 'QUALITY_ISSUE',
    label: 'Quality Issue',
    description: 'The service quality was poor or not as expected',
  },
  {
    value: 'NO_SHOW',
    label: 'No Show',
    description: 'The steward did not show up for the appointment',
  },
  {
    value: 'DAMAGE',
    label: 'Property Damage',
    description: 'Damage was caused to my property',
  },
  {
    value: 'OVERCHARGE',
    label: 'Overcharged',
    description: 'Was charged more than the agreed amount',
  },
  {
    value: 'INCOMPLETE_WORK',
    label: 'Incomplete Work',
    description: 'The work was not completed',
  },
  {
    value: 'COMMUNICATION',
    label: 'Communication Issue',
    description: 'Poor communication or responsiveness',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Another reason not listed above',
  },
];

export function DisputeForm({
  taskId,
  taskTitle,
  agreedPrice,
  currency,
  onClose,
  onSuccess,
}: DisputeFormProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(files[index].preview);
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Please select a reason for the dispute');
      return;
    }

    if (description.length < 20) {
      toast.error('Please provide more details (at least 20 characters)');
      return;
    }

    setLoading(true);

    try {
      // For now, we'll skip file uploads and just submit the dispute
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          reason,
          description,
          evidence: [], // TODO: Implement file uploads
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to file dispute');
      }

      toast.success(
        'Dispute filed successfully. We will review your case shortly.'
      );
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                File a Dispute
              </h2>
              <p className="text-sm text-gray-500">Task: {taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {/* Task Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Agreed Price</span>
              <span className="font-bold text-gray-900">
                {currency} {agreedPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What is the reason for this dispute?
            </label>
            <div className="space-y-2">
              {disputeReasons.map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    reason === option.value
                      ? 'border-chazon-primary bg-chazon-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={e => setReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please describe the issue in detail
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible about what happened..."
              rows={4}
              className="resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/20 minimum characters
            </p>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload evidence (optional)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <input
                type="file"
                id="evidence"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="evidence" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload photos or documents
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, PDF up to 10MB each
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-xs text-gray-500 truncate px-1">
                          {file.file.name}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Filing a dispute will freeze the payment
              for this task until our team reviews and resolves the case. We aim
              to resolve disputes within 3-5 business days.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !reason || description.length < 20}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'File Dispute'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
