import * as z from "zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import Images from "@/assets";

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
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, doc, provider, setDoc } from "@/Database/firebase";
import ReactLoading from "react-loading";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { getDoc } from "firebase/firestore";

// Validation schema

const LoginValidation = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginValidation>>({
    resolver: zodResolver(LoginValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = (user: z.infer<typeof LoginValidation>) => {
    setLoading(true);
    console.log("User Data:", user);

    // Check for Admin Credentials
    if (user.email === "raxitsanghani21@gmail.com" && user.password === "raxit2112") {
      localStorage.setItem("authToken", "admin-token"); // Set token for Admin Protected Route
      toast({ description: "Admin Login Success!" });
      setLoading(false);
      window.location.href = "/admin"; // Force reload/redirect to Admin Panel
      return;
    }

    // Normal User Login
    signInWithEmailAndPassword(auth, user.email, user.password)
      .then(() => {
        toast({ description: "Login Success!" });
        form.reset();
        setLoading(false);
        navigate("/");
      })
      .catch((error) => {
        console.log(error);

        const errorMessage = error.message;
        toast({ variant: "destructive", title: errorMessage });
        setLoading(false);
      });
  };

  async function createDoc(user: any) {
    //Create doc
    if (!user) return;
    setLoading(true);

    const userRef = doc(db, "users", user.uid);
    const userData = await getDoc(userRef);
    if (!userData.exists()) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName ? user.displayName : name,
          email: user.email,
          photoUrl: user.photoUrl ? user.photoUrl : "",
          createdAt: new Date(),
        });

        setLoading(false);
      } catch (error: any) {
        setLoading(false);

        toast({ variant: "destructive", title: error });
      }
    } else {
      setLoading(false);
    }
  }

  function googleAuth() {
    setLoading(true);
    try {
      signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.

          // The signed-in user info.
          const user = result.user;
          // IdP data available using getAdditionalUserInfo(result)
          // ...\
          createDoc(user);
          toast({ description: "Login Success!" });

          console.log("User>>>>", user);
          navigate("/");
          setLoading(false);
        })
        .catch((error) => {
          // Handle Errors here.

          const errorMessage = error.message;
          toast({ variant: "destructive", title: errorMessage });
          setLoading(false);
        });
    } catch (error: any) {
      setLoading(false);
      toast({ variant: "destructive", title: error.message });
    }
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
            Log in to your account
          </h2>

          <form
            onSubmit={form.handleSubmit(handleLogin)}
            className="flex flex-col gap-2 w-full mt-4"
          >
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
                    <Input type="password" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={loading}
              type="submit"
              className="shad-button_primary mt-4"
            >
              {loading ? (
                <ReactLoading
                  type={"bars"}
                  height={30}
                  width={30}
                  color="black"
                />
              ) : (
                "Login"
              )}
            </Button>
            <h1 className="text-center">or</h1>
            <Button
              disabled={loading}
              type="button"
              onClick={googleAuth}
              className="shad-button_primary mt-3 "
            >
              <FcGoogle size={"1.5rem"} className="mr-1" /> Sign Up With Google
            </Button>

            <p className="text-small-regular text-light-2 text-center mt-2">
              Don't have an account?
              <Link
                to="/signup"
                className="text-cs_yellow  text-small-semibold ml-1"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </Form>
  );
};

export default Login;
