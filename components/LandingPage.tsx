import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Scene3D } from './3d/Scene3D';
import { FloatingCube } from './3d/FloatingCube';
import { FloatingSphere } from './3d/FloatingSphere';
import { WireframeGlobe } from './3d/WireframeGlobe';
import { Sparkles, Zap, Globe, BookOpen } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const featuresOpacity = useTransform(scrollYProgress, [0.15, 0.3, 0.5], [0, 1, 0]);
  const featuresY = useTransform(scrollYProgress, [0.15, 0.3], [100, 0]);

  const aboutOpacity = useTransform(scrollYProgress, [0.45, 0.6, 0.95], [0, 1, 1]);
  const aboutY = useTransform(scrollYProgress, [0.45, 0.6], [100, 0]);

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Minimal top bar - Enter App */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-white" />
          <span className="text-white font-semibold">Lifewood Flipbook</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/library')}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition-colors"
        >
          Enter App
        </motion.button>
      </div>

      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-shift pointer-events-none" />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0"
        >
          <Scene3D>
            <FloatingCube />
          </Scene3D>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-6"
        >
          <h1 className="text-7xl md:text-8xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            Welcome to the Future
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8">
            of Digital Experience
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/library')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full text-lg font-semibold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-shadow"
          >
            Explore Now
          </motion.button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative min-h-screen flex items-center justify-center py-20">
        <motion.div
          style={{ opacity: featuresOpacity }}
          className="absolute inset-0"
        >
          <Scene3D>
            <FloatingSphere />
          </Scene3D>
        </motion.div>

        <motion.div
          style={{ opacity: featuresOpacity, y: featuresY }}
          className="relative z-10 max-w-6xl mx-auto px-6"
        >
          <h2 className="text-6xl font-bold text-white text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-12 h-12" />,
                title: 'Stunning Visuals',
                description: 'Experience breathtaking 3D graphics that bring your content to life',
              },
              {
                icon: <Zap className="w-12 h-12" />,
                title: 'Lightning Fast',
                description: 'Optimized performance ensures smooth animations and interactions',
              },
              {
                icon: <Globe className="w-12 h-12" />,
                title: 'Global Reach',
                description: 'Connect with audiences worldwide through immersive experiences',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-cyan-400 mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* About/Technology Section */}
      <section className="relative min-h-screen flex items-center justify-center py-20">
        <motion.div
          style={{ opacity: aboutOpacity }}
          className="absolute inset-0"
        >
          <Scene3D>
            <WireframeGlobe />
          </Scene3D>
        </motion.div>

        <motion.div
          style={{ opacity: aboutOpacity, y: aboutY }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          <h2 className="text-6xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Built with Cutting-Edge Technology
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Powered by React, Three.js, and modern web technologies to deliver
            unparalleled performance and visual fidelity. Every interaction is
            crafted to perfection.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['React', 'Three.js', 'WebGL', 'Framer Motion', 'TypeScript'].map((tech) => (
              <motion.span
                key={tech}
                whileHover={{ scale: 1.1 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold"
              >
                {tech}
              </motion.span>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/library')}
            className="px-10 py-5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-full text-xl font-bold shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-shadow"
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </section>

      {/* Footer Spacer */}
      <div className="h-screen" />

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
