import { Settings, LogOut } from "lucide-react";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ProfileSettings } from "./profile-settings";
import { buildNotifications, type NotificationAssignment, type NotificationEquipment } from "@/lib/notifications";
import { createClient } from "@/utils/supabase/server";

export async function Topbar() {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const [{ data: equipmentData, error: equipmentError }, { data: historyData, error: historyError }] = await Promise.all([
    supabase.from("equipment").select("id,status,condition_state,year_acquired,assigned_to,assignee_id,equipment_categories(name)"),
    supabase.from("assignment_history").select("id,assigned_at,note,personnel(full_name)").order("assigned_at", { ascending: false }).limit(5),
  ]);
  const notificationUnavailable = Boolean(equipmentError || historyError);
  const notifications = notificationUnavailable
    ? []
    : buildNotifications((equipmentData || []) as unknown as NotificationEquipment[], (historyData || []) as unknown as NotificationAssignment[]);

  return (
    <header className="h-16 border-b border-line bg-canvas flex items-center px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <span className="hidden md:inline-block text-xl text-slate tracking-wide">
          <span className="text-pulse font-medium">P</span>ersonnel & <span className="text-pulse font-medium">U</span>nit <span className="text-pulse font-medium">L</span>ifecycle <span className="text-pulse font-medium">S</span>ystem for <span className="text-pulse font-medium">E</span>quipment
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3 pl-4 border-l border-line">
        <ThemeToggle />
        <NotificationBell notifications={notifications} unavailable={notificationUnavailable} userKey={profile?.id || profile?.email || "current-user"} />
        <div className="flex flex-col items-end hidden sm:flex pl-3 border-l border-line">
          <span className="text-sm font-medium text-paper">
            {profile?.full_name || profile?.email || "PULSE user"}
          </span>
          <span className="text-xs text-pulse font-mono bg-pulse/10 px-1.5 py-0.5 rounded mt-0.5">
            {profile?.role || "Viewer"}
          </span>
        </div>
        
        <div className="w-9 h-9 overflow-hidden rounded-full border border-line bg-canvas-deep">
          <Image
            src="/pulseicon.svg"
            alt="PULSE account"
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-line ml-1">
          <ProfileSettings>
            <button className="text-slate hover:text-pulse transition-colors flex items-center justify-center" title="Profile Settings">
              <Settings className="w-4 h-4" />
            </button>
          </ProfileSettings>
          <form action="/auth/logout" method="POST" className="flex items-center justify-center">
            <button className="text-slate hover:text-alert transition-colors flex items-center justify-center" type="submit" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
