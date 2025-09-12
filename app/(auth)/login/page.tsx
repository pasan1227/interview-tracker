import { LoginForm } from "@/components/auth/login-form";


export default function LoginPage() {
  return (
    <div className='h-full min-h-screen w-full mx-auto my-auto max-w-md space-y-6 flex items-center justify-center'>
      <LoginForm />
    </div>
  );
}
