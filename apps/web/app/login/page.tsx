import { LoginForm } from "../../src/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-intro">
          <img src="/branding/imssa-media-logo.png" alt="IMSSA Media" className="auth-logo-image" />
          <p className="auth-kicker">IMSSA MEDIA WORKSPACE</p>
          <h1>Plan, create and approve media—together.</h1>
          <p>One calm workspace for every campaign, draft, review and deadline.</p>
          <div className="auth-art" aria-hidden="true"><span /><span /><span /></div>
        </section>
        <section className="auth-panel">
          <div className="auth-heading">
            <h2>Welcome back</h2>
            <p>Select your workspace to continue</p>
          </div>
          <div className="auth-form-card">
            <LoginForm />
          </div>
          <p className="auth-switch">
          Need access?{" "}
          <a href="/register" className="font-medium text-navy-700 hover:text-navy-900">
            Request platform access
          </a>
          </p>
        </section>
      </div>
    </div>
  );
}
