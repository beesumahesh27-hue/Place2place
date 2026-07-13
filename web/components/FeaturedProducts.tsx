"use client";
import ProductCard from "@/components/ProductCard";
import { CartProduct } from "@/context/CartContext";

export default function FeaturedProducts({ products }: { products: CartProduct[] }) {
  if (products.length === 0) {
    return <p className="col-span-3 text-center text-gray-400 py-12">No products yet — check back soon!</p>;
  }
  return (
    <>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </>
  );
}
