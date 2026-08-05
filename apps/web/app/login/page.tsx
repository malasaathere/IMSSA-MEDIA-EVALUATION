import { LoginForm } from "../../src/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy-900">
          IMSSA Media Evaluation
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Select your workspace to continue
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 shadow-sm sm:px-8">
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-sm text-slate-600">
          Need access?{" "}
          <a href="/register" className="font-medium text-navy-700 hover:text-navy-900">
            Request platform access
          </a>
        </p>
      </div>
    </div>
  );
}
