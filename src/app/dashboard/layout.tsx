import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className={styles.root}>
      <Topbar user={session} />
      <div className={styles.shell}>
        <Sidebar role={session.role} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
