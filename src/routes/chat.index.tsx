import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { newId } from "@/lib/chats";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "Gr3at AI — Your personal assistant" },
      { name: "description", content: "Chat with Gr3at AI for movie picks, help using the site, or anything else." },
      { property: "og:title", content: "Gr3at AI — Your personal assistant" },
      { property: "og:description", content: "Chat with Gr3at AI for movie picks, help using the site, or anything else." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewChat,
});

function NewChat() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/chat/$threadId", params: { threadId: newId() }, replace: true });
  }, [navigate]);
  return null;
}
