import { supabase } from "@/integrations/supabase/client";
import { apiJson } from "@/lib/api";

// Types
// Public poll interface - excludes sensitive fields like creator_key_hash
export interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'open' | 'closed';
  open_until: string | null;
  close_after_responses: number | null;
  visibility_mode: 'public' | 'unlisted' | 'voters' | 'private';
  allow_comments: boolean;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Internal poll interface with sensitive fields (used only server-side/admin)
interface PollInternal extends Poll {
  creator_key_hash: string | null;
}

export interface Question {
  id: string;
  poll_id: string;
  position: number;
  type: 'single_choice' | 'multiple_choice' | 'rating' | 'nps' | 'ranking' | 'short_text' | 'emoji';
  prompt: string;
  is_required: boolean;
  settings_json: Record<string, any>;
  created_at: string;
}

export interface Option {
  id: string;
  question_id: string;
  position: number;
  label: string;
  created_at: string;
}

// Public response interface - excludes fingerprint for privacy
export interface Response {
  id: string;
  poll_id: string;
  respondent_name: string | null;
  created_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value_text: string | null;
  value_number: number | null;
  value_json: any;
  created_at: string;
}

// Public comment interface - excludes fingerprint for privacy
export interface Comment {
  id: string;
  poll_id: string;
  display_name: string | null;
  body: string;
  created_at: string;
}

// Poll CRUD operations
export const createPoll = async (
  title: string,
  description: string | null,
  questions: Array<{
    type: Question['type'];
    prompt: string;
    options: string[];
    isRequired: boolean;
    settingsJson?: Record<string, any>;
  }>,
  settings: {
    visibility: Poll['visibility_mode'];
    allowComments: boolean;
    previewImageUrl?: string | null;
  }
): Promise<{ poll: Poll; creatorKey: string } | null> => {
  try {
    const data = await apiJson<{ poll: Poll; creatorKey: string }>('/api/polls/create', {
      method: 'POST',
      body: { title, description, questions, settings },
      includeAuth: true,
    });
    return { poll: data.poll, creatorKey: data.creatorKey };
  } catch (e) {
    console.error('Error creating poll:', e);
    return null;
  }
};

// Get poll by slug - uses polls_public view to exclude creator_key_hash
export const getPollBySlug = async (slug: string): Promise<Poll | null> => {
  const { data, error } = await supabase
    .from('polls_public')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching poll:', error);
    return null;
  }

  return data as Poll;
};

// Get poll with questions and options
export const getPollWithQuestions = async (slug: string): Promise<{
  poll: Poll;
  questions: (Question & { options: Option[] })[];
} | null> => {
  const poll = await getPollBySlug(slug);
  if (!poll) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('poll_id', poll.id)
    .order('position');

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return null;
  }

  // Fetch options for all questions
  const questionsWithOptions = await Promise.all(
    (questions || []).map(async (q) => {
      const { data: options } = await supabase
        .from('options')
        .select('*')
        .eq('question_id', q.id)
        .order('position');

      return {
        ...q,
        options: (options || []) as Option[],
      } as Question & { options: Option[] };
    })
  );

  return {
    poll,
    questions: questionsWithOptions,
  };
};

// Check if user has already voted on a poll
export const hasAlreadyVoted = async (pollId: string): Promise<boolean> => {
  // Check localStorage first for immediate feedback
  const localKey = `voted_${pollId}`;
  if (localStorage.getItem(localKey)) {
    return true;
  }

  try {
    const data = await apiJson<{ hasVoted: boolean }>(`/api/polls/${pollId}/has-voted`, {
      method: 'GET',
      includeAuth: true,
    });
    if (data.hasVoted) localStorage.setItem(localKey, 'true');
    return data.hasVoted;
  } catch {
    return false;
  }
};

// Submit response
export const submitResponse = async (
  pollId: string,
  answers: Record<string, any>,
  respondentName?: string
): Promise<{ success: boolean; response?: Response; error?: string }> => {
  const localKey = `voted_${pollId}`;

  // Check localStorage first for immediate feedback
  if (localStorage.getItem(localKey)) {
    return { success: false, error: 'already_voted' };
  }

  try {
    const data = await apiJson<{ success: boolean; response: Response }>(`/api/polls/${pollId}/respond`, {
      method: 'POST',
      body: { answers, respondentName },
      includeAuth: true,
    });

    localStorage.setItem(localKey, 'true');
    return { success: true, response: data.response };
  } catch (e: any) {
    if (e?.code === 'ALREADY_VOTED') {
      localStorage.setItem(localKey, 'true');
      return { success: false, error: 'already_voted' };
    }
    console.error('Error submitting response:', e);
    return { success: false, error: 'submission_failed' };
  }
};

// Get poll results (aggregated backend response; no raw per-response dataset exposed)
export const getPollResults = async (pollId: string): Promise<{ responseCount: number; resultsByQuestionId: Record<string, any> } | null> => {
  try {
    return await apiJson<{ responseCount: number; resultsByQuestionId: Record<string, any> }>(`/api/polls/${pollId}/results`, {
      method: 'GET',
      includeAuth: true,
    });
  } catch (e: any) {
    console.error('Error fetching results:', e);
    return null;
  }
};

export const getComments = async (pollId: string): Promise<Comment[]> => {
  try {
    const data = await apiJson<{ comments: Comment[] }>(`/api/polls/${pollId}/comments`, {
      method: 'GET',
      includeAuth: false,
    });
    return data.comments || [];
  } catch (e) {
    console.error('Error fetching comments:', e);
    return [];
  }
};

// Add comment
export const addComment = async (
  pollId: string,
  body: string,
  displayName?: string
): Promise<Comment | null> => {
  try {
    const data = await apiJson<{ comment: Comment }>(`/api/polls/${pollId}/comment`, {
      method: 'POST',
      body: { body, displayName: displayName || null },
      includeAuth: true,
    });
    return data.comment;
  } catch (e) {
    console.error('Error creating comment:', e);
    return null;
  }
};

export const trackPollView = async (pollId: string): Promise<boolean> => {
  try {
    await apiJson<{ ok: boolean }>(`/api/polls/${pollId}/view`, { method: 'POST', includeAuth: true });
    return true;
  } catch {
    return false;
  }
};

// Get poll view count
export const getPollViewCount = async (pollId: string): Promise<number> => {
  try {
    const data = await apiJson<{ viewCount: number }>(`/api/polls/${pollId}/view-count`, { method: 'GET', includeAuth: false });
    return data.viewCount || 0;
  } catch {
    return 0;
  }
};
