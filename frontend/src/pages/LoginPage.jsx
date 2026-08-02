import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm, rules, createValidator } from '../hooks/useForm';
import { useMutation } from '../hooks/useMutation';
import { Button, Card, FormField, ErrorAlert } from '../components/ui';

const validate = createValidator({
  username: [rules.required('Username')],
  password: [rules.required('Password')],
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? '/';

  const signIn = useMutation(login, {
    onSuccess: () => navigate(redirectTo, { replace: true }),
  });

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate,
    onSubmit: signIn.mutate,
  });

  return (
    <Card className="p-8">
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Use your library account to continue.</p>

      <form onSubmit={form.handleSubmit} className="mt-6 space-y-4">
        <ErrorAlert error={signIn.error} />

        <FormField form={form} name="username" label="Username" autoComplete="username" required />
        <FormField
          form={form}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />

        <Button type="submit" size="lg" className="w-full" isLoading={signIn.isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}
