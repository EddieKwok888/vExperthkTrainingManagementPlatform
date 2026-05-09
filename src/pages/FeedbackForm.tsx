import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function FeedbackForm() {
  const { id } = useParams<{ id: string }>(); // represents courseId
  const navigate = useNavigate();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [studentName, setStudentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!id || !studentName.trim() || !comment.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        courseId: id,
        student_name: studentName,
        rating: parseInt(rating),
        comment,
        createdAt: serverTimestamp()
      });
      toast.success("Feedback submitted! Thank you.");
      navigate('/');
    } catch(e: any) {
      console.error(e);
      toast.error(e.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="bg-slate-50 border-b pb-6">
          <CardTitle>Course Feedback</CardTitle>
          <CardDescription>Tell us about your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name <span className="text-red-500">*</span></label>
            <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating (1-5)</label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select a rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 - Excellent</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="2">2 - Below Average</SelectItem>
                <SelectItem value="1">1 - Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comments <span className="text-red-500">*</span></label>
            <textarea 
              value={comment} 
              onChange={e => setComment(e.target.value)} 
              placeholder="How was the course?" 
              className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            />
          </div>
          <Button className="w-full gap-2 h-12 text-md mt-4" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-5 h-5 animate-spin"/>}
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
