"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ShoppingCart, Truck, Package, PackageOpen } from "lucide-react";
import Link from "next/link";

const StoreManagementHubPage = () => {
    const features = [
        {
            href: "/store-management/stores",
            title: "إدارة المتاجر",
            description: "إضافة وتعديل المتاجر، وتحديد حالتها وبياناتها الأساسية.",
            icon: <ShoppingCart className="w-8 h-8 text-primary" />,
            active: true
        },
        {
            href: "/store-management/product-settings",
            title: "إدارة منتجات المتاجر",
            description: "إدارة أنواع المنتجات وقوالبها المخصصة.",
            icon: <Package className="w-8 h-8 text-primary" />,
            active: true
        },
        {
            href: "/store-management/orders",
            title: "إدارة طلبات المتاجر",
            description: "متابعة الطلبات الواردة لكل متجر بشكل مستقل.",
            icon: <Truck className="w-8 h-8 text-primary" />,
            active: true
        },
        {
            href: "/store-management/products",
            title: "عرض المنتجات",
            description: "عرض جميع المنتجات المضافة للمتاجر بالصور والأسعار.",
            icon: <PackageOpen className="w-8 h-8 text-primary" />,
            active: true
        },
    ];

    return (
        <div className="space-y-4">
            <div className="text-start">
                <h1 className="text-3xl font-bold">إدارة المتاجر الالكترونية</h1>
                <p className="text-muted-foreground">
                    إدارة المتاجر، الطلبات، والمنتجات من هنا.
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-6">
                {features.map((feature, index) => (
                    <Card 
                        key={index} 
                        className={`transition-all hover:shadow-lg ${!feature.active ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}`}
                    >
                        <Link href={feature.active ? feature.href : "#"} className={`block h-full ${!feature.active ? 'pointer-events-none' : ''}`}>
                            <>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xl font-semibold">
                                        {feature.title}
                                    </CardTitle>
                                    {feature.icon}
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StoreManagementHubPage; 