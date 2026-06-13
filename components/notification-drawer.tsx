"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { queuedMarkNotificationReadAction as markNotificationReadAction } from "@/lib/client/wrapped-actions";
import type { NotificationRow } from "@/lib/server/repositories/notification-repository";

export function NotificationDrawer({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(markNotificationReadAction, {});

  return (
    <div className="relative">
      <button
        className="relative grid h-11 w-11 place-items-center rounded-full bg-lime text-forest"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Bell className="h-5 w-5" strokeWidth={2.25} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-orange px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-4 right-4 top-20 z-50 max-h-[70vh] rounded-[20px] bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.2)] sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-80"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-sans font-semibold text-forest">Notifikasi</span>
              <button
                className="grid h-8 w-8 place-items-center rounded-full text-forest/60 hover:bg-forest/5"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.message && (
              <p className="mb-2 rounded-[10px] bg-orange/10 p-2 text-xs font-semibold text-orange">
                {state.message}
              </p>
            )}

            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-forest/60">Tidak ada notifikasi.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto overscroll-contain">
                {notifications.map((notification) => (
                  <form
                    key={notification.id}
                    action={action}
                    className={`rounded-[14px] p-3 transition ${notification.is_read ? "bg-forest/5" : "bg-lime/30"}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <Link
                      className="block touch-manipulation"
                      href={notification.resource_id ? `/supervisor/audit/${notification.resource_id}` : "/supervisor/audit"}
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-sm font-semibold text-forest">{notification.title}</div>
                      <div className="text-xs text-forest/70">{notification.message}</div>
                    </Link>
                    {!notification.is_read && (
                      <button
                        className="mt-2 text-xs font-semibold text-forest underline underline-offset-4 hover:text-forest/80"
                        type="submit"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </form>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
