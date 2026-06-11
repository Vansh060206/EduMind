import { motion } from "framer-motion";

export default function RocketLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030014] overflow-hidden relative">
      {/* Dynamic Starfield Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
            }}
            animate={{
              y: ["0%", "100vh"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        animate={{ 
          y: [-10, 10, -10],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.img 
          src="/rocket-loader.png" 
          alt="Loading..." 
          className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Exhaust Flame Effect */}
        <motion.div 
          className="w-8 h-16 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent blur-md rounded-full mt-[-10px] -z-10"
          animate={{ 
            scaleY: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ 
            duration: 0.1, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />

        <motion.p
          className="mt-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-bold tracking-widest uppercase text-sm md:text-base"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Preparing Workspace...
        </motion.p>
      </motion.div>
    </div>
  );
}
