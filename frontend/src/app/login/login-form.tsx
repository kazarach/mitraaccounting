"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useSWRMutation from "swr/mutation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { SelectItemText } from "@radix-ui/react-select";
import { useRouter } from "next/navigation";

const schema = yup.object().shape({
    username: yup.string().required("Username wajib diisi"),
    password: yup.string().required("Password wajib diisi"),
});

type FormData = yup.InferType<typeof schema>;

async function loginRequest(
    url: string,
    { arg }: { arg: FormData }
) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.detail || "Login gagal");
    }

    return res.json();
}

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter()
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    });

    const { trigger, isMutating } = useSWRMutation(
        "http://100.82.207.117:8000/api/token/",
        loginRequest
    );

    const onSubmit = async (data: FormData) => {
        setErrorMessage("");
        try {
            const response = await trigger(data);
            console.log("Sukses login:", response);
            if (response.access && response.refresh) {
                localStorage.setItem("access", response.access);
                localStorage.setItem("refresh", response.refresh);
            }
            router.push("/");
        } catch (err: any) {
            setErrorMessage(err.message);
        }
    };


    return (
        <div className={cn("flex flex-col gap-4", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" type="text" {...register("username")} />
                                <p className={`text-xs min-h-[16px] ${errors.username ? "text-red-500" : "invisible"}`}>
                                    {errors.username?.message || "placeholder"}
                                </p>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" {...register("password")} />
                                <p className={`text-xs min-h-[16px] ${errors.password ? "text-red-500" : "invisible"}`}>
                                    {errors.password?.message || "placeholder"}
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isMutating}>
                                {isMutating ? "Logging in..." : "Login"}
                            </Button>
                            {errorMessage && <p className="text-xs text-red-500 text-center">{errorMessage}</p>}
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/menu"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </div>
        </div>
    );
}
