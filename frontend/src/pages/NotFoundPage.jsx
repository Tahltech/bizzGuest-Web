import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone px-6 text-center">
      <h1 className="text-3xl">Oops! We couldn't find that page.</h1>
      <Link to="/" className="btn-primary mt-2">Back to BizzGuest</Link>
    </div>
  );
}
