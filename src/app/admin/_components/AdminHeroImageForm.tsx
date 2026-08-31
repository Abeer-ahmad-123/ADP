import NextImage from "next/image";
import { Images } from "lucide-react";

export default function AdminHeroImageForm({
  heroImageSrc,
}: {
  heroImageSrc: string;
}) {
  return (
    <section className="admin-panel admin-hero-image-panel" id="hero-image">
      <div className="admin-panel-heading">
        <Images aria-hidden="true" size={20} />
        <div>
          <p>Homepage</p>
          <h2>Hero image</h2>
        </div>
      </div>

      <div className="admin-hero-image-manager">
        <div className="admin-hero-image-preview">
          <NextImage
            alt="Current homepage hero image"
            fill
            sizes="(max-width: 760px) 100vw, 620px"
            src={heroImageSrc}
          />
        </div>

        <form
          action="/api/admin/settings/hero-image"
          method="post"
          encType="multipart/form-data"
          className="admin-form compact admin-hero-image-form"
        >
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
            Update hero image
          </button>
        </form>
      </div>
    </section>
  );
}
