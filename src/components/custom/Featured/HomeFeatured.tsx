import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import "./index.css";
import VideoBackground from '../videobg/VideoBackground.tsx';

const HomeFeatured = () => {
  const modelRef = useRef<HTMLElement | null>(null)
  const defaultOrbit = useRef<string>("")
  const interactionTimeout = useRef<any>(null)
  const [modelLoaded, setModelLoaded] = useState(false)


  useEffect(() => {
    const model = modelRef.current as any
    if (!model) return

    // 🔹 Store base camera position
    if (!defaultOrbit.current) {
      defaultOrbit.current = model.cameraOrbit || "0deg 75deg 105%"
    }

    // 🔹 Faster auto-rotation definition
    // Note: model-viewer uses 'rotationPerSecond' string attribute/property.
    model.rotationPerSecond = "60deg/s"

    // 🔹 Start auto-rotate
    model.autoRotate = true


    const onLoad = () => {
      setModelLoaded(true) // ✅ model is ready, allow animation
    }

    model.addEventListener("load", onLoad)


    // 🔹 When user rotates the model
    const onCameraChange = (event: any) => {
      // Only react to USER interaction, ignore auto-rotate changes
      if (event.detail.source === 'user-interaction') {
        model.autoRotate = false

        if (interactionTimeout.current) {
          clearTimeout(interactionTimeout.current)
        }

        interactionTimeout.current = setTimeout(() => {
          model.cameraOrbit = defaultOrbit.current
          model.autoRotate = true
        }, 200)
      }
    }

    model.addEventListener("camera-change", onCameraChange)

    return () => {
      clearTimeout(interactionTimeout.current)
      model.removeEventListener("camera-change", onCameraChange)
      model.removeEventListener("load", onLoad)
    }
  }, [])


  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-10 antialiased md:pt-0 md:pb-0 overflow-hidden">
      <VideoBackground />
      <div className="relative w-full h-full px-8 md:px-24 grid md:grid-cols-12 items-center gap-0">
        <div className="flex flex-col justify-center items-start md:col-span-6 z-10">
          <h1 className="mb-4 text-4xl font-bold leading-none tracking-tight font-sans  md:max-w-2xl md:text-6xl xl:text-8xl">
            Best In Style
            <br />
            Collection <br />
            For You
          </h1>
          <hr className="bg-cs_green  h-[3px] mx-auto my-4  rounded  " />
          <p className="mb-4 max-w-2xl text-gray-500  md:mb-12 md:text-lg  lg:mb-5 lg:text-xl">
            We craft the, we wont say the best,
            <br />
            But through 15 years of experience in the industry
          </p>
          <a
            href="#product_list"
            className="inline-block rounded-lg bg-gray-900 px-6 py-3.5 text-center font-medium text-white hover:bg-black focus:outline-none focus:ring-4 focus:ring-zink-800 -600  "
          >
            Shop Now!
          </a>
        </div>
        {/* <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={modelLoaded ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="md:col-span-5 md:mt-0 md:flex relative justify-center items-center z-10"
        >

          <div className="relative w-full flex items-center justify-center group ">

            {/* Background Image */}
        {/* <img
              src={Images.bg}
              className="absolute inset-0 w-full h-full object-contain scale-110 transition-transform duration-700 group-hover:scale-110"
              alt="Background"
            />

            {/* Shoe Image */}
        {/* <img
              src={Images.shoe}
              className="relative z-10 w-[73%] object-cover translate-x-[-3%] translate-y-[-4%] scale-125 
             drop-shadow-[0_40px_60px_rgba(0,0,0,0.35)]
             transition-transform duration-500 ease-in-out
             group-hover:scale-150 group-hover:-rotate-6"
              alt="Shoe"
            /> 
            <model-viewer
              ref={modelRef}
              src="/src/assets/nike/source/model.glb"
              auto-rotate
              camera-controls
              disable-zoom
              disable-pan
              shadow-intensity="1"
              shadow-softness="1"
              exposure="1"
              scale="1.6 1.6 1.6"
              rotation-per-second="30deg/s"
              class="w-full h-[600px] md:h-[700px]"
            />
          </div>
        </motion.div> */}

      </div>
    </section>
  );
};

export default HomeFeatured;
