-- First, delete duplicate responses keeping only the earliest one per poll_id/fingerprint
DELETE FROM responses a USING responses b
WHERE a.poll_id = b.poll_id 
  AND a.fingerprint = b.fingerprint
  AND a.fingerprint IS NOT NULL
  AND a.created_at > b.created_at;

-- Now add unique constraint to prevent future duplicates
-- Using partial index to only constrain non-null fingerprints
CREATE UNIQUE INDEX responses_poll_fingerprint_unique 
ON responses (poll_id, fingerprint) 
WHERE fingerprint IS NOT NULL;

-- Add comment body length validation
ALTER TABLE comments ADD CONSTRAINT comment_body_length 
CHECK (length(body) <= 2000);

ALTER TABLE comments ADD CONSTRAINT comment_display_name_length 
CHECK (display_name IS NULL OR length(display_name) <= 100);