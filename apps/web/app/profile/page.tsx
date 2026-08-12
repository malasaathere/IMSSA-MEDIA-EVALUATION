import { UserProfile } from "../../src/components/profile/UserProfile";

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="page-heading mx-auto mb-8 max-w-4xl">
        <div><p>ACCOUNT SETTINGS</p><h1>Profile & Preferences</h1><span>Manage your account details, permissions and notifications.</span></div>
      </div>
      
      <div className="mx-auto max-w-4xl"><UserProfile /></div>
    </div>
  );
}
