import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { db, doc, setDoc, auth, provider } from "@/Database/firebase";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import Images from "@/assets";
import ReactLoading from "react-loading";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getDoc } from "firebase/firestore";

const SignupValidation = z
  .object({
    name: z.string().min(1, { message: "Full name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" }),
    confirmPassword: z.string().min(6, {
      message: "Confirm password must be at least 6 characters long",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const Signup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignup = async (user: z.infer<typeof SignupValidation>) => {
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: user.name });
      await createDoc(newUser, user.name);

      toast({ description: "User created!" });
      form.reset();
      navigate("/");
    } catch (error) {
      console.error("Signup Error:", error);
      const errorMessage =
        (error as Error).message || "An unknown error occurred";
      toast({ variant: "destructive", title: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  async function createDoc(user: any, name?: string) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    try {
      const userData = await getDoc(userRef);
      if (!userData.exists()) {
        await setDoc(userRef, {
          name: name || user.displayName || "",
          email: user.email,
          photoUrl: user.photoURL || "",
          createdAt: new Date(),
          isBlocked: false,
        });
      }
    } catch (error) {
      console.error("Create Doc Error", error);
      // Error propagation logic if needed, currently just logging
    }
  }

  function googleAuth() {
    setLoading(true);
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        await createDoc(user);
        toast({ description: "Login Success!" });
        navigate("/");
      })
      .catch((error) => {
        console.log("Google Auth Error:", error);
        let errorMessage = (error as Error).message || "An unknown error occurred";

        // Handle specific Firebase errors more gracefully
        if (errorMessage.includes("auth/unauthorized-domain")) {
          errorMessage = "Domain not authorized. Add 'nexura-sports.vercel.app' to Firebase Console > Authentication > Settings.";
        } else if (errorMessage.includes("auth/popup-closed-by-user")) {
          errorMessage = "Sign-in popup was closed before completion.";
        } else if (errorMessage.includes("auth/popup-blocked")) {
          errorMessage = "Sign-in popup was blocked by the browser. Please allow popups for this site.";
        }

        toast({ variant: "destructive", title: errorMessage });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Form {...form}>
      <div className="flex flex-1 h-screen justify-center items-center flex-col py-10">
        <div className="sm:w-420 md:w-[24rem] flex-center flex-col">
          <div className="flex items-center gap-3 justify-center">
            <img src={Images.LOGO} alt="logo" className="w-12" />
            <h2 className="text-2xl ">Welcome to Nexura</h2>
          </div>

          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-6">
            Create a new account
          </h2>

          <form
            onSubmit={form.handleSubmit(handleSignup)}
            className="flex flex-col gap-2 w-full mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Full Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Email</FormLabel>
                  <FormControl>
                    <Input type="email" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="shad-input pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FaEyeSlash size={20} />
                        ) : (
                          <FaEye size={20} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        className="shad-input pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash size={20} />
                        ) : (
                          <FaEye size={20} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={loading}
              type="submit"
              className="shad-button_primary mt-3"
            >
              {loading ? (
                <ReactLoading
                  type={"bars"}
                  height={30}
                  width={30}
                  color="black"
                />
              ) : (
                "Sign up"
              )}
            </Button>
            <h1 className="text-center">or</h1>
            <Button
              disabled={loading}
              onClick={googleAuth}
              type="button"
              className="shad-button_primary mt-3"
            >
              <FcGoogle size={"1.5rem"} className="mr-1" /> Sign Up With Google
            </Button>
            <p className="text-small-regular text-light-2 text-center mt-2">
              Already have an account?
              <Link
                to="/login"
                className="text-cs_yellow text-small-semibold ml-1"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </Form>
  );
};

export default Signup;
