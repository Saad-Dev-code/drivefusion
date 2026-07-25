export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.06)_0%,transparent_70%)] top-[-200px] right-[-100px]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.04)_0%,transparent_70%)] bottom-[-100px] left-[-100px]" />
      <div className="relative z-10 w-full max-w-[440px] px-4">
        {children}
      </div>
    </div>
  )
}
