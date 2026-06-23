# Fencing Training Tracker

A Next.js app to record post-training voice notes, transcribe the audio, extract structured fencing takeaways with Claude, and store sessions in Supabase.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Populate the environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET` (default `audio-recordings`)
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
3. Run `npm install`.
4. Apply the database schema to Supabase using `database/schema.sql`.
5. Start the app with `npm run dev`.

## Environment variables

- `SUPABASE_URL` — your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase key used for storage and DB writes.
- `SUPABASE_STORAGE_BUCKET` — Supabase storage bucket name for audio files.
- `OPENAI_API_KEY` — API key for Whisper transcription.
- `ANTHROPIC_API_KEY` — API key for Claude extraction.

> The backend currently stores audio with a Supabase public URL. If you use a private bucket, you may need to adjust the API to generate signed URLs.

## Project structure

- `app/record` — record voice notes and submit sessions.
- `app/history` — view session history.
- `app/session/[id]` — session details and takeaway completion.
- `app/insights` — open action items, category frequency, injury flags.
- `app/api/sessions` — session creation and listing.
- `app/api/takeaways/[id]` — action item updates.
- `app/api/insights` — aggregated insights.

## Notes

- All transcription and Claude calls happen server-side.
- The app stores raw transcripts, summaries, and categorized takeaways in Supabase.
- The backend currently uses the OpenAI Whisper endpoint for transcription and Claude Sonnet for structured extraction.
# fencingTracker
