import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ui/use-toast';
import api from '../utils/api';
import { MessageCircle, Reply, User, Calendar, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';

const ReviewCard = ({ review, onReplyAdded }) => {
  const { user } = useAppContext();
  const { toast } = useToast();
  const [showDoctorReplyForm, setShowDoctorReplyForm] = useState(false);
  const [showUserReplyForm, setShowUserReplyForm] = useState(false);
  const [doctorReplyText, setDoctorReplyText] = useState('');
  const [userReplyText, setUserReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(review.likes || []);
  const [liking, setLiking] = useState(false);

  const hasLiked = likes.includes(user?.id);

  const handleDoctorReply = async () => {
    if (!doctorReplyText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Reply cannot be empty',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/reviews/${review._id}/doctor-reply`, {
        reply: doctorReplyText,
      });

      if (response.data.success) {
        setDoctorReplyText('');
        setShowDoctorReplyForm(false);
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Reply added successfully',
        });
        onReplyAdded && onReplyAdded();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Error adding reply',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserReply = async () => {
    if (!userReplyText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Reply cannot be empty',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/reviews/${review._id}/user-reply`, {
        reply: userReplyText,
      });

      if (response.data.success) {
        setUserReplyText('');
        setShowUserReplyForm(false);
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Reply added successfully',
        });
        onReplyAdded && onReplyAdded();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Error adding reply',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please login to like reviews',
      });
      return;
    }

    setLiking(true);
    try {
      if (hasLiked) {
        const response = await api.post(`/reviews/${review._id}/unlike`);
        if (response.data.success) {
          setLikes(response.data.data.likes);
          toast({
            variant: 'success',
            title: 'Success',
            description: 'Like removed',
          });
        }
      } else {
        const response = await api.post(`/reviews/${review._id}/like`);
        if (response.data.success) {
          setLikes(response.data.data.likes);
          toast({
            variant: 'success',
            title: 'Success',
            description: 'Review liked',
          });
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Error updating like',
      });
    } finally {
      setLiking(false);
    }
  };

  return (
    <Card className="p-4 mb-4 bg-card">
      <div className="space-y-4">
        {/* Review Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">{review.patientId?.name}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Calendar className="h-3 w-3" />
              {review.createdAt && format(new Date(review.createdAt), 'MMM d, yyyy')}
            </div>
            {/* Rating Stars */}
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              ))}
              <span className="text-sm font-semibold ml-2 text-yellow-500">{review.rating}/5</span>
            </div>
            {/* Review Comment */}
            <p className="text-sm text-foreground mt-3 leading-relaxed">{review.comment}</p>
          </div>
        </div>

        {/* Doctor Reply */}
        {review.doctorReply && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 ml-8">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Doctor's Reply</div>
            <p className="text-sm text-foreground">{review.doctorReply}</p>
            {review.replyDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(review.replyDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}

        {/* User Replies */}
        {review.userReplies && review.userReplies.length > 0 && (
          <div className="space-y-2 ml-8">
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {review.userReplies.length} {review.userReplies.length === 1 ? 'Reply' : 'Replies'}
            </div>
            {review.userReplies.map((reply, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{reply.userId?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {reply.replyDate && format(new Date(reply.replyDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground mt-2">{reply.reply}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 flex-wrap items-center">
          {/* Like Button */}
          <Button
            size="sm"
            variant={hasLiked ? 'default' : 'outline'}
            onClick={handleLike}
            disabled={liking || !user}
            className={hasLiked ? 'bg-red-500 hover:bg-red-600' : 'gap-1'}
          >
            <ThumbsUp className={`h-3 w-3 ${hasLiked ? 'fill-current' : ''}`} />
            {likes.length > 0 && <span className="text-xs">{likes.length}</span>}
          </Button>

          {/* Doctor Reply Button */}
          {user?.role === 'doctor' && !review.doctorReply && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDoctorReplyForm(!showDoctorReplyForm)}
              className="gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply as Doctor
            </Button>
          )}

          {/* User Reply Button (Available to everyone) */}
          {user?.role === 'patient' && review.patientId?._id !== user?.id && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUserReplyForm(!showUserReplyForm)}
              className="gap-1"
            >
              <MessageCircle className="h-3 w-3" />
              Reply
            </Button>
          )}
        </div>

        {/* Doctor Reply Form */}
        {showDoctorReplyForm && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 ml-8">
            <div className="space-y-2">
              <Input
                placeholder="Write your reply..."
                value={doctorReplyText}
                onChange={(e) => setDoctorReplyText(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleDoctorReply}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDoctorReplyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Reply Form */}
        {showUserReplyForm && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 ml-8">
            <div className="space-y-2">
              <Input
                placeholder="Write your reply..."
                value={userReplyText}
                onChange={(e) => setUserReplyText(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUserReply}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUserReplyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReviewCard;
