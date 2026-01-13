import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "@/api/products"; //

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id); //
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading)
    return <div className="p-10 text-center">Loading product...</div>;
  if (!product)
    return <div className="p-10 text-center">Product not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-600 hover:underline flex items-center gap-2"
      >
        ← Back to Marketplace
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-8 rounded-3xl shadow-sm border">
        {/* Product Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">
            {product.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <p className="text-2xl font-black text-gray-900 mb-6">
            ₱{product.price?.toLocaleString()}
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase">
                Compatibility
              </h3>
              <p className="text-gray-700">
                {product.vehicleCompatibility?.isUniversalFit
                  ? "Universal Fit"
                  : `${product.vehicleCompatibility?.makes?.join(
                      ", "
                    )} ${product.vehicleCompatibility?.models?.join(", ")}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/products/update/${id}`)}
            className="mt-auto w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            Edit Product Information
          </button>
        </div>
      </div>
    </div>
  );
}
