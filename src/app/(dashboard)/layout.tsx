import SidebarWrapper from '@/components/ui/SidebarWrapper'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SidebarWrapper>{children}</SidebarWrapper>
}
