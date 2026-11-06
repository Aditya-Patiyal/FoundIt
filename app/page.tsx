import { redirect } from "next/navigation";

// Browse is the real home. Middleware sends signed-out users to /sign-in; the
// (app) layout sends users without a hostel block to /onboarding.
export default function Home() {
  redirect("/browse");
}
