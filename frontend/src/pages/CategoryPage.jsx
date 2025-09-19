import React, { useState } from "react";
import { Layout, Typography, Divider } from "antd";
import { useParams, useLoaderData } from "react-router-dom";
import { getItemsByCategory, getRecentItemsByCategory } from "@/API/duc.api/item.api";
import { getAllCategoriesWithStats } from "@/API/duc.api/category.api";
import ProductList from "@/components/item/item-list";
import { CategorySection } from "@/components/item/category-card";
import Footer from "@/components/global/Footer";
import Banner from "@/components/item/banner";
import CategoryBanner from "@/components/item/category-banner";

const { Title } = Typography;
const { Content } = Layout;

export const categoryPageLoader = async ({ params }) => {
    try {
        const [itemsRes, categoriesRes, recentItemsRes] = await Promise.all([
            getItemsByCategory(params.categoryId),
            getAllCategoriesWithStats(),
            getRecentItemsByCategory(params.categoryId)
        ]);
        return {
            items: itemsRes.data,
            category: itemsRes.category,
            categories: categoriesRes.data,
            recentItems: recentItemsRes.data,
        };
    } catch (err) {
        console.error("Error loading category page:", err);
        return { items: [], categories: [] };
    }
};

const CategoryPage = () => {
    const { items, category, categories, recentItems } = useLoaderData();
    const { categoryId } = useParams();
    const [products] = useState(items);
    const [recent] = useState(recentItems);
    console.log(recentItems)
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    console.log(category)
    return (
        <Layout style={{ backgroundColor: "#fff" }}>
            <CategoryBanner
                title={category.name}
                description={category.description}
                image={category.image}
                tags={category.tags}
            />

            <Content style={{ padding: "40px 20px" }}>
                <ProductList title="Recent Products" products={recent} />
                
                 <Divider />

                <ProductList title="All Products" products={products} />

                <Divider />

                <Title level={3}>Explore Other Categories</Title>
                <CategorySection
                    categories={categories.filter(cat => cat._id !== categoryId)}
                />
            </Content>  
        </Layout>
    );
};

export default CategoryPage;
