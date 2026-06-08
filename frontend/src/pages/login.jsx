import AuthSlider from "../components/auth/AuthSlider";
import AuthForm from "../components/auth/AuthForm";
import ThreeCanvas from "../components/auth/ThreeCanvas";
import { motion } from "framer-motion";

function Login() {
  return (
    <div className="
      w-full
      min-h-screen
      flex
      bg-[#030014]
      overflow-hidden
    ">

      {/* LEFT SIDE */}
      <div className="
        hidden
        lg:flex
        w-[60%]
        relative
      ">
        <AuthSlider />
      </div>

      {/* RIGHT SIDE */}
      <div className="
        w-full
        lg:w-[40%]
        flex
        items-center
        justify-center
        p-6
        relative
        border-l
        border-purple-500/10
        bg-[#02000d]
      ">
        
        {/* 3D Interactive Canvas Background */}
        <ThreeCanvas />

        {/* Subtle dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(168,85,247,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 90, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none" 
        />

        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none" 
        />
        
        <motion.div 
          animate={{ 
            y: [0, -40, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] max-w-lg max-h-lg bg-cyan-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" 
        />

        {/* The Form */}
        <div className="relative z-10 w-full flex justify-center">
          <AuthForm />
        </div>

      </div>

    </div>
  );
}

export default Login;