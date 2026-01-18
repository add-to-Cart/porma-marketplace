import { signInWithGoogle } from "../features/auth/firebaseAuth";
import { FcGoogle } from "react-icons/fc";

export default function GoogleButton() {
  const handleClick = async () => {
    try {
      const user = await signInWithGoogle();
      alert(`Welcome ${user.displayName}!`);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center border rounded px-4 py-2 mt-4 gap-2 hover:bg-gray-100 transition"
    >
      <FcGoogle size={20} />
      <span>Continue with Google</span>
    </button>
  );
}
