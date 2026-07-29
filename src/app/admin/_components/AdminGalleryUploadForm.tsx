import { Images } from "lucide-react";

export default function AdminGalleryUploadForm() {
  return (
    <article className="admin-panel">
      <div className="admin-panel-heading">
        <Images aria-hidden="true" size={20} />
        <div>
          <p>Photo gallery</p>
          <h2>Upload public gallery images</h2>
        </div>
      </div>

      <form
        action="/api/admin/content/upload"
        method="post"
        encType="multipart/form-data"
        className="admin-form compact"
      >
        <input name="kind" type="hidden" value="gallery_photo" />
        <label>
          <span>Photo title</span>
          <input name="title" required placeholder="District meeting in Lahore" />
        </label>
        <label>
          <span>Caption / summary</span>
          <textarea
            name="summary"
            placeholder="Short caption shown below the photo"
            rows={3}
          />
        </label>
        <label>
          <span>Image file</span>
          <input
            name="file"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
          />
        </label>
        <button className="primary-button" type="submit">
          Upload photo
        </button>
      </form>
    </article>
  );
}
