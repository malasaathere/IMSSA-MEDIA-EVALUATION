import React, { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Star } from "lucide-react";

interface PostApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: { rating: number; message: string; suggestions: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function PostApprovalDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: PostApprovalDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const handleSave = async () => {
    await onSubmit({ rating, message, suggestions });
    setRating(0);
    setMessage("");
    setSuggestions("");
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Significant improvement needed";
      case 2: return "Below expectations";
      case 3: return "Meets expectations";
      case 4: return "Strong work";
      case 5: return "Excellent work";
      default: return "Select a rating";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-950 mb-1">Performance Feedback</h2>
          <p className="text-sm text-text-muted">
            Approve this task and provide constructive feedback for the designer.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-950 mb-2">Rating</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 rounded"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      (hoverRating || rating) >= star ? "fill-warning text-warning" : "text-border"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-4 text-sm font-medium text-text-muted">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-950 mb-2">Improvement Message</label>
            <textarea
              className="w-full rounded-md border border-border p-3 text-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              rows={3}
              placeholder="What could be improved next time?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-950 mb-2">Suggestions for Future Designs (Optional)</label>
            <textarea
              className="w-full rounded-md border border-border p-3 text-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              rows={2}
              placeholder="Any general suggestions or resources?"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? 'Approving...' : 'Submit Feedback'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
