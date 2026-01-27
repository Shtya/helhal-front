import { useAuth } from "@/context/AuthContext";
import Chatbot from "./Chatbot";
import { useMemo } from "react";

export default function ChatbotWrapper() {
  const { user } = useAuth();

  const personalData = useMemo(() => ({
    name: user?.username,
    role: user?.role,
    type: user?.type,
    sellerLevel: user?.sellerLevel,
    skills: user?.skills,
    ordersCompleted: user?.ordersCompleted,
    memberSince: user?.memberSince,
    description: user?.description,
    countryName: user?.country?.name
  }), [

    user?.username,
    user?.role,
    user?.type,
    user?.sellerLevel,
    user?.skills,
    user?.ordersCompleted,
    user?.memberSince,
    user?.description,
    user?.country?.name
  ]);

  return (
    <>
      {/* Your content */}
      <Chatbot personalData={personalData} />
    </>
  );
}