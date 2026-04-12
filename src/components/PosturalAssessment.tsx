import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight, Upload, Camera, X, ZoomIn, ZoomOut, Grid3X3, Maximize2, ChevronLeft, ChevronRight, Download, Check } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAssessments } from "@/contexts/AssessmentContext";
import jsPDF from "jspdf";
import {
  pdfColors,
  formatDate,
  drawHeader,
  drawFooter,
  drawSectionTitle,
  drawInfoCard,
  drawSignature,
} from "@/utils/pdfStyles";

interface PosturalFindings {
  [key: string]: boolean;
}

interface PosturalPhoto {
  id: string;
  label: string;
  file: File | null;
  preview: string | null;
  findings: PosturalFindings;
  observations: string;
}

interface PosturalAssessment {
  id: string;
  date: Date;
  photos: PosturalPhoto[];
  generalConclusion: string;
}

interface PosturalAssessmentProps {
  onClose: () => void;
}

interface MuscleMapping {
  desvio: string;
  encurtados: string[];
  alongados: string[];
}

// Mapeamento de músculos encurtados e alongados por desvio
const muscleMapping: Record<string, MuscleMapping[]> = {
  anterior: [
    { desvio: "Cabeça inclinada", encurtados: ["Esternocleidomastoideo unilateral", "Trapézio superior unilateral", "Escalenos"], alongados: ["Esternocleidomastoideo contralateral", "Trapézio médio e inferior contralateral"] },
    { desvio: "Cabeça rodada", encurtados: ["Esternocleidomastoideo", "Esplenio da cabeça", "Trapézio superior"], alongados: ["Esternocleidomastoideo contralateral", "Esplenio contralateral"] },
    { desvio: "Ombro elevado", encurtados: ["Trapézio superior", "Elevador da escápula"], alongados: ["Trapézio inferior", "Serrátil anterior"] },
    { desvio: "Ombro baixo", encurtados: ["Latíssimo do dorso", "Peitoral menor"], alongados: ["Trapézio superior", "Elevador da escápula"] },
    { desvio: "Escápula abduzida", encurtados: ["Serrátil anterior", "Peitoral menor"], alongados: ["Romboides", "Trapézio médio"] },
    { desvio: "Escápula aduzida", encurtados: ["Romboides", "Trapézio médio"], alongados: ["Serrátil anterior", "Peitoral menor"] },
    { desvio: "Quadril alto", encurtados: ["Quadrado lombar", "Oblíquos"], alongados: ["Adutores contralaterais", "Glúteo médio contralateral"] },
    { desvio: "Quadril baixo", encurtados: ["Adutores", "Glúteo médio contralateral"], alongados: ["Quadrado lombar contralateral", "Oblíquos"] },
    { desvio: "Geno valgo", encurtados: ["Adutores", "Tensor da fáscia lata"], alongados: ["Glúteo médio e mínimo", "Rotadores laterais do quadril"] },
    { desvio: "Geno varo", encurtados: ["Glúteo médio", "TFL"], alongados: ["Adutores"] },
    { desvio: "Pé pronado", encurtados: ["Fibulares", "Gastrocnêmio medial"], alongados: ["Tibial posterior", "Flexores plantares"] },
    { desvio: "Pé supinado", encurtados: ["Tibial posterior", "Flexores plantares"], alongados: ["Fibulares"] }
  ],
  posterior: [
    { desvio: "Cabeça inclinada", encurtados: ["Trapézio superior unilateral", "Esplenio cervical"], alongados: ["Trapézio médio e inferior contralateral"] },
    { desvio: "Ombro elevado", encurtados: ["Trapézio superior", "Elevador da escápula"], alongados: ["Trapézio inferior", "Serrátil anterior"] },
    { desvio: "Escápula alada", encurtados: ["Romboides", "Peitoral menor"], alongados: ["Serrátil anterior"] },
    { desvio: "Escápula abduzida", encurtados: ["Serrátil anterior"], alongados: ["Romboides", "Trapézio médio"] },
    { desvio: "Escápula aduzida", encurtados: ["Romboides", "Trapézio médio"], alongados: ["Serrátil anterior"] },
    { desvio: "Quadril elevado", encurtados: ["Quadrado lombar", "Eretores da espinha"], alongados: ["Glúteo médio", "Adutores contralaterais"] },
    { desvio: "Pelve em rotação", encurtados: ["Oblíquos internos de um lado", "Oblíquos externos do outro"], alongados: ["Rotadores contralaterais"] },
    { desvio: "Joelho em rotação interna", encurtados: ["TFL", "Vasto lateral"], alongados: ["Rotadores laterais do quadril"] },
    { desvio: "Joelho em rotação externa", encurtados: ["Rotadores externos do quadril"], alongados: ["TFL", "Adutores"] },
    { desvio: "Pé pronado", encurtados: ["Fibulares"], alongados: ["Tibial posterior"] },
    { desvio: "Pé supinado", encurtados: ["Tibial posterior"], alongados: ["Fibulares"] }
  ],
  lateral_direita: [
    { desvio: "Cabeça projetada", encurtados: ["Esternocleidomastoideo", "Suboccipitais"], alongados: ["Flexores profundos cervicais"] },
    { desvio: "Cifose torácica", encurtados: ["Peitoral maior e menor"], alongados: ["Eretores da espinha torácica", "Romboides"] },
    { desvio: "Lordose lombar aumentada", encurtados: ["Iliopsoas", "Reto femoral", "Eretores da espinha"], alongados: ["Glúteo máximo", "Abdominais"] },
    { desvio: "Retificação lombar", encurtados: ["Abdominais profundos"], alongados: ["Eretores da espinha"] },
    { desvio: "Pelve em anteversão", encurtados: ["Iliopsoas", "Reto femoral"], alongados: ["Isquiotibiais", "Glúteos"] },
    { desvio: "Pelve em retroversão", encurtados: ["Isquiotibiais"], alongados: ["Iliopsoas", "Eretores da espinha"] },
    { desvio: "Joelho hiperestendido", encurtados: ["Quadríceps", "Gastrocnêmio"], alongados: ["Isquiotibiais"] },
    { desvio: "Pé pronado", encurtados: ["Fibulares"], alongados: ["Tibial posterior"] }
  ],
  lateral_esquerda: [
    { desvio: "Cabeça projetada", encurtados: ["Esternocleidomastoideo", "Suboccipitais"], alongados: ["Flexores profundos cervicais"] },
    { desvio: "Cifose torácica", encurtados: ["Peitoral maior e menor"], alongados: ["Eretores da espinha torácica", "Romboides"] },
    { desvio: "Lordose lombar aumentada", encurtados: ["Iliopsoas", "Quadrado lombar"], alongados: ["Glúteo máximo", "Abdominais"] },
    { desvio: "Retificação lombar", encurtados: ["Abdominais"], alongados: ["Eretores da espinha"] },
    { desvio: "Pelve em anteversão", encurtados: ["Iliopsoas", "Reto femoral"], alongados: ["Isquiotibiais", "Glúteo máximo"] },
    { desvio: "Pelve em retroversão", encurtados: ["Isquiotibiais"], alongados: ["Iliopsoas", "Eretores da espinha"] },
    { desvio: "Joelho flexionado", encurtados: ["Isquiotibiais"], alongados: ["Quadríceps"] },
    { desvio: "Pé supinado", encurtados: ["Tibial posterior"], alongados: ["Fibulares"] }
  ]
};

// Mapeamento de desvios para keywords de busca
const findingToMuscleKeywords: Record<string, string[]> = {
  // Vista Frontal
  "Cabeça inclinada para direita": ["Cabeça inclinada"],
  "Cabeça inclinada para esquerda": ["Cabeça inclinada"],
  "Rotações perceptíveis": ["Cabeça rodada"],
  "Ombro direito mais alto": ["Ombro elevado"],
  "Ombro esquerdo mais alto": ["Ombro elevado"],
  "Cintura escapular desviada para direita": ["Escápula abduzida"],
  "Cintura escapular desviada para esquerda": ["Escápula abduzida"],
  "Quadril direito mais alto": ["Quadril alto"],
  "Quadril esquerdo mais alto": ["Quadril alto"],
  "Valgo": ["Geno valgo"],
  "Varo": ["Geno varo"],
  "Pronação direita": ["Pé pronado"],
  "Pronação esquerda": ["Pé pronado"],
  "Supinação direita": ["Pé supinado"],
  "Supinação esquerda": ["Pé supinado"],
  // Vista Posterior
  "Ombro direito alto": ["Ombro elevado"],
  "Ombro esquerdo alto": ["Ombro elevado"],
  "Escápula alada direita": ["Escápula alada"],
  "Escápula alada esquerda": ["Escápula alada"],
  "Quadril direito alto": ["Quadril elevado"],
  "Quadril esquerdo alto": ["Quadril elevado"],
  "Rotação pélvica (D/E)": ["Pelve em rotação"],
  "Pé pronado (D/E)": ["Pé pronado"],
  "Pé supinado (D/E)": ["Pé supinado"],
  // Vista Lateral
  "Cabeça projetada para frente": ["Cabeça projetada"],
  "Hipercifose torácica": ["Cifose torácica"],
  "Hiperlordose lombar": ["Lordose lombar aumentada"],
  "Retificação lombar": ["Retificação lombar"],
  "Anteversão": ["Pelve em anteversão"],
  "Retroversão": ["Pelve em retroversão"],
  "Hiperextensão": ["Joelho hiperestendido"],
  "Flexo": ["Joelho flexionado"],
  "Pé pronado": ["Pé pronado"],
  "Pé supinado": ["Pé supinado"],
};

const frontalFindings = [
  { category: "Cabeça e Pescoço", items: [
    "Cabeça inclinada para direita",
    "Cabeça inclinada para esquerda",
    "Rotações perceptíveis"
  ]},
  { category: "Ombros", items: [
    "Ombro direito mais alto",
    "Ombro esquerdo mais alto",
    "Cintura escapular desviada para direita",
    "Cintura escapular desviada para esquerda",
    "Rotação dos ombros (interna/externa)"
  ]},
  { category: "Coluna / Tronco", items: [
    "Tronco desviado para direita",
    "Tronco desviado para esquerda",
    "Inclinação do tronco para direita",
    "Inclinação do tronco para esquerda",
    "Rotação do tronco para direita",
    "Rotação do tronco para esquerda"
  ]},
  { category: "Pelve / Quadril", items: [
    "Quadril direito mais alto",
    "Quadril esquerdo mais alto",
    "Rotação pélvica à direita",
    "Rotação pélvica à esquerda",
    "Pelve desviada para direita",
    "Pelve desviada para esquerda"
  ]},
  { category: "Joelhos", items: [
    "Valgo",
    "Varo"
  ]},
  { category: "Pés", items: [
    "Pronação direita",
    "Pronação esquerda",
    "Supinação direita",
    "Supinação esquerda"
  ]}
];

const posteriorFindings = [
  { category: "Ombros / Escápulas", items: [
    "Ombro direito alto",
    "Ombro esquerdo alto",
    "Escápula alada direita",
    "Escápula alada esquerda",
    "Basculamento escapular",
    "Rotação escapular"
  ]},
  { category: "Coluna", items: [
    "Escoliose C direita",
    "Escoliose C esquerda",
    "Escoliose S",
    "Desvio lateral direita",
    "Desvio lateral esquerda",
    "Rotação do tronco (D/E)"
  ]},
  { category: "Pelve", items: [
    "Quadril direito alto",
    "Quadril esquerdo alto",
    "Pelve desviada (D/E)",
    "Rotação pélvica (D/E)"
  ]},
  { category: "Tornozelo / Pé", items: [
    "Tendão de Aquiles em valgo",
    "Tendão de Aquiles em varo",
    "Pé pronado (D/E)",
    "Pé supinado (D/E)"
  ]}
];

const lateralFindings = [
  { category: "Cabeça", items: [
    "Cabeça projetada para frente",
    "Cabeça recuada",
    "Hiperextensão cervical"
  ]},
  { category: "Ombros", items: [
    "Ombro protraído",
    "Ombro retraído"
  ]},
  { category: "Coluna", items: [
    "Hipercifose torácica",
    "Retificação torácica",
    "Hiperlordose lombar",
    "Retificação lombar"
  ]},
  { category: "Pelve", items: [
    "Anteversão",
    "Retroversão"
  ]},
  { category: "Tronco", items: [
    "Tronco inclinado para frente",
    "Tronco inclinado para trás"
  ]},
  { category: "Joelhos", items: [
    "Hiperextensão",
    "Flexo"
  ]},
  { category: "Pés", items: [
    "Pé pronado",
    "Pé supinado",
    "CG deslocado para frente",
    "CG deslocado para trás"
  ]}
];

const getFindingsForView = (viewId: string) => {
  switch (viewId) {
    case "frente":
      return frontalFindings;
    case "costas":
      return posteriorFindings;
    case "lado-direito":
    case "lado-esquerdo":
      return lateralFindings;
    default:
      return [];
  }
};

const getMuscleCategory = (viewId: string): string => {
  switch (viewId) {
    case "frente":
      return "anterior";
    case "costas":
      return "posterior";
    case "lado-direito":
      return "lateral_direita";
    case "lado-esquerdo":
      return "lateral_esquerda";
    default:
      return "anterior";
  }
};

const getMusclesForFinding = (finding: string, viewId: string): MuscleMapping | null => {
  const category = getMuscleCategory(viewId);
  const mappings = muscleMapping[category] || [];
  const keywords = findingToMuscleKeywords[finding] || [];
  
  for (const keyword of keywords) {
    const match = mappings.find(m => m.desvio.toLowerCase().includes(keyword.toLowerCase()));
    if (match) return match;
  }
  
  // Fallback: busca direta
  for (const mapping of mappings) {
    if (finding.toLowerCase().includes(mapping.desvio.toLowerCase())) {
      return mapping;
    }
  }
  
  return null;
};

const PosturalAssessmentComponent: React.FC<PosturalAssessmentProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { 
    assessments: globalAssessments, 
    currentAssessmentId, 
    setCurrentAssessmentId,
    createNewAssessment: createGlobalAssessment,
    updateAssessment,
    getAssessmentById
  } = useAssessments();
  
  const [step, setStep] = useState<"upload" | "analysis" | "summary">("upload");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [generalConclusion, setGeneralConclusion] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>([]);
  const professionalName = "Personal Jão";
  // Zoom and pan state
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile carousel state for body regions
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  
  const [photos, setPhotos] = useState<PosturalPhoto[]>([
    { id: "frente", label: "Foto Frente", file: null, preview: null, findings: {}, observations: "" },
    { id: "costas", label: "Foto Costas", file: null, preview: null, findings: {}, observations: "" },
    { id: "lado-direito", label: "Foto Lado Direito", file: null, preview: null, findings: {}, observations: "" },
    { id: "lado-esquerdo", label: "Foto Lado Esquerdo", file: null, preview: null, findings: {}, observations: "" },
  ]);

  // Sincronizar generalConclusion com contexto global
  useEffect(() => {
    if (currentAssessmentId && generalConclusion !== undefined) {
      const currentAssessment = getAssessmentById(currentAssessmentId);
      if (currentAssessment?.postural?.generalConclusion !== generalConclusion) {
        updateAssessment(currentAssessmentId, {
          postural: {
            photos,
            generalConclusion
          }
        });
      }
    }
  }, [generalConclusion, currentAssessmentId]);

  // Converter avaliações globais para formato postural
  // IMPORTANTE: Para a avaliação atual, usar os dados locais (photos) que são mais recentes
  const savedAssessments: PosturalAssessment[] = globalAssessments
    .filter(a => a.postural)
    .map(a => {
      // Se for a avaliação atual, usar os dados locais (mais atualizados)
      if (a.id === currentAssessmentId) {
        return {
          id: a.id,
          date: a.date,
          photos: photos, // Usar estado local
          generalConclusion: generalConclusion // Usar estado local
        };
      }
      return {
        id: a.id,
        date: a.date,
        photos: a.postural?.photos || [],
        generalConclusion: a.postural?.generalConclusion || ""
      };
    });

  // Função para carregar uma avaliação anterior
  const loadAssessment = (assessmentId: string) => {
    const assessment = savedAssessments.find(a => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessmentId(assessmentId);
      setCurrentAssessmentId(assessmentId);
      setPhotos(assessment.photos);
      setGeneralConclusion(assessment.generalConclusion || "");
      toast({
        title: "Avaliação carregada",
        description: `Dados de ${assessment.date.toLocaleDateString("pt-BR")} carregados com sucesso.`,
      });
    }
  };

  // Função para criar nova avaliação (coordenada globalmente)
  const createNewAssessment = () => {
    // Cria nova avaliação global que afeta todos os módulos
    const newId = createGlobalAssessment();
    setSelectedAssessmentId(newId);
    setPhotos([
      { id: "frente", label: "Foto Frente", file: null, preview: null, findings: {}, observations: "" },
      { id: "costas", label: "Foto Costas", file: null, preview: null, findings: {}, observations: "" },
      { id: "lado-direito", label: "Foto Lado Direito", file: null, preview: null, findings: {}, observations: "" },
      { id: "lado-esquerdo", label: "Foto Lado Esquerdo", file: null, preview: null, findings: {}, observations: "" },
    ]);
    setGeneralConclusion("");
    toast({
      title: "Nova avaliação",
      description: "Nova avaliação criada e coordenada em todos os módulos.",
    });
  };

  const formatMonthName = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }).replace(" de ", " De ");
  };

  const getSelectedAssessment = () => {
    return savedAssessments.find(a => a.id === selectedAssessmentId);
  };

  const toggleComparisonSelection = (id: string) => {
    setSelectedComparisonIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const getSelectedComparisonAssessments = () => {
    return savedAssessments.filter(a => selectedComparisonIds.includes(a.id));
  };

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreview = reader.result as string;
        setPhotos((prev) => {
          const updatedPhotos = prev.map((photo, i) =>
            i === index ? { ...photo, file, preview: newPreview } : photo
          );
          // Sincronizar com contexto global
          if (currentAssessmentId) {
            updateAssessment(currentAssessmentId, {
              postural: {
                photos: updatedPhotos,
                generalConclusion
              }
            });
          }
          return updatedPhotos;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updatedPhotos = prev.map((photo, i) =>
        i === index ? { ...photo, file: null, preview: null } : photo
      );
      // Sincronizar com contexto global
      if (currentAssessmentId) {
        updateAssessment(currentAssessmentId, {
          postural: {
            photos: updatedPhotos,
            generalConclusion
          }
        });
      }
      return updatedPhotos;
    });
  };

  const handleFindingChange = (finding: string, checked: boolean) => {
    setPhotos((prev) => {
      const updatedPhotos = prev.map((photo, i) =>
        i === currentPhotoIndex
          ? { ...photo, findings: { ...photo.findings, [finding]: checked } }
          : photo
      );
      // Sincronizar com contexto global
      if (currentAssessmentId) {
        updateAssessment(currentAssessmentId, {
          postural: {
            photos: updatedPhotos,
            generalConclusion
          }
        });
      }
      return updatedPhotos;
    });
  };

  const handleObservationsChange = (value: string) => {
    setPhotos((prev) => {
      const updatedPhotos = prev.map((photo, i) =>
        i === currentPhotoIndex ? { ...photo, observations: value } : photo
      );
      // Sincronizar com contexto global
      if (currentAssessmentId) {
        updateAssessment(currentAssessmentId, {
          postural: {
            photos: updatedPhotos,
            generalConclusion
          }
        });
      }
      return updatedPhotos;
    });
  };

  const goToNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
      setCurrentCategoryIndex(0); // Reset carousel position
    } else {
      setStep("summary");
    }
  };

  const goToPreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
      setCurrentCategoryIndex(0); // Reset carousel position
      resetImageView();
    } else {
      setStep("upload");
    }
  };

  const resetImageView = () => {
    setZoom(100);
    setPanPosition({ x: 0, y: 0 });
    setShowGrid(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 100) {
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      const maxPan = (zoom - 100) * 2;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  const hasAnyPhoto = photos.some((p) => p.preview);

  const getSelectedFindings = (photo: PosturalPhoto) => {
    return Object.entries(photo.findings)
      .filter(([_, checked]) => checked)
      .map(([finding]) => finding);
  };

  const currentFindings = getFindingsForView(photos[currentPhotoIndex]?.id);

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const { tiffanyGreen, darkText, lightText, bgLight, white, borderColor, success, danger } = pdfColors;

      const viewLabels: Record<string, string> = {
        'frente': 'Vista Anterior',
        'costas': 'Vista Posterior',
        'lado-direito': 'Vista Lateral Direita',
        'lado-esquerdo': 'Vista Lateral Esquerda'
      };

      // Função auxiliar para carregar imagem como base64
      const loadImageAsBase64 = (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              reject(new Error('Could not get canvas context'));
            }
          };
          img.onerror = reject;
          img.src = src;
        });
      };

      // ==================== PÁGINA 1 - DADOS E FOTOS ====================
      let y = drawHeader(doc, professionalName, 'Avaliação Postural', 1);

    // === DADOS DO CLIENTE ===
    y = drawSectionTitle(doc, 'DADOS DA AVALIAÇÃO', y);

    const cardWidth = (pageWidth - 50) / 2;
    drawInfoCard(doc, 'Data', formatDate(new Date()), 20, y, cardWidth);
    drawInfoCard(doc, 'Tipo', 'Avaliação Postural Completa', 25 + cardWidth, y, cardWidth);

    y += 28;

    // === FOTOS DA AVALIAÇÃO ===
    y = drawSectionTitle(doc, 'REGISTRO FOTOGRÁFICO', y);

    // Grid de 2x2 para as fotos - aumentar altura para fotos em pé
    const photoWidth = (pageWidth - 50) / 2;
    const photoHeight = 95; // Altura maior para fotos em proporção vertical
    const photosWithPreview = photos.filter(p => p.preview);
    
    // Função para calcular dimensões mantendo proporção
    const getImageDimensions = (
      maxWidth: number,
      maxHeight: number,
      aspectRatio: number = 0.65 // Proporção típica de foto em pé (largura/altura)
    ) => {
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      return { imgWidth, imgHeight };
    };
    
    if (photosWithPreview.length > 0) {
      photos.forEach((photo, index) => {
        // Posicionar em grid 2x2
        const photoX = 20 + (index % 2) * (photoWidth + 5);
        const currentY = index < 2 ? y : y + photoHeight + 10;
        
        // Borda e fundo da área da foto
        doc.setFillColor(...bgLight);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(photoX, currentY, photoWidth, photoHeight, 3, 3, 'FD');
        
        // Label da vista
        doc.setFillColor(...tiffanyGreen);
        doc.roundedRect(photoX, currentY, photoWidth, 8, 3, 0, 'F');
        doc.setTextColor(...white);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(viewLabels[photo.id] || photo.label, photoX + photoWidth / 2, currentY + 5.5, { align: 'center' });
        
        // Adicionar foto se existir - mantendo proporção
        if (photo.preview) {
          try {
            const contentY = currentY + 10;
            const availableHeight = photoHeight - 14;
            const availableWidth = photoWidth - 8;
            
            // Calcular dimensões mantendo proporção vertical (fotos em pé)
            const { imgWidth, imgHeight } = getImageDimensions(availableWidth, availableHeight, 0.6);
            
            // Centralizar a imagem na área disponível
            const imgX = photoX + (photoWidth - imgWidth) / 2;
            const imgY = contentY + (availableHeight - imgHeight) / 2;
            
            doc.addImage(photo.preview, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'MEDIUM');
          } catch (error) {
            doc.setTextColor(...lightText);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Foto disponível', photoX + photoWidth / 2, currentY + photoHeight / 2, { align: 'center' });
          }
        } else {
          doc.setTextColor(...lightText);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text('Sem foto', photoX + photoWidth / 2, currentY + photoHeight / 2, { align: 'center' });
        }
        
        // Contador de achados
        const findingsCount = getSelectedFindings(photo).length;
        if (findingsCount > 0) {
          const badgeX = photoX + photoWidth - 12;
          const badgeY = currentY + photoHeight - 8;
          doc.setFillColor(...tiffanyGreen);
          doc.circle(badgeX, badgeY, 5, 'F');
          doc.setTextColor(...white);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(findingsCount.toString(), badgeX, badgeY + 2, { align: 'center' });
        }
      });
      
      y += (photoHeight * 2) + 15;
    } else {
      doc.setTextColor(...lightText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhuma foto registrada para esta avaliação.', pageWidth / 2, y + 10, { align: 'center' });
      y += 25;
    }

    // ==================== PÁGINA 2 - ACHADOS DETALHADOS ====================
    drawFooter(doc, professionalName);
    doc.addPage();
    y = drawHeader(doc, professionalName, 'Avaliação Postural - Achados', doc.getNumberOfPages());

    // === ACHADOS POR VISTA COM FOTO ===
    photos.forEach((photo, photoIndex) => {
      const selectedFindings = getSelectedFindings(photo);
      
      if (y > 200) {
        drawFooter(doc, professionalName);
        doc.addPage();
        y = drawHeader(doc, professionalName, 'Avaliação Postural - Achados', doc.getNumberOfPages());
      }

      // Seção para cada vista
      y = drawSectionTitle(doc, viewLabels[photo.id] || photo.label, y);
      
      // Layout: foto à esquerda, achados à direita
      const sectionHeight = 60;
      const thumbWidth = 35; // Largura menor para manter proporção vertical
      const thumbHeight = sectionHeight;
      
      // Miniatura da foto - mantendo proporção
      doc.setFillColor(...bgLight);
      doc.roundedRect(20, y, thumbWidth, thumbHeight, 2, 2, 'F');
      
      if (photo.preview) {
        try {
          // Calcular dimensões mantendo proporção vertical
          const availableWidth = thumbWidth - 4;
          const availableHeight = thumbHeight - 4;
          const aspectRatio = 0.6; // Proporção típica de foto em pé
          
          let imgWidth = availableWidth;
          let imgHeight = imgWidth / aspectRatio;
          
          if (imgHeight > availableHeight) {
            imgHeight = availableHeight;
            imgWidth = imgHeight * aspectRatio;
          }
          
          // Centralizar
          const imgX = 20 + (thumbWidth - imgWidth) / 2;
          const imgY = y + (thumbHeight - imgHeight) / 2;
          
          doc.addImage(photo.preview, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');
        } catch (error) {
          doc.setTextColor(...lightText);
          doc.setFontSize(7);
          doc.text('Foto', 20 + thumbWidth / 2, y + thumbHeight / 2, { align: 'center' });
        }
      } else {
        doc.setTextColor(...lightText);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('Sem foto', 20 + thumbWidth / 2, y + thumbHeight / 2, { align: 'center' });
      }
      
      // Lista de achados à direita da foto
      const findingsX = 65;
      const findingsWidth = pageWidth - findingsX - 20;
      let findingsY = y;
      
      if (selectedFindings.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkText);
        doc.text(`${selectedFindings.length} desvio(s) identificado(s):`, findingsX, findingsY + 5);
        findingsY += 10;
        
        selectedFindings.forEach((finding, i) => {
          if (findingsY > y + sectionHeight - 5) return; // Limitar ao espaço disponível
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...darkText);
          doc.setFontSize(7);
          
          // Truncar texto longo
          const truncatedFinding = finding.length > 45 ? finding.substring(0, 42) + '...' : finding;
          doc.text(`• ${truncatedFinding}`, findingsX, findingsY + 3);
          
          // Músculos relacionados
          const muscles = getMusclesForFinding(finding, photo.id);
          if (muscles && findingsY + 6 <= y + sectionHeight - 5) {
            doc.setFontSize(6);
            doc.setTextColor(...danger);
            const encText = muscles.encurtados.slice(0, 2).join(', ');
            doc.text(`  ↑ ${encText.substring(0, 40)}`, findingsX + 3, findingsY + 8);
          }
          
          findingsY += 12;
        });
      } else {
        doc.setTextColor(...success);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ Nenhum desvio identificado', findingsX, y + sectionHeight / 2);
      }
      
      y += sectionHeight + 10;
    });

    // ==================== PÁGINA DE MÚSCULOS ====================
    drawFooter(doc, professionalName);
    doc.addPage();
    y = drawHeader(doc, professionalName, 'Avaliação Postural - Análise Muscular', doc.getNumberOfPages());

    y = drawSectionTitle(doc, 'MÚSCULOS ENCURTADOS E ALONGADOS', y);

    // Coletar todos os músculos de todos os achados
    const allEncurtados: Set<string> = new Set();
    const allAlongados: Set<string> = new Set();

    photos.forEach(photo => {
      const selectedFindings = getSelectedFindings(photo);
      selectedFindings.forEach(finding => {
        const muscles = getMusclesForFinding(finding, photo.id);
        if (muscles) {
          muscles.encurtados.forEach(m => allEncurtados.add(m));
          muscles.alongados.forEach(m => allAlongados.add(m));
        }
      });
    });

    // Card de músculos encurtados
    const halfWidth = (pageWidth - 50) / 2;
    
    // Encurtados
    doc.setFillColor(254, 226, 226); // Red light
    doc.roundedRect(20, y, halfWidth, 15, 2, 2, 'F');
    doc.setTextColor(...danger);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MÚSCULOS ENCURTADOS', 20 + halfWidth / 2, y + 10, { align: 'center' });

    // Alongados
    doc.setFillColor(220, 252, 231); // Green light
    doc.roundedRect(25 + halfWidth, y, halfWidth, 15, 2, 2, 'F');
    doc.setTextColor(...success);
    doc.text('MÚSCULOS ALONGADOS', 25 + halfWidth + halfWidth / 2, y + 10, { align: 'center' });

    y += 20;

    const encurtadosArray = Array.from(allEncurtados);
    const alongadosArray = Array.from(allAlongados);
    const maxItems = Math.max(encurtadosArray.length, alongadosArray.length);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    for (let i = 0; i < maxItems; i++) {
      if (y > 270) {
        drawFooter(doc, professionalName);
        doc.addPage();
        y = drawHeader(doc, professionalName, 'Avaliação Postural - Análise Muscular', doc.getNumberOfPages());
      }

      if (i % 2 === 0) {
        doc.setFillColor(...bgLight);
        doc.rect(20, y - 1, pageWidth - 40, 6, 'F');
      }

      if (encurtadosArray[i]) {
        doc.setTextColor(...danger);
        doc.text(`• ${encurtadosArray[i]}`, 25, y + 3);
      }

      if (alongadosArray[i]) {
        doc.setTextColor(...success);
        doc.text(`• ${alongadosArray[i]}`, 30 + halfWidth, y + 3);
      }

      y += 6;
    }

    if (maxItems === 0) {
      doc.setTextColor(...lightText);
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhum desvio identificado - postura dentro dos parâmetros normais', pageWidth / 2, y + 10, { align: 'center' });
      y += 20;
    }

    // === CONCLUSÃO GERAL ===
    y += 15;
    y = drawSectionTitle(doc, 'CONCLUSÃO GERAL', y);

    doc.setFillColor(...white);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    const conclusion = generalConclusion || 'Avaliação postural realizada. Recomenda-se acompanhamento com exercícios corretivos conforme desvios identificados.';
    const splitConclusion = doc.splitTextToSize(conclusion, pageWidth - 50);
    doc.text(splitConclusion, 25, y + 10);

    // === ASSINATURA ===
    y += 55;
    drawSignature(doc, professionalName, 'Personal Trainer', y);

    drawFooter(doc, professionalName);

      // Salvar PDF
      doc.save(`avaliacao-postural-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);

      toast({
        title: "PDF Exportado!",
        description: "Relatório de avaliação postural baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <div>
            <h1 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1 md:gap-2">
              <Camera className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Avaliação Postural
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Data: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPDF} size="sm" className="text-xs">
            <Download className="w-3 h-3 mr-1" />
            Gerar Relatório PDF
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            <ArrowLeft className="w-3 h-3 mr-1" />
            Voltar ao Dashboard
          </Button>
          <div className="text-[10px] md:text-xs text-muted-foreground flex gap-1 ml-2">
            <span className={step === "upload" ? "text-primary font-semibold" : ""}>UPLOAD</span>
            <span>/</span>
            <span className={step === "analysis" ? "text-primary font-semibold" : ""}>AVALIAÇÃO</span>
            <span>/</span>
            <span className={step === "summary" ? "text-primary font-semibold" : ""}>RESUMO</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {step === "upload" && (
          <>
            {/* Seção de Avaliações Anteriores */}
            {savedAssessments.length > 0 && (
              <Card className="p-4 md:p-6 mb-4 shadow-elevated">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm md:text-base font-bold text-foreground">
                    Avaliações Anteriores ({savedAssessments.length})
                  </h3>
                  {selectedAssessmentId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createNewAssessment}
                      className="text-xs"
                    >
                      + Nova Avaliação
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {savedAssessments
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((assessment) => {
                      const isSelected = selectedAssessmentId === assessment.id;
                      const totalFindings = assessment.photos.reduce(
                        (sum, photo) => sum + Object.values(photo.findings).filter(Boolean).length,
                        0
                      );
                      
                      return (
                        <button
                          key={assessment.id}
                          onClick={() => loadAssessment(assessment.id)}
                          className={`
                            flex flex-col items-center justify-center p-4 md:p-5 rounded-xl
                            transition-all duration-200 shadow-card
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground shadow-elevated ring-2 ring-primary/50 scale-[1.02]' 
                              : 'bg-card text-card-foreground hover:shadow-elevated hover:scale-[1.01]'
                            }
                            cursor-pointer
                          `}
                        >
                          <span className={`text-xs md:text-sm font-medium mb-2 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {assessment.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                          </span>
                          <span className={`text-2xl md:text-3xl font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                            {totalFindings}
                          </span>
                          <span className={`text-xs md:text-sm mt-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {totalFindings === 1 ? 'Achado' : 'Achados'}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {selectedAssessmentId && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Avaliação de {getSelectedAssessment()?.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} carregada
                  </p>
                )}
              </Card>
            )}

            <Card className="p-4 md:p-6">
              <h2 className="text-sm md:text-base font-semibold mb-3 md:mb-4 text-foreground">Upload de Fotos</h2>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="border-2 border-dashed border-border rounded-lg p-2 md:p-4 flex flex-col items-center justify-center min-h-[120px] md:min-h-[180px] relative cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => !photo.preview && handleUploadClick(index)}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    onChange={(e) => handleFileChange(index, e)}
                  />
                  <p className="text-xs md:text-sm font-medium text-foreground mb-2 md:mb-3 text-center">{photo.label}</p>
                  {photo.preview ? (
                    <div className="relative w-full h-20 md:h-32">
                      <img
                        src={photo.preview}
                        alt={photo.label}
                        className="w-full h-full object-contain rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-5 w-5 md:h-6 md:w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(index);
                        }}
                      >
                        <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground mb-1 md:mb-2" />
                      <p className="text-[10px] md:text-xs text-primary text-center">Clique para adicionar</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 md:mt-6">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto" size="sm">
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setStep("analysis");
                  setCurrentPhotoIndex(0);
                }}
                disabled={!hasAnyPhoto}
                className="w-full sm:w-auto"
                size="sm"
              >
                Próximo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            </Card>
          </>
        )}

        {step === "analysis" && (
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-sm md:text-base font-semibold text-foreground">
                Análise: {photos[currentPhotoIndex].label}
              </h2>
              <span className="text-[10px] md:text-xs text-muted-foreground">
                {currentPhotoIndex + 1} de {photos.length}
              </span>
            </div>

            {/* Desktop: Side by side layout | Mobile: Stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Photo Preview with Zoom and Grid Controls */}
              <div className="flex flex-col">
                <div 
                  ref={imageContainerRef}
                  className="relative border border-border rounded-lg bg-muted/20 min-h-[300px] md:min-h-[450px] overflow-hidden"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: zoom > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                >
                  {/* Control buttons */}
                  <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                    <Button
                      variant={showGrid ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 md:h-10 md:w-10 bg-background/90 hover:bg-background"
                      onClick={() => setShowGrid(!showGrid)}
                      title="Grade cinematográfica"
                    >
                      <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 md:h-10 md:w-10 bg-background/90 hover:bg-background"
                      onClick={resetImageView}
                      title="Resetar visualização"
                    >
                      <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>

                  {/* Grid overlay - quadriculada preta */}
                  {showGrid && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {/* Vertical lines - 10 columns */}
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={`v-${i}`}
                          className="absolute top-0 bottom-0 w-px bg-black/50"
                          style={{ left: `${(i + 1) * 10}%` }}
                        />
                      ))}
                      {/* Horizontal lines - 10 rows */}
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={`h-${i}`}
                          className="absolute left-0 right-0 h-px bg-black/50"
                          style={{ top: `${(i + 1) * 10}%` }}
                        />
                      ))}
                      {/* Center lines - slightly thicker */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/70" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/70" />
                    </div>
                  )}

                  {/* Image */}
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {photos[currentPhotoIndex].preview ? (
                      <img
                        src={photos[currentPhotoIndex].preview}
                        alt={photos[currentPhotoIndex].label}
                        className="max-w-full max-h-full object-contain rounded select-none"
                        style={{
                          transform: `scale(${zoom / 100}) translate(${panPosition.x / (zoom / 100)}px, ${panPosition.y / (zoom / 100)}px)`,
                          transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                        }}
                        draggable={false}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma foto disponível</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Zoom slider */}
                <div className="flex items-center gap-3 mt-3 px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Slider
                    value={[zoom]}
                    min={50}
                    max={300}
                    step={10}
                    onValueChange={(value) => setZoom(value[0])}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setZoom(Math.min(300, zoom + 25))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-right">{zoom}%</span>
                </div>
              </div>

              {/* Analysis Checklist */}
              <div className="space-y-3 md:space-y-4">
                {/* Desktop: Scroll list | Mobile: Carousel */}
                
                {/* Desktop view - scroll list with Accordion */}
                <div className="hidden md:block">
                  <ScrollArea className="h-[420px] pr-4">
                    <Accordion type="multiple" defaultValue={currentFindings.map(s => s.category)} className="space-y-2">
                      {currentFindings.map((section) => {
                        const sectionFindings = section.items.filter(item => photos[currentPhotoIndex].findings[item]);
                        const hasFindings = sectionFindings.length > 0;
                        
                        return (
                          <AccordionItem 
                            key={section.category} 
                            value={section.category}
                            className="border border-border rounded-lg overflow-hidden"
                          >
                            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between w-full pr-2">
                                <span className="text-sm font-semibold text-primary">
                                  {section.category}
                                </span>
                                <div className="flex items-center gap-2">
                                  {hasFindings && (
                                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                      {sectionFindings.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <div className="space-y-2 pt-1">
                                {section.items.map((item) => (
                                  <div key={item} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${photos[currentPhotoIndex].id}-${item}-desktop`}
                                      checked={photos[currentPhotoIndex].findings[item] || false}
                                      onCheckedChange={(checked) =>
                                        handleFindingChange(item, checked as boolean)
                                      }
                                      className="h-4 w-4"
                                    />
                                    <label
                                      htmlFor={`${photos[currentPhotoIndex].id}-${item}-desktop`}
                                      className="text-xs text-foreground cursor-pointer leading-tight"
                                    >
                                      {item}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </ScrollArea>
                </div>

                {/* Mobile view - Carousel */}
                <div className="block md:hidden">
                  {currentFindings.length > 0 && (
                    <div className="space-y-3">
                      {/* Carousel navigation header */}
                      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1))}
                          disabled={currentCategoryIndex === 0}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        
                        <div className="text-center flex-1">
                          <h4 className="text-xs font-semibold text-primary">
                            {currentFindings[currentCategoryIndex]?.category}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {currentCategoryIndex + 1} de {currentFindings.length}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCurrentCategoryIndex(Math.min(currentFindings.length - 1, currentCategoryIndex + 1))}
                          disabled={currentCategoryIndex === currentFindings.length - 1}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Carousel dots indicator */}
                      <div className="flex justify-center gap-1.5">
                        {currentFindings.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentCategoryIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentCategoryIndex 
                                ? "bg-cyan-500 w-4" 
                                : "bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Current category items */}
                      <div className="bg-muted/20 rounded-lg p-3 min-h-[140px]">
                        <div className="space-y-2.5">
                          {currentFindings[currentCategoryIndex]?.items.map((item) => (
                            <div key={item} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${photos[currentPhotoIndex].id}-${item}-mobile`}
                                checked={photos[currentPhotoIndex].findings[item] || false}
                                onCheckedChange={(checked) =>
                                  handleFindingChange(item, checked as boolean)
                                }
                                className="h-5 w-5"
                              />
                              <label
                                htmlFor={`${photos[currentPhotoIndex].id}-${item}-mobile`}
                                className="text-xs text-foreground cursor-pointer leading-tight"
                              >
                                {item}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2 block">
                    Observações adicionais
                  </label>
                  <textarea
                    className="w-full h-[60px] md:h-[80px] p-2 md:p-3 border border-border rounded-lg bg-background text-foreground text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Digite observações adicionais..."
                    value={photos[currentPhotoIndex].observations}
                    onChange={(e) => handleObservationsChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4 md:mt-6">
              <Button variant="outline" onClick={goToPreviousPhoto} size="sm">
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1" /> <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button onClick={goToNextPhoto} size="sm">
                {currentPhotoIndex < photos.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">Próximo</span> <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Ver Resumo</span> <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {step === "summary" && (
          <Card className="p-4 md:p-6">
            <h2 className="text-sm md:text-base font-semibold mb-3 md:mb-4 text-foreground">
              Resumo da Avaliação Postural
            </h2>

            <ScrollArea className="h-[calc(100vh-200px)] md:h-[calc(100vh-280px)]">
              {/* Seleção de Avaliações para Comparação */}
              {savedAssessments.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <div className="flex flex-wrap gap-2 md:gap-3 mb-2 md:mb-3">
                    {savedAssessments.map((assessment, index) => {
                      const isSelected = selectedComparisonIds.includes(assessment.id);
                      return (
                        <button
                          key={assessment.id}
                          onClick={() => toggleComparisonSelection(assessment.id)}
                          className={`px-3 py-2 md:px-6 md:py-4 rounded-lg border-2 transition-all min-w-[80px] md:min-w-[140px] ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border hover:border-primary/50"
                          }`}
                        >
                          <p className={`text-[10px] md:text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {formatMonthName(assessment.date)}
                          </p>
                          <p className={`text-lg md:text-2xl font-bold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                            {index + 1}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    {selectedComparisonIds.length}/{savedAssessments.length} avaliações selecionadas para comparação.
                  </p>
                </div>
              )}

              {/* Comparativo de Fotos */}
              {selectedComparisonIds.length >= 2 && (
                <div className="border border-border rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <h3 className="text-xs md:text-sm font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
                    <Camera className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    Comparativo de Fotos
                  </h3>
                  
                  {["frente", "costas", "lado-direito", "lado-esquerdo"].map((viewId) => {
                    const viewLabel = viewId === "frente" ? "Visão Frontal" 
                      : viewId === "costas" ? "Visão Posterior"
                      : viewId === "lado-direito" ? "Visão Lateral Direita"
                      : "Visão Lateral Esquerda";
                    
                    const selectedAssessmentsData = getSelectedComparisonAssessments();
                    
                    return (
                      <div key={viewId} className="mb-4 md:mb-6 last:mb-0">
                        <h4 className="text-xs md:text-sm font-medium text-foreground mb-2 md:mb-3">{viewLabel}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          {selectedAssessmentsData.map((assessment) => {
                            const photo = assessment.photos.find(p => p.id === viewId);
                            const findings = photo ? getSelectedFindings(photo) : [];
                            
                            return (
                              <div key={assessment.id} className="space-y-1 md:space-y-2">
                                <p className="text-[10px] md:text-xs text-muted-foreground text-center">
                                  {assessment.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                </p>
                                <div className="aspect-[3/4] bg-muted/50 rounded-lg flex items-center justify-center border border-border">
                                  {photo?.preview ? (
                                    <img
                                      src={photo.preview}
                                      alt={viewLabel}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="text-center text-muted-foreground p-2 md:p-4">
                                      <Camera className="w-5 h-5 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 opacity-50" />
                                      <p className="text-[10px] md:text-xs">Sem foto</p>
                                    </div>
                                  )}
                                </div>
                                {findings.length > 0 && (
                                  <div className="text-[10px] md:text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground mb-0.5 md:mb-1">Desvios:</p>
                                    <ul className="space-y-0.5">
                                      {findings.map(f => (
                                        <li key={f} className="flex items-start gap-0.5 md:gap-1">
                                          <span className="text-primary">•</span>
                                          <span className="line-clamp-2">{f}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fotos e Desvios da Avaliação Atual */}
              <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6">
                {photos.map((photo) => {
                  const selectedFindings = getSelectedFindings(photo);
                  return (
                    <div key={photo.id} className="border border-border rounded-lg p-3 md:p-4">
                      <div className="flex gap-3 md:gap-4 mb-2 md:mb-3">
                        {photo.preview ? (
                          <img
                            src={photo.preview}
                            alt={photo.label}
                            className="w-16 h-16 md:w-24 md:h-24 object-cover rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-24 md:h-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <Camera className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs md:text-sm font-medium text-foreground mb-1 md:mb-2">{photo.label}</h4>
                          {selectedFindings.length > 0 ? (
                            <ul className="text-[10px] md:text-xs text-muted-foreground space-y-0.5 md:space-y-1">
                              {selectedFindings.map((finding) => (
                                <li key={finding} className="flex items-start gap-1">
                                  <span className="text-primary flex-shrink-0">•</span>
                                  <span className="line-clamp-2">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[10px] md:text-xs text-muted-foreground">Sem alterações identificadas</p>
                          )}
                          {photo.observations && (
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2 italic line-clamp-2">
                              Obs: {photo.observations}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Músculos Encurtados e Alongados */}
                      {selectedFindings.length > 0 && (
                        <div className="border-t border-border pt-2 md:pt-3 mt-2 md:mt-3">
                          <h5 className="text-[10px] md:text-xs font-semibold text-foreground mb-1.5 md:mb-2">
                            Análise Muscular
                          </h5>
                          {selectedFindings.map((finding) => {
                            const muscles = getMusclesForFinding(finding, photo.id);
                            if (!muscles) return null;
                            return (
                              <div key={finding} className="mb-2 md:mb-3 last:mb-0">
                                <p className="text-[10px] md:text-xs font-medium text-primary mb-1">{finding}</p>
                                <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[10px] md:text-xs">
                                  <div className="bg-red-500/10 rounded p-1.5 md:p-2">
                                    <p className="font-medium text-red-400 mb-0.5 md:mb-1">Encurtados:</p>
                                    <ul className="text-muted-foreground space-y-0.5">
                                      {muscles.encurtados.map((m, i) => (
                                        <li key={i} className="line-clamp-1">• {m}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="bg-green-500/10 rounded p-1.5 md:p-2">
                                    <p className="font-medium text-green-400 mb-0.5 md:mb-1">Alongados:</p>
                                    <ul className="text-muted-foreground space-y-0.5">
                                      {muscles.alongados.map((m, i) => (
                                        <li key={i} className="line-clamp-1">• {m}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumo Geral de Músculos */}
              {(() => {
                const allEncurtados = new Set<string>();
                const allAlongados = new Set<string>();
                
                photos.forEach((photo) => {
                  const selectedFindings = getSelectedFindings(photo);
                  selectedFindings.forEach((finding) => {
                    const muscles = getMusclesForFinding(finding, photo.id);
                    if (muscles) {
                      muscles.encurtados.forEach(m => allEncurtados.add(m));
                      muscles.alongados.forEach(m => allAlongados.add(m));
                    }
                  });
                });

                if (allEncurtados.size === 0 && allAlongados.size === 0) return null;

                return (
                  <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Resumo Geral - Músculos Afetados
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          Músculos Encurtados ({allEncurtados.size})
                        </h5>
                        <ul className="text-xs text-muted-foreground space-y-1 columns-1 md:columns-2">
                          {Array.from(allEncurtados).map((m, i) => (
                            <li key={i} className="break-inside-avoid">• {m}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Músculos Alongados ({allAlongados.size})
                        </h5>
                        <ul className="text-xs text-muted-foreground space-y-1 columns-1 md:columns-2">
                          {Array.from(allAlongados).map((m, i) => (
                            <li key={i} className="break-inside-avoid">• {m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-foreground mb-2">Conclusão Geral</h4>
                <textarea
                  className="w-full h-[100px] p-3 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Digite a conclusão geral da avaliação postural..."
                  value={generalConclusion}
                  onChange={(e) => setGeneralConclusion(e.target.value)}
                />
              </div>
            </ScrollArea>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("analysis");
                  setCurrentPhotoIndex(photos.length - 1);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button onClick={onClose}>Finalizar Avaliação</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PosturalAssessmentComponent;
