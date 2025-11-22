import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Button } from "./components/ui/button";
import { API_BASE_URL } from "./Config";

export default function LandingPage() {
  const navigate = useNavigate();
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Enable smooth scrolling for anchor links
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => (document.documentElement.style.scrollBehavior = prev);
  }, []);

  const handleGetStarted = () => navigate("/profile");
  const handleWebApp = () => navigate("/profile");

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact((s) => ({ ...s, [name]: value }));
  };

  const submitContact = async (e) => {
    e.preventDefault();

    if (!contact.name || !contact.email || !contact.message) {
      toast.error("Please fill all fields");
      return;
    }

    setSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/contact-us`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contact),
      });

      if (!res.ok) throw new Error();

      toast.success("Message sent — we’ll hit you back soon ✨");
      setContact({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message, try again later 😬");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SkillSwap
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#platform"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              About Us
            </a>
            <a
              href="#contact"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Contact
            </a>
            <button
              onClick={handleWebApp}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-yellow-300 hover:to-yellow-400"
            >
              Web App
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={handleWebApp}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-semibold rounded-full text-sm"
            >
              Web App
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-6 py-4 space-y-4">
              <a
                href="#platform"
                className="block text-slate-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Platform
              </a>
              <a
                href="#features"
                className="block text-slate-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#about"
                className="block text-slate-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </a>
              <a
                href="#contact"
                className="block text-slate-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-16">
        {/* HERO SECTION */}
        <section id="platform" className="pt-20 pb-24">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Learn by{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    teaching
                  </span>
                  , teach by{" "}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    sharing
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                  SkillSwap revolutionizes peer-to-peer learning with our unique
                  credit system. Teach to earn credits, then use them to learn
                  from others. Real-time chat, video calls, and modern UI make
                  knowledge sharing seamless and rewarding.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleGetStarted} className="inline-block">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Start Learning & Teaching
                  </Button>
                </button>
              </div>

              <div className="flex flex-wrap gap-8 pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700 font-medium">
                    Dual Role Platform
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700 font-medium">
                    Credit System
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-slate-700 font-medium">
                    Real-time Video & Chat
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-slate-700 font-medium">
                    Credit Purchases Available
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-slate-200/60">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">🔄</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mt-3">
                        Earn & Learn
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Teach to earn credits for learning
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">💎</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mt-3">
                        Buy Credits
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Purchase credits if you prefer not to teach
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">🎥</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mt-3">
                        Video Calls
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        HD video sessions with experts
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">💬</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mt-3">
                        Live Chat
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Real-time messaging & file sharing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Background decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200/30 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-200/30 rounded-full blur-xl">
                {/* Kurdistan Flag */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-10 bg-white rounded shadow-lg flex flex-col overflow-hidden">
                    <div className="h-1/3 bg-red-500"></div>
                    <div className="h-1/3 bg-white flex justify-center items-center">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                    </div>
                    <div className="h-1/3 bg-green-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features"
          className="py-20 bg-gradient-to-b from-white to-slate-50/50"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                How SkillSwap Works
              </h2>
              <p className="text-xl text-slate-600">
                Our innovative platform lets you be both teacher and learner,
                with flexible options for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-slate-200/60 transition-all duration-300 hover:translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
                  Dual Role System
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Everyone can be both teacher and learner. Share your expertise
                  to earn credits, then use them to learn from others.
                </p>
              </div>

              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-slate-200/60 transition-all duration-300 hover:translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">💳</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
                  Credit Economy
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Teach to earn credits, or purchase them directly. Flexible
                  payment options for learners who prefer not to teach.
                </p>
              </div>

              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-slate-200/60 transition-all duration-300 hover:translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🎥</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
                  Real-time Sessions
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  HD video calls and live chat with screen sharing, file
                  transfer, and course structure for effective learning.
                </p>
              </div>

              <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-slate-200/60 transition-all duration-300 hover:translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
                  Modern Experience
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Beautiful, intuitive interface with seamless navigation,
                  responsive design, and smooth user experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT US SECTION */}
        <section id="about" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">
                  About SkillSwap
                </h2>
                <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
                  <p>
                    SkillSwap was born from a simple idea: everyone has
                    something valuable to teach, and everyone has something new
                    to learn. We believe in the power of peer-to-peer knowledge
                    exchange without the need for traditional verification
                    systems.
                  </p>
                  <p>
                    Our platform empowers individuals to share their expertise
                    while gaining access to a diverse community of learners and
                    teachers. Whether you're a professional looking to share
                    your skills or someone eager to learn, SkillSwap provides
                    the tools and ecosystem for meaningful educational
                    exchanges.
                  </p>
                  <p>
                    Based in Kurdistan, we're committed to building a global
                    learning community that transcends borders and traditional
                    educational barriers.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      Learn
                    </div>
                    <div className="text-slate-600">New Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      Teach
                    </div>
                    <div className="text-slate-600">Your Expertise</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      Connect
                    </div>
                    <div className="text-slate-600">With Others</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      Grow
                    </div>
                    <div className="text-slate-600">Together</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-slate-200/60">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">
                    Our Mission
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🌍</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          Democratize Learning
                        </h4>
                        <p className="text-slate-600 mt-1">
                          Make quality education accessible to everyone,
                          everywhere
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🤝</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          Build Community
                        </h4>
                        <p className="text-slate-600 mt-1">
                          Connect people through shared knowledge and mutual
                          growth
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">💡</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          Empower Individuals
                        </h4>
                        <p className="text-slate-600 mt-1">
                          Help people monetize their skills while learning new
                          ones
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Background decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200/30 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-200/30 rounded-full blur-xl">
                  {/* Kurdistan Flag */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-10 bg-white rounded shadow-lg flex flex-col overflow-hidden">
                      <div className="h-1/3 bg-red-500"></div>
                      <div className="h-1/3 bg-white flex justify-center items-center">
                        <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                      </div>
                      <div className="h-1/3 bg-green-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Contact Form */}
                <div className="p-12">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    Get in Touch
                  </h2>
                  <p className="text-slate-600 text-lg mb-8">
                    Have questions about our credit system or want to join our
                    community? We'd love to hear from you. Send us a message and
                    we'll respond within one business day.
                  </p>

                  <form onSubmit={submitContact} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Name
                      </label>
                      <input
                        name="name"
                        value={contact.name}
                        onChange={handleContactChange}
                        className="w-full p-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        name="email"
                        value={contact.email}
                        onChange={handleContactChange}
                        className="w-full p-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={contact.message}
                        onChange={handleContactChange}
                        rows={5}
                        className="w-full p-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                        placeholder="Tell us about your skills or what you'd like to learn..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-block w-full"
                    >
                      <Button
                        size="default"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        disabled={sending}
                      >
                        {sending ? "Sending Message..." : "Send Message"}
                      </Button>
                    </button>
                  </form>
                </div>

                {/* Contact Info */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-12">
                  <h3 className="text-2xl font-bold mb-8">
                    Contact Information
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📧</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Email</h4>
                        <p className="text-blue-200 mt-1">
                          muhamadsarhad999@gmail.com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📞</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Phone</h4>
                        <p className="text-green-200 mt-1">+964 770 995 2717</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🏢</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Location</h4>
                        <p className="text-purple-200 mt-1 leading-relaxed">
                          Based in Kurdistan
                          <br />
                          Serving learners worldwide
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-700">
                    <h4 className="font-semibold text-lg mb-4">
                      Join Our Community
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      Whether you want to teach, learn, or both, SkillSwap
                      provides the perfect platform for knowledge exchange.
                      Start building your educational network today.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
                <span className="text-xl font-bold text-white">SkillSwap</span>
              </div>
              <p className="text-slate-300 max-w-md leading-relaxed">
                The peer-to-peer learning platform where everyone can be both
                teacher and learner. Earn credits by teaching, use them to learn
                from others, or purchase credits directly.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a
                  href="#platform"
                  className="block text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Home
                </a>
                <a
                  href="#features"
                  className="block text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Features
                </a>
                <a
                  href="#about"
                  className="block text-slate-300 hover:text-white transition-colors duration-200"
                >
                  About Us
                </a>
                <a
                  href="#contact"
                  className="block text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <div className="space-y-2 text-slate-300">
                <p>muhamadsarhad999@gmail.com</p>
                <p>+964 770 995 2717</p>
                <p>Kurdistan</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2025 SkillSwap. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-slate-400 text-sm">
                Building the future of peer-to-peer education
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
