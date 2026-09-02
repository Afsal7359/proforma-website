import { logoutAction } from "@/app/actions/auth";

export function LogoutButton({
  className = "logout-btn",
  children = "Log out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
