    "use client";
    import { SidebarTrigger } from "@/components/ui/sidebar";
    import Link from "next/link";
    import { usePathname } from "next/navigation";

    export function Header() {
    const pathname = usePathname();

    const breadcrumb = pathname
        .split("/")
        .filter((path) => path)
        .map((path, index, array) => ({
        name: path.charAt(0).toUpperCase() + path.slice(1),
        href: "/" + array.slice(0, index + 1).join("/"),
        }));

    return (
        <header className="flex items-center gap-4 px-4 py-2 bg-white text-slate-900 font-medium shadow-sm">
            <div className="border-r border-slate-300 ">
        <SidebarTrigger  className=" mr-3"/>
            </div>

        <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="">
            Home
            </Link>
            {breadcrumb.map((item) => (
            <div key={item.href} className="flex items-center space-x-2">
                <span className="mr-2">/</span>
                 
                {item.name}
            </div>
            ))}
        </nav>
        </header>
    );
    }
