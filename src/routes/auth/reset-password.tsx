import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center">Reset Password</h1>
        <p className="text-gray-600 mb-6 text-center">
          Password reset functionality is under development.
        </p>
      </div>
    </div>
  );
}
