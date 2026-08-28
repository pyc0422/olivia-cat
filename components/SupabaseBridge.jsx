"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { loadStoredCurrentUser, saveStoredCurrentUser } from "../lib/current-user-storage";

export default function SupabaseBridge() {
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    const userPromise = client.auth.getUser().catch(() => ({ data: { user: null } }));

    window.catclubSupabase = client;
    window.catclubDb = {
      currentUserId: loadStoredCurrentUser()?.id || null,
      currentUserName: loadStoredCurrentUser()?.name || null,
      async getSession() {
        const { data } = await client.auth.getSession();
        return data.session || null;
      },
      async getUser() {
        const { data, error } = await client.auth.getUser();
        if (error) {
          throw error;
        }
        window.catclubDb.currentUserId = data.user?.id || null;
        window.catclubDb.currentUserName = data.user?.user_metadata?.name || data.user?.email || null;
        if (data.user) {
          saveStoredCurrentUser(data.user);
        }
        return data.user || null;
      },
      async ensureProfile(profile) {
        const { data: userData, error: userError } = await client.auth.getUser();
        if (userError) {
          throw userError;
        }

        const user = userData.user;
        if (!user) {
          throw new Error("No signed-in user.");
        }

        const nextProfile = {
          id: user.id,
          name: profile.name,
          email: profile.email || user.email || "",
          phone: profile.phone || null,
          member_group: profile.member_group,
          board_visible: profile.board_visible ?? true,
          level: profile.level || "Noob",
          kitty_bucks: Number.isFinite(profile.kitty_bucks) ? profile.kitty_bucks : Number(profile.kitty_bucks || 0),
          avatar_unlocks: profile.avatar_unlocks || {},
          avatar_color: profile.avatar_color || "orange",
          avatar_eyes: profile.avatar_eyes || "round",
          avatar_mouth: profile.avatar_mouth || "smile",
          avatar_clothes: profile.avatar_clothes || "hoodie",
          avatar_accessory: profile.avatar_accessory || "none",
          last_login_at: new Date().toISOString(),
        };

        const { error } = await client
          .from("profiles")
          .upsert(nextProfile, { onConflict: "id" });

        if (error) {
          throw error;
        }

        return nextProfile;
      },
      async loadProfiles() {
        const { data, error } = await client
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        return data || [];
      },
      async updateProfile(id, patch) {
        const { data, error } = await client
          .from("profiles")
          .update(patch)
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        return data;
      },
      async loadMessages() {
        const { data, error } = await client
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) {
          throw error;
        }

        return data || [];
      },
      async addMessage(message) {
        const { data, error } = await client
          .from("messages")
          .insert(message)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        return data;
      },
      async deleteMessage(id) {
        const { error } = await client.from("messages").delete().eq("id", id);
        if (error) {
          throw error;
        }
      },
      async loadDrawings() {
        const { data, error } = await client
          .from("drawings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(60);

        if (error) {
          throw error;
        }

        return data || [];
      },
      async addDrawing(drawing) {
        const { data, error } = await client
          .from("drawings")
          .insert(drawing)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        return data;
      },
      async deleteDrawing(id) {
        const { error } = await client.from("drawings").delete().eq("id", id);
        if (error) {
          throw error;
        }
      },
      async loadVideos() {
        const { data, error } = await client
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40);

        if (error) {
          throw error;
        }

        return data || [];
      },
      async addVideo(video) {
        const { data, error } = await client
          .from("videos")
          .insert(video)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        return data;
      },
      async deleteVideo(id) {
        const { error } = await client.from("videos").delete().eq("id", id);
        if (error) {
          throw error;
        }
      },
    };
    void userPromise.then(({ data }) => {
      window.catclubDb.currentUserId = data.user?.id || null;
      window.catclubDb.currentUserName = data.user?.user_metadata?.name || data.user?.email || null;
      if (data.user) {
        saveStoredCurrentUser(data.user);
      }
    });
    window.dispatchEvent(new Event("catclub-supabase-ready"));
  }, []);

  return null;
}
