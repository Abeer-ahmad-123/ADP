import ApproachMotionList from "@/components/ApproachMotionList";
import { APPROACH_POINTS } from "@/data/partyContent";

export default function ApproachSection() {
  return (
    <section id="approach" className="section-band approach-band">
      <div className="section-inner approach-layout">
        <div className="section-heading approach-heading reveal-up">
          <p className="eyebrow">Our Approach</p>
          <h2>A pragmatic manifesto, plainly stated.</h2>
        </div>

        <ApproachMotionList points={APPROACH_POINTS} />
      </div>
    </section>
  );
}
