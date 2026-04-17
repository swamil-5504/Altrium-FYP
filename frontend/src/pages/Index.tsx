import { Link } from "react-router-dom";
import { Shield, GraduationCap, Building2, Briefcase, ArrowRight, FileCheck, Blocks, Search, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";




import { ScrollReveal } from "@/components/ScrollReveal";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import ShapeGrid from "@/components/ShapeGrid";

const Index = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);



  return (

    <div className="min-h-screen bg-background overflow-x-hidden">


      <Navbar />

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center relative overflow-hidden">
        {mounted && (
          <>
            {/* Animated grid background - Light Mode */}
            <div className="absolute inset-0 z-0 transition-opacity duration-500 opacity-[0.1] dark:opacity-0 pointer-events-auto dark:pointer-events-none">
              <ShapeGrid
                speed={0.5}
                squareSize={40}
                direction='diagonal'
                borderColor='#271E37'
                hoverFillColor='#222'
                shape='square'
                hoverTrailAmount={0}
              />
            </div>

            {/* Animated grid background - Dark Mode */}
            <div className="absolute inset-0 z-0 transition-opacity duration-500 opacity-0 dark:opacity-[0.3] pointer-events-none dark:pointer-events-auto">
              <ShapeGrid
                speed={0.5}
                squareSize={40}
                direction='diagonal'
                borderColor='#ffffff'
                hoverFillColor='rgba(255, 255, 255, 0.1)'
                shape='square'
                hoverTrailAmount={0}
              />
            </div>
          </>
        )}








        <div className="container mx-auto px-4 relative">
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Blocks className="w-3.5 h-3.5" />
              Blockchain-Secured Academic Credentials
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.08] mb-5" style={{ letterSpacing: "-0.025em" }}>
              Tamper-proof degrees,
              <br />
              <span className="text-accent">verified instantly.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              Universities mint immutable Soulbound Tokens for every graduate. Employers verify in seconds — no intermediaries, no fraud.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/student"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                I'm a Student
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/verify"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors active:scale-[0.98]"
              >
                Verify a Degree
                <Search className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="min-h-screen flex flex-col justify-center bg-card border-y">


        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <p className="text-sm font-medium text-accent mb-2 uppercase tracking-wider">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold">How Altrium Works</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: GraduationCap, title: "Student Submits", desc: "Upload your degree PDF and pay the verification fee to your university.", step: "01" },
              { icon: Building2, title: "University Reviews", desc: "The university admin verifies the document and approves the request.", step: "02" },
              { icon: Blocks, title: "SBT Minted", desc: "An immutable Soulbound Token is minted on-chain with your degree metadata.", step: "03" },
              { icon: Briefcase, title: "Employer Verifies", desc: "Anyone can verify the degree using the student's PRN — free, instant, trustless.", step: "04" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="relative p-6 rounded-xl surface-elevated border group hover:blockchain-glow transition-shadow duration-300">
                  <span className="text-xs font-mono text-muted-foreground/50 absolute top-4 right-4">{item.step}</span>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  {i < 3 && (
                    <ChevronRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-border z-10" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="min-h-screen flex flex-col justify-center">


        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <p className="text-sm font-medium text-accent mb-2 uppercase tracking-wider">Portals</p>
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Role</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: GraduationCap,
                title: "Student",
                desc: "Submit your degree for on-chain verification. No wallet needed — just your documents and PRN.",
                link: "/student",
                label: "Go to Dashboard",
              },
              {
                icon: Building2,
                title: "University Admin",
                desc: "Review submissions, approve degrees, and mint Soulbound Tokens. Full Web3 handled for you.",
                link: "/university",
                label: "Admin Panel",
              },
              {
                icon: Briefcase,
                title: "Employer",
                desc: "Verify any graduate's credentials instantly using their PRN. Free access, no registration required.",
                link: "/verify",
                label: "Verify Now",
              },
            ].map((role, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <Link
                  to={role.link}
                  className="block p-7 rounded-xl border bg-card hover:blockchain-glow transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                    <role.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{role.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2.5 transition-all">
                    {role.label}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust banner */}
      <section className="py-24 bg-primary text-primary-foreground self-center w-full">


        <div className="container mx-auto px-4">
          <ScrollReveal className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-accent" />
              <div>
                <h3 className="text-lg font-semibold">Built on Trust, Secured by Blockchain</h3>
                <p className="text-sm opacity-70">Inspired by India's Academic Bank of Credits (ABC) framework</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">SBT</div>
                <div className="opacity-60 text-xs">Soulbound Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">Sepolia</div>
                <div className="opacity-60 text-xs">Testnet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">Free</div>
                <div className="opacity-60 text-xs">For Employers</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section>

        <Footer />
      </section>

    </div>
  );
};

export default Index;
