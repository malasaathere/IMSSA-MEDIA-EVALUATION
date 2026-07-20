import { UserProfile } from "../../src/components/profile/UserProfile";

export default function ProfilePage() {
  return (
    <div className="p-6 md:p-12">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-navy-950">My Profile</h1>
        <p className="text-slate-500 mt-2">
          View your platform permissions and account details.
        </p>
      </div>
      
      <UserProfile />
    </div>
  );
}
