import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { Loader2, User, Lock, Shield, FileText, BarChart3, Wallet, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';
export default function LocalLoginPage() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    login
  } = useLocalAuth();
  const {
    toast
  } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [loading, user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    if (result.success) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans GestCaisse"
      });
      navigate('/dashboard');
    } else {
      setError(result.error || 'Échec de la connexion');
    }
    setIsSubmitting(false);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary">
        <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-white/80 font-medium">Chargement...</p>
        </motion.div>
      </div>;
  }
  if (user) {
    return null;
  }
  const features = [{
    icon: Wallet,
    text: "Gestion complète de la caisse",
    delay: 0.2
  }, {
    icon: FileText,
    text: "Suivi des recettes et dépenses",
    delay: 0.3
  }, {
    icon: BarChart3,
    text: "Rapports financiers détaillés",
    delay: 0.4
  }, {
    icon: Shield,
    text: "Contrôle d'accès sécurisé",
    delay: 0.5
  }];
  return <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5" animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0]
        }} transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }} />
          <motion.div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/20" animate={{
          scale: [1, 1.15, 1]
        }} transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
          <motion.div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-accent/10" animate={{
          y: [-20, 20, -20]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <motion.div className="max-w-lg text-center space-y-8" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          ease: "easeOut"
        }}>
            {/* Logo */}
            <motion.div className="flex justify-center" initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }}>
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center p-2 shadow-2xl border border-white/20">
                  <img src={dgdaLogo} alt="DGDA Logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <motion.div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg" initial={{
                scale: 0
              }} animate={{
                scale: 1
              }} transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 300
              }}>
                  <CheckCircle className="w-5 h-5 text-accent-foreground" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Title */}
            <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }}>
              <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Gestion|Caisse</h1>
              <div className="h-1 w-20 mx-auto bg-gradient-to-r from-accent to-accent/50 rounded-full" />
              <p className="text-xl text-white/80 mt-4">DGDA|Direction Provinciale Kinshasa-Ville</p>
            </motion.div>
            
            {/* Description */}
            <motion.p className="text-white/60 text-lg leading-relaxed" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.3
          }}>
              Plateforme sécurisée de gestion de caisse pour le suivi et le contrôle des opérations financières
            </motion.p>
            
            {/* Features */}
            <div className="space-y-4 pt-6">
              {features.map((feature, index) => <motion.div key={index} className="flex items-center gap-4 text-left p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors" initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: feature.delay
            }} whileHover={{
              x: 6
            }}>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-white/90 font-medium">{feature.text}</span>
                </motion.div>)}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 bg-background relative">
        {/* Mobile background decoration */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-secondary/5" />
        </div>

        <motion.div className="w-full max-w-md space-y-8 relative z-10" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }}>
          {/* Mobile Logo */}
          <motion.div className="lg:hidden flex flex-col items-center mb-8" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          duration: 0.4
        }}>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary p-1 shadow-xl mb-4">
              <div className="w-full h-full rounded-xl bg-white flex items-center justify-center p-2">
                <img src={dgdaLogo} alt="DGDA Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text">GestCaisse</h1>
            <p className="text-sm text-muted-foreground">DGDA - Bureau Comptable</p>
          </motion.div>

          {/* Login Card */}
          <motion.div className="bg-card rounded-3xl border-2 shadow-elevated p-8" initial={{
          opacity: 0,
          scale: 0.98
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.1
        }}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
              <p className="text-muted-foreground mt-2">
                Entrez vos identifiants pour accéder à votre espace
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && <motion.div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-3" initial={{
                opacity: 0,
                y: -10,
                height: 0
              }} animate={{
                opacity: 1,
                y: 0,
                height: "auto"
              }} exit={{
                opacity: 0,
                y: -10,
                height: 0
              }}>
                    <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span>{error}</span>
                  </motion.div>}
              </AnimatePresence>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Nom d'utilisateur
                </Label>
                <div className="relative">
                  <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200", focusedField === 'username' ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>
                    <User className="h-5 w-5" />
                  </div>
                  <Input id="username" type="text" placeholder="Votre nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)} className="h-14 pl-16 pr-4 rounded-xl border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" autoComplete="username" disabled={isSubmitting} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200", focusedField === 'password' ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input id="password" type="password" placeholder="Votre mot de passe" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} className="h-14 pl-16 pr-4 rounded-xl border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" autoComplete="current-password" disabled={isSubmitting} />
                </div>
              </div>

              <motion.div whileHover={{
              scale: 1.01
            }} whileTap={{
              scale: 0.99
            }}>
                <Button type="submit" className="w-full h-14 text-base font-semibold btn-primary-gradient rounded-xl gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connexion en cours...
                    </> : <>
                      Se connecter
                      <ArrowRight className="h-5 w-5" />
                    </>}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div className="text-center space-y-3" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3
        }}>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-sm">Connexion sécurisée</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} DGDA - Direction Générale des Douanes et Accises
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>;
}