import { RegisterForm } from "../../src/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-register">
        <section className="auth-intro">
          <img src="/branding/imssa-media-logo.png" alt="IMSSA Media" className="auth-logo-image" />
          <p className="auth-kicker">JOIN THE WORKSPACE</p>
          <h1>Great media starts with a clear workflow.</h1>
          <p>Request the right role and your coordinator will review your access.</p>
          <div className="auth-art" aria-hidden="true"><span /><span /><span /></div>
        </section>
        <section className="auth-panel">
          <div className="auth-heading">
            <h2>Request access</h2>
            <p>Tell us how you contribute to the media team.</p>
          </div>
          <div className="auth-form-card">
            <RegisterForm />
          </div>
          <p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p>
        </section>
      </div>
    </div>
  );
}
