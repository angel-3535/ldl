import { Outlet, createRootRoute } from "@tanstack/react-router";

function AppLayout() {
  return (
    <div className="app-shell">
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createRootRoute({
  component: AppLayout,
});
