import { FileUp } from "lucide-react";

export default function AdminMediaUploadForm() {
  return (
    <article className="admin-panel">
      <div className="admin-panel-heading">
        <FileUp aria-hidden="true" size={20} />
        <div>
          <p>Upload media</p>
          <h2>Add audio or video reels</h2>
        </div>
      </div>

      <form
        action="/api/admin/content/upload"
        method="post"
        encType="multipart/form-data"
        className="admin-form compact"
      >
        <label>
          <span>Media type</span>
          <select name="kind" required>
            <option value="video_reel">Video Reel</option>
            <option value="audio">Audio</option>
          </select>
        </label>
        <label>
          <span>Title</span>
          <input name="title" required placeholder="Video reel title" />
        </label>
        <label>
          <span>Summary</span>
          <textarea name="summary" placeholder="Short description" rows={3} />
        </label>
        <label>
          <span>File</span>
          <input
            name="file"
            required
            type="file"
            accept="audio/*,video/mp4,video/webm,video/quicktime"
          />
        </label>
        <button className="primary-button" type="submit">
          Upload media
        </button>
      </form>
    </article>
  );
}
