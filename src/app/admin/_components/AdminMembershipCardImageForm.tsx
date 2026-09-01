import NextImage from "next/image";
import { BadgeCheck } from "lucide-react";

export default function AdminMembershipCardImageForm({
  membershipCardImageSrc,
}: {
  membershipCardImageSrc: string;
}) {
  return (
    <section
      className="admin-panel admin-membership-card-image-panel"
      id="membership-card-image"
    >
      <div className="admin-panel-heading">
        <BadgeCheck aria-hidden="true" size={20} />
        <div>
          <p>Membership card</p>
          <h2>Top image</h2>
        </div>
      </div>

      <div className="admin-membership-card-image-manager">
        <div className="admin-membership-card-image-preview">
          <NextImage
            alt="Current membership card top image"
            fill
            sizes="(max-width: 760px) 100vw, 420px"
            src={membershipCardImageSrc}
          />
        </div>

        <form
          action="/api/admin/settings/membership-card-image"
          method="post"
          encType="multipart/form-data"
          className="admin-form compact admin-membership-card-image-form"
        >
          <label>
            <span>Image file</span>
            <input
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              required
            />
          </label>
          <button className="primary-button" type="submit">
            Save card image
          </button>
        </form>
      </div>
    </section>
  );
}
