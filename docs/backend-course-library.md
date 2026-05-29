# Backend Course Library

This backend scans a local course folder into SQLite and serves course media through ID-based routes.

## Environment

- `COURSES_DIR`, default `./courses`
- `DATA_DIR`, default `./data`
- `DATABASE_PATH`, default `./data/course-player.sqlite`

For this repo's current sample data, run commands with `COURSES_DIR=./examples/courses DATA_DIR=./examples/data`.

## Expected Folder Shape

```txt
courses/
  Course Folder Name/
    metadata.json
    coverimage.jpg
    01. Section Title/
      001. Lesson One.mp4
      Attachments/
        001. Brushname.abr
        001/
          Extra File.zip
```

## Curl Examples

```sh
curl -X POST http://localhost:3000/api/scan
curl http://localhost:3000/api/courses
curl -H "Range: bytes=0-1023" http://localhost:3000/media/lessons/1
```

## Manual Verification

1. Start the dev server.
2. Create `courses/Example Course/metadata.json`.
3. Add one section folder.
4. Add one lesson video.
5. Add one attachment.
6. `POST /api/scan`.
7. `GET /api/courses`.
8. `GET /api/courses/[slug]`.
9. Request a video with `Range: bytes=0-1023`.
