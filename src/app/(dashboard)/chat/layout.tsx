import { ComposeWorkspace } from "@/components/workspace/ComposeWorkspace";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ComposeWorkspace>{children}</ComposeWorkspace>;
}
