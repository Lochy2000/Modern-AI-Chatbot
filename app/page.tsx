import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import AIAssistantUI from "../components/AIAssistantUI"

export default async function Page() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return <AIAssistantUI />
}
