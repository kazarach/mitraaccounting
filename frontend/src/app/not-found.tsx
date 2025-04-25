"use client";
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import { useRouter } from "next/navigation";


export default function NotFound() {
    const router = useRouter()
    return (
        <div className='flex flex-col justify-center items-center min-h-screen'>
            <img
                src="https://i.ibb.co.com/twnGw48n/Whats-App-Image-2025-04-14-at-16-24-14-87747106.jpg"
                alt="Image"
                className="w-50 h-50  object-cover dark:brightness-[0.2] dark:grayscale"
            />
            <p className='font-bold text-lg'>404 Not Found</p>
            <Button
                onClick={() => router.push("/")}
                className=" border border-white-500 bg-blue-500 text-white cursor-pointer w-64">
                Home
            </Button>
        </div>
    )
}