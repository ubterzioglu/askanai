# API

All endpoints live under `api/` and are deployed as Vercel Serverless Functions.

## Conventions

- Auth: optional `Authorization: Bearer <supabase_access_token>`
- Anonymous ownership: optional `x-creator-key: <creatorKey>`
- Errors:
  - `400 INVALID_*`
  - `403 GIVE_TO_GET_REQUIRED` for gated reads
  - `409 ALREADY_VOTED` / `DUPLICATE_COMMENT`
  - `429 RATE_LIMIT_*`

## Endpoints

### `POST /api/polls/create`

Creates a poll with questions/options. Returns a `creatorKey` once.

Body:

```json
{
  "title": "string",
  "description": "string|null",
  "questions": [
    { "type": "single_choice", "prompt": "string", "options": ["A"], "isRequired": true, "settingsJson": {} }
  ],
  "settings": { "visibility": "public|unlisted|voters|private", "allowComments": true, "previewImageUrl": null }
}
```

Response:

```json
{ "poll": { "...": "public fields only" }, "creatorKey": "uuid" }
```

### `POST /api/polls/:pollId/respond`

Submits one response per poll (deduped by `user_id` or `ip_hash`).

Body:

```json
{ "respondentName": "string?", "answers": { "<questionId>": "value" } }
```

Error:

- `409 ALREADY_VOTED`

### `GET /api/polls/:pollId/results`

Returns aggregated results only (no raw per-response dataset).

Errors:

- `403 GIVE_TO_GET_REQUIRED` when `visibility_mode = voters` and the user has not responded.

Response:

```json
{
  "responseCount": 12,
  "resultsByQuestionId": {
    "uuid": [ { "label": "A", "count": 3, "percent": 25 } ],
    "uuid2": { "average": "4.2", "scale": 5, "distribution": [10,20,30,20,20] }
  }
}
```

### `GET /api/polls/:pollId/comments`

Returns public comments (`comments_public` view).

Response:

```json
{ "comments": [ { "id": "...", "poll_id": "...", "display_name": "anon", "body": "text", "created_at": "..." } ] }
```

### `POST /api/polls/:pollId/comment`

Creates a comment (rate-limited + duplicate protected).

Body:

```json
{ "body": "string", "displayName": "string|null" }
```

### `GET /api/polls/:pollId/has-voted`

Returns:

```json
{ "hasVoted": true }
```

### `POST /api/polls/:pollId/view`

Records a view (deduped per poll per `ip_hash`).

### `GET /api/polls/:pollId/view-count`

Returns:

```json
{ "viewCount": 123 }
```

### `POST /api/storage/poll-image-signed-upload`

Returns a signed upload token so the client can upload a preview image without needing anonymous Storage write policies.

Body:

```json
{ "contentType": "image/png" }
```

Response:

```json
{ "path": "previews/..png", "token": "...", "signedUrl": "...", "publicUrl": "..." }
```

### `DELETE /api/polls/:pollId/delete`

Archives (soft-delete) a poll transactionally (moves a snapshot to `internal.polls_archive`, then deletes the poll).

Auth:

- Either `Authorization: Bearer ...` for authenticated ownership/admin
- Or `x-creator-key: ...` for anonymous ownership

### `POST /api/polls/:pollId/report`

Creates a moderation ticket/report (throttled; no public read access).

Body:

```json
{ "type": "spam|abuse|other", "message": "string|null", "commentId": "uuid|null" }
```
