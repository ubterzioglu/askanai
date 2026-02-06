import { supabase } from "@/integrations/supabase/client";

// Types
// Public poll interface - excludes sensitive fields like creator_key_hash
export interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'open' | 'closed';
  created_by_user_id: string | null;
  open_until: string | null;
  close_after_responses: number | null;
  visibility_mode: 'public' | 'unlisted' | 'voters' | 'private';
  allow_comments: boolean;
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
  user_id: string | null;
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
  user_id: string | null;
  status: 'visible' | 'hidden' | 'flagged';
  created_at: string;
}

// Generate a short random slug
const generateSlug = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate browser fingerprint (simple version)
export const getFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const data = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Poll CRUD operations
export const createPoll = async (
  title: string,
  description: string | null,
  questions: Array<{
    type: Question['type'];
    prompt: string;
    options: string[];
    isRequired: boolean;
  }>,
  settings: {
    visibility: Poll['visibility_mode'];
    allowComments: boolean;
  }
): Promise<{ poll: Poll; creatorKey: string } | null> => {
  // Generate unique slug
  let slug = generateSlug();
  let attempts = 0;
  
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('polls')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (!existing) break;
    slug = generateSlug();
    attempts++;
  }

  // Generate creator key (for anonymous ownership)
  const creatorKey = crypto.randomUUID();
  const creatorKeyHash = await hashKey(creatorKey);

  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      slug,
      title,
      description,
      status: 'open',
      creator_key_hash: creatorKeyHash,
      visibility_mode: settings.visibility,
      allow_comments: settings.allowComments,
    })
    .select()
    .single();

  if (pollError || !poll) {
    console.error('Error creating poll:', pollError);
    return null;
  }

  // Create questions and options
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        poll_id: poll.id,
        position: i,
        type: q.type,
        prompt: q.prompt,
        is_required: q.isRequired,
      })
      .select()
      .single();

    if (questionError || !question) {
      console.error('Error creating question:', questionError);
      continue;
    }

    // Create options for choice-based questions
    if (['single_choice', 'multiple_choice', 'ranking'].includes(q.type) && q.options.length > 0) {
      const optionsToInsert = q.options.map((label, index) => ({
        question_id: question.id,
        position: index,
        label,
      }));

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsToInsert);

      if (optionsError) {
        console.error('Error creating options:', optionsError);
      }
    }
  }

  return { poll: poll as Poll, creatorKey };
};

// Simple hash function for creator key
const hashKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get poll by slug - explicitly excludes creator_key_hash for security
export const getPollBySlug = async (slug: string): Promise<Poll | null> => {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      id, slug, title, description, status, created_by_user_id,
      open_until, close_after_responses, visibility_mode,
      allow_comments, created_at, updated_at
    `)
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

// Submit response
export const submitResponse = async (
  pollId: string,
  answers: Record<string, any>,
  respondentName?: string
): Promise<Response | null> => {
  const fingerprint = getFingerprint();

  // Check for duplicate submission
  const { data: existing } = await supabase
    .from('responses')
    .select('id')
    .eq('poll_id', pollId)
    .eq('fingerprint', fingerprint)
    .single();

  if (existing) {
    console.warn('Duplicate submission detected');
    // Allow for now, but could return null to prevent
  }

  // Create response
  const { data: response, error: responseError } = await supabase
    .from('responses')
    .insert({
      poll_id: pollId,
      respondent_name: respondentName || null,
      fingerprint,
    })
    .select()
    .single();

  if (responseError || !response) {
    console.error('Error creating response:', responseError);
    return null;
  }

  // Create answers
  const answersToInsert = Object.entries(answers).map(([questionId, value]) => {
    const answer: any = {
      response_id: response.id,
      question_id: questionId,
    };

    if (typeof value === 'string') {
      answer.value_text = value;
    } else if (typeof value === 'number') {
      answer.value_number = value;
    } else {
      answer.value_json = value;
    }

    return answer;
  });

  const { error: answersError } = await supabase
    .from('answers')
    .insert(answersToInsert);

  if (answersError) {
    console.error('Error creating answers:', answersError);
  }

  return response as Response;
};

// Get poll results - uses responses_public view to hide fingerprint data
export const getPollResults = async (pollId: string) => {
  const { data: responses, error: responsesError } = await supabase
    .from('responses_public')
    .select('id')
    .eq('poll_id', pollId);

  if (responsesError) {
    console.error('Error fetching responses:', responsesError);
    return null;
  }

  const responseIds = responses?.map(r => r.id) || [];

  if (responseIds.length === 0) {
    return { responseCount: 0, answers: [] };
  }

  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .in('response_id', responseIds);

  if (answersError) {
    console.error('Error fetching answers:', answersError);
    return null;
  }

  return {
    responseCount: responses?.length || 0,
    answers: answers || [],
  };
};

// Get comments - uses comments_public view to hide fingerprint data
export const getComments = async (pollId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments_public')
    .select('id, poll_id, display_name, body, user_id, status, created_at')
    .eq('poll_id', pollId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return (data || []) as Comment[];
};

// Add comment
export const addComment = async (
  pollId: string,
  body: string,
  displayName?: string
): Promise<Comment | null> => {
  const fingerprint = getFingerprint();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      poll_id: pollId,
      body,
      display_name: displayName || null,
      fingerprint,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return null;
  }

  return data as Comment;
};
