import React, { useState } from 'react';
import { BookOpen, Info, ShieldCheck, Calculator, GraduationCap, ArrowRight, PieChart, Coins, CheckCircle2, Trophy, HelpCircle, Check, X } from 'lucide-react';

interface EducationProps {
  setView?: (view: string) => void;
}

const Education: React.FC<EducationProps> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'workshop' | 'quiz'>('workshop');
  const [quizState, setQuizState] = useState({
    currentQuestion: 0,
    score: 0,
    showScore: false,
    selectedAnswer: null as number | null,
    isCorrect: null as boolean | null
  });

  const articles = [
    {
      title: "¿Por qué no pago IVA en mis facturas?",
      content: "Si repartes en bici o andando, tu actividad suele estar exenta de IVA (Art. 20 Ley IVA). Esto significa que NO cobras IVA a Uber/Glovo, y por tanto NO presentas modelo 303. ¡Ojo! Si usas moto, la cosa cambia y podrías tener que declararlo.",
      icon: Info,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "IRPF: La 'Hucha' Trimestral",
      content: "El IRPF (Modelo 130) no es un pago a fondo perdido, es un adelanto. Pagas el 20% de tu beneficio cada trimestre. Si al final del año tus ingresos reales fueron bajos, Hacienda te devuelve ese dinero en la Declaración de la Renta.",
      icon: BookOpen,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Mitos sobre Bancos (Revolut/Wise)",
      content: "Hacienda lo sabe todo. Por la directiva europea DAC7, las plataformas avisan de tus ingresos automáticamente. Tener el dinero en un banco lituano o alemán no lo esconde. Declara todo para evitar sanciones.",
      icon: ShieldCheck,
      color: "bg-green-50 text-green-600"
    }
  ];

  const steps = [
    {
      title: "Paso 1: Rendimiento Neto (La Base)",
      desc: "Hacienda solo quiere impuestos sobre lo que te queda en el bolsillo, no sobre el total que facturas.",
      formula: "INGRESOS - GASTOS = BENEFICIO",
      detail: "Ejemplo: Si facturas 1000€ pero gastas 200€ en cuota y gasolina, tu beneficio real es 800€. Sobre estos 800€ se calculan los impuestos.",
      icon: PieChart,
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      title: "Paso 2: Calcular el IRPF (20%)",
      desc: "De ese beneficio, debes guardar una quinta parte para adelantar al Estado.",
      formula: "BENEFICIO x 0.20 = CUOTA IRPF",
      detail: "Siguiendo el ejemplo: 800€ x 0.20 = 160€. Esos 160€ los pagas en el trimestre. Los 640€ restantes son tuyos (menos la cuota de autónomos).",
      icon: Calculator,
      color: "bg-pink-50 text-pink-600"
    },
    {
      title: "Paso 3: Cuota de Autónomos",
      desc: "Tu seguridad social. Te cubre médico, baja por enfermedad y jubilación.",
      formula: "SEGÚN TABLAS DE INGRESOS REALES",
      detail: "Si tu beneficio neto (800€) está en el tramo bajo, pagas la cuota mínima (~230€). Si tienes tarifa plana, pagas ~80€ el primer año.",
      icon: Coins,
      color: "bg-orange-50 text-orange-600"
    }
  ];

  const quizQuestions = [
    {
      question: "Si soy rider con bicicleta, ¿tengo que presentar el modelo 303 de IVA?",
      options: ["Sí, siempre", "No, estoy exento", "Solo si gano más de 1000€"],
      correct: 1,
      explanation: "¡Correcto! El transporte de mercancías en bicicleta está exento de IVA según la normativa actual."
    },
    {
      question: "¿Qué porcentaje de tus beneficios se paga en el Modelo 130 (IRPF)?",
      options: ["10%", "15%", "20%"],
      correct: 2,
      explanation: "Exacto. Adelantas el 20% de tu rendimiento neto (ingresos - gastos) cada trimestre."
    },
    {
      question: "¿La cuota de autónomos es un gasto deducible?",
      options: ["Sí, por supuesto", "No, es un impuesto", "Solo la mitad"],
      correct: 0,
      explanation: "¡Sí! Es uno de los gastos más importantes que puedes restar a tus ingresos para bajar impuestos."
    }
  ];

  const handleAnswer = (index: number) => {
    if (quizState.selectedAnswer !== null) return;
    
    const isCorrect = index === quizQuestions[quizState.currentQuestion].correct;
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: index,
      isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score
    }));
  };

  const nextQuestion = () => {
    if (quizState.currentQuestion + 1 < quizQuestions.length) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedAnswer: null,
        isCorrect: null
      }));
    } else {
      setQuizState(prev => ({ ...prev, showScore: true }));
    }
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      score: 0,
      showScore: false,
      selectedAnswer: null,
      isCorrect: null
    });
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--labora-ink)]">Aula Fiscal</h2>
          <p className="text-gray-500 mt-1">Aprende a calcular tus impuestos sin miedo.</p>
        </div>
        
        <div className="flex p-1 bg-[var(--labora-surface)] border border-gray-100 rounded-xl shadow-sm overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'concepts' ? 'bg-gray-100 text-gray-900' : 'text-[var(--labora-muted)] hover:text-[var(--labora-ink-soft)]'}`}
          >
            Teoría
          </button>
          <button 
            onClick={() => setActiveTab('workshop')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'workshop' ? 'bg-[#2D6CDF] text-white shadow-md' : 'text-[var(--labora-muted)] hover:text-[var(--labora-ink-soft)]'}`}
          >
            <GraduationCap size={16} />
            Taller
          </button>
          <button 
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'quiz' ? 'bg-[#7B3FE4] text-white shadow-md' : 'text-[var(--labora-muted)] hover:text-[var(--labora-ink-soft)]'}`}
          >
            <Trophy size={16} />
            Test
          </button>
        </div>
      </div>

      {activeTab === 'concepts' && (
        <div className="grid gap-6 animate-in slide-in-from-left-4">
          {articles.map((art, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow group cursor-pointer">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${art.color} group-hover:scale-110 transition-transform`}>
                <art.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{art.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{art.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'workshop' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="bg-[#2D6CDF] rounded-[24px] p-8 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">¿Cómo se calcula mi cuota?</h3>
              <p className="text-blue-100 max-w-2xl">
                Muchos gestores te dan el número final sin explicarte nada. Aquí desglosamos la fórmula para que entiendas a dónde va cada euro que ganas.
              </p>
            </div>
            <Calculator className="absolute -bottom-4 -right-4 text-white opacity-10" size={140} />
          </div>

          <div className="grid gap-4">
            {steps.map((step, i) => (
              <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:border-blue-200 transition-colors">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-3">
                     <div className={`p-2 rounded-lg ${step.color}`}>
                       <step.icon size={20} />
                     </div>
                     <h4 className="text-lg font-bold text-gray-800">{step.title}</h4>
                   </div>
                   <p className="text-gray-600 text-sm font-medium">{step.desc}</p>
                </div>
                
                <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">La Fórmula</p>
                   <div className="font-mono text-sm font-bold text-gray-800 bg-[var(--labora-surface)] p-2.5 rounded-lg border border-gray-200 text-center mb-3 shadow-sm">
                     {step.formula}
                   </div>
                   <div className="flex gap-2 items-start text-xs text-gray-500">
                     <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                     <p>{step.detail}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {setView && (
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => setView('simulator')}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--labora-ink)] text-white rounded-xl font-bold shadow-lg hover:bg-black transition-transform active:scale-95"
              >
                Ir al Simulador Interactivo <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="animate-in zoom-in-95 duration-300">
          {!quizState.showScore ? (
            <div className="bg-white rounded-[32px] shadow-lg border border-gray-100 overflow-hidden max-w-2xl mx-auto">
              <div className="bg-[#7B3FE4] p-8 text-white relative">
                 <div className="flex justify-between items-center mb-4">
                   <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">Pregunta {quizState.currentQuestion + 1}/{quizQuestions.length}</span>
                   <HelpCircle className="text-white/50" />
                 </div>
                 <h3 className="text-xl md:text-2xl font-bold leading-tight">
                   {quizQuestions[quizState.currentQuestion].question}
                 </h3>
              </div>
              
              <div className="p-8 space-y-4">
                {quizQuestions[quizState.currentQuestion].options.map((option, idx) => {
                  let btnClass = "w-full p-4 rounded-xl text-left font-bold transition-all border-2 ";
                  if (quizState.selectedAnswer === null) {
                    btnClass += "border-[var(--labora-border)] hover:border-[#7B3FE4] hover:bg-[var(--labora-moss-soft)] text-[var(--labora-ink-soft)]";
                  } else {
                    if (idx === quizQuestions[quizState.currentQuestion].correct) {
                      btnClass += "border-[var(--labora-primary)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]";
                    } else if (idx === quizState.selectedAnswer) {
                      btnClass += "border-[var(--labora-clay)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]";
                    } else {
                      btnClass += "border-gray-100 text-gray-300";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={quizState.selectedAnswer !== null}
                      className={btnClass}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {quizState.selectedAnswer !== null && idx === quizQuestions[quizState.currentQuestion].correct && <Check size={20} />}
                        {quizState.selectedAnswer === idx && idx !== quizQuestions[quizState.currentQuestion].correct && <X size={20} />}
                      </div>
                    </button>
                  );
                })}

                {quizState.selectedAnswer !== null && (
                  <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className={`p-4 rounded-xl mb-4 ${quizState.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                       <p className="font-bold mb-1">{quizState.isCorrect ? '¡Correcto!' : 'Incorrecto'}</p>
                       <p className="text-sm">{quizQuestions[quizState.currentQuestion].explanation}</p>
                    </div>
                    <button 
                      onClick={nextQuestion}
                      className="w-full py-3 bg-[var(--labora-ink)] text-white rounded-xl font-bold hover:bg-black transition-all"
                    >
                      {quizState.currentQuestion + 1 === quizQuestions.length ? 'Ver Resultados' : 'Siguiente Pregunta'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] shadow-lg border border-gray-100 p-10 text-center max-w-md mx-auto">
               <div className="w-24 h-24 bg-gradient-to-tr from-[#F1C40F] to-[#F39C12] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/30">
                 <Trophy size={48} className="text-white" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Test Completado!</h3>
               <p className="text-gray-500 mb-6">
                 Has acertado <span className="text-[var(--labora-ink)] font-bold text-xl">{quizState.score}</span> de {quizQuestions.length} preguntas.
               </p>
               
               <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                 <p className="text-sm text-gray-600 italic">
                   {quizState.score === quizQuestions.length 
                     ? "¡Excelente! Estás hecho un experto fiscal." 
                     : "Sigue repasando el Taller de Cálculo para mejorar."}
                 </p>
               </div>

               <button 
                 onClick={resetQuiz}
                 className="px-8 py-3 bg-[#2D6CDF] text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
               >
                 Repetir Test
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Education;