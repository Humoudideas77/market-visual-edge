
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-800 group-[.toaster]:text-white group-[.toaster]:border-gray-600 group-[.toaster]:shadow-2xl",
          description: "group-[.toast]:text-gray-300",
          actionButton:
            "group-[.toast]:bg-red-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
          success: "group-[.toast]:bg-green-900 group-[.toast]:border-green-600 group-[.toast]:text-green-100",
          error: "group-[.toast]:bg-red-900 group-[.toast]:border-red-600 group-[.toast]:text-red-100",
          warning: "group-[.toast]:bg-yellow-900 group-[.toast]:border-yellow-600 group-[.toast]:text-yellow-100",
          info: "group-[.toast]:bg-blue-900 group-[.toast]:border-blue-600 group-[.toast]:text-blue-100"
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
