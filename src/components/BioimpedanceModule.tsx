import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft, Save, Download, X, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAssessments } from "@/contexts/AssessmentContext";
import jsPDF from "jspdf";
import balancaSimples from "@/assets/balanca-simples.png";
import balancaCompleta from "@/assets/balanca-completa.png";
import {
  pdfColors,
  formatDate,
  safeNumber,
  drawHeader,
  drawFooter,
  drawSectionTitle,
  drawInfoCard,
  drawTableRow,
  drawHighlightCard,
  drawSignature,
} from "@/utils/pdfStyles";

interface BioimpedanceData {
  // Balança Simples
  peso: string;
  imc: string;
  gorduraCorporal: string;
  musculoEsqueletico: string;
  gorduraVisceral: string;
  taxaMetabolicaBasal: string;
  idadeMetabolica: string;
  massaCorporalMagra: string;
  massaGorduraCorporal: string;
  // Campos adicionais para balança completa - Composição Corporal Geral
  massaMuscularEsqueletica?: string;
  massaGordura?: string;
  aguaCorporalTotal?: string;
  proteinaCorporal?: string;
  mineraisCorporais?: string;
  massaLivreGordura?: string;
  // Análise Segmentar de Massa Magra
  bracoDireitoMagra?: string;
  bracoEsquerdoMagra?: string;
  pernaDireitaMagra?: string;
  pernaEsquerdaMagra?: string;
  troncoMagra?: string;
  // Análise de Gordura Regional
  gorduraTronco?: string;
  gorduraBracoDireito?: string;
  gorduraBracoEsquerdo?: string;
  gorduraPernaDireita?: string;
  gorduraPernaEsquerda?: string;
  // Obesidade
  taxaGorduraVisceral?: string;
  cinturaQuadril?: string;
}

interface BioimpedanceAssessment {
  id: string;
  date: Date;
  balanceType: "simples" | "completa";
  data: BioimpedanceData;
}

interface BioimpedanceModuleProps {
  onClose: () => void;
  clientName?: string;
}

const BioimpedanceModule: React.FC<BioimpedanceModuleProps> = ({ onClose, clientName = "Maria Oliveira" }) => {
  const { toast } = useToast();
  const { 
    assessments: globalAssessments, 
    currentAssessmentId, 
    setCurrentAssessmentId,
    createNewAssessment: createGlobalAssessment,
    updateAssessment,
    getAssessmentById
  } = useAssessments();
  
  const [showBalanceSelector, setShowBalanceSelector] = useState(true);
  const [balanceType, setBalanceType] = useState<"simples" | "completa" | null>(null);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>([]);
  const professionalName = "Personal Jão";

  // Converter avaliações globais para formato de bioimpedância
  const assessments: BioimpedanceAssessment[] = globalAssessments
    .filter(a => a.bioimpedance)
    .map(a => ({
      id: a.id,
      date: a.date,
      balanceType: a.bioimpedance?.balanceType || "simples",
      data: {
        peso: a.bioimpedance?.data?.peso || "",
        imc: a.bioimpedance?.data?.imc || "",
        gorduraCorporal: a.bioimpedance?.data?.gorduraCorporal || "",
        musculoEsqueletico: a.bioimpedance?.data?.musculoEsqueletico || "",
        gorduraVisceral: a.bioimpedance?.data?.gorduraVisceral || "",
        taxaMetabolicaBasal: a.bioimpedance?.data?.taxaMetabolicaBasal || "",
        idadeMetabolica: a.bioimpedance?.data?.idadeMetabolica || "",
        massaCorporalMagra: a.bioimpedance?.data?.massaCorporalMagra || "",
        massaGorduraCorporal: a.bioimpedance?.data?.massaGorduraCorporal || "",
        ...a.bioimpedance?.data
      } as BioimpedanceData
    }));

  // Selecionar primeira avaliação se houver
  useEffect(() => {
    if (assessments.length > 0 && selectedAssessmentIds.length === 0) {
      setSelectedAssessmentIds([assessments[0].id]);
    }
  }, [assessments.length]);
  
  const [formData, setFormData] = useState<BioimpedanceData>({
    peso: "",
    imc: "",
    gorduraCorporal: "",
    musculoEsqueletico: "",
    gorduraVisceral: "",
    taxaMetabolicaBasal: "",
    idadeMetabolica: "",
    massaCorporalMagra: "",
    massaGorduraCorporal: "",
    massaMuscularEsqueletica: "",
    massaGordura: "",
    aguaCorporalTotal: "",
    proteinaCorporal: "",
    mineraisCorporais: "",
    massaLivreGordura: "",
    bracoDireitoMagra: "",
    bracoEsquerdoMagra: "",
    pernaDireitaMagra: "",
    pernaEsquerdaMagra: "",
    troncoMagra: "",
    gorduraTronco: "",
    gorduraBracoDireito: "",
    gorduraBracoEsquerdo: "",
    gorduraPernaDireita: "",
    gorduraPernaEsquerda: "",
    taxaGorduraVisceral: "",
    cinturaQuadril: "",
  });

  const handleSelectBalance = (type: "simples" | "completa") => {
    setBalanceType(type);
    setShowBalanceSelector(false);
  };

  const handleChangeBalance = () => {
    setShowBalanceSelector(true);
  };

  const toggleAssessmentSelection = (id: string) => {
    setSelectedAssessmentIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const formatMonthName = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }).replace(" de ", " De ");
  };

  const handleInputChange = (field: keyof BioimpedanceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const simpleFields = [
    { key: "peso", label: "Peso corporal", unit: "kg" },
    { key: "imc", label: "IMC", unit: "" },
    { key: "gorduraCorporal", label: "Gordura Corporal", unit: "%" },
    { key: "musculoEsqueletico", label: "Músculo Esquelético", unit: "%" },
    { key: "gorduraVisceral", label: "Gordura Visceral", unit: "nível" },
    { key: "taxaMetabolicaBasal", label: "Taxa metabólica basal", unit: "kcal" },
    { key: "idadeMetabolica", label: "Idade metabólica", unit: "anos" },
    { key: "massaCorporalMagra", label: "Massa corporal magra", unit: "kg" },
    { key: "massaGorduraCorporal", label: "Massa de gordura corporal", unit: "kg" },
  ];

  const completeFieldGroups = [
    {
      title: "Composição Corporal Geral",
      fields: [
        { key: "peso", label: "Peso corporal total", unit: "kg" },
        { key: "massaMuscularEsqueletica", label: "Massa muscular esquelética (SMM)", unit: "kg" },
        { key: "massaGordura", label: "Massa de gordura corporal", unit: "kg" },
        { key: "aguaCorporalTotal", label: "Água corporal total (TBW)", unit: "kg" },
        { key: "proteinaCorporal", label: "Proteína corporal", unit: "kg" },
        { key: "mineraisCorporais", label: "Minerais corporais", unit: "kg" },
        { key: "massaLivreGordura", label: "Massa Livre de Gordura (FFM)", unit: "kg" },
      ]
    },
    {
      title: "Análise Segmentar de Massa Magra",
      fields: [
        { key: "bracoDireitoMagra", label: "Braço direito", unit: "kg" },
        { key: "bracoEsquerdoMagra", label: "Braço esquerdo", unit: "kg" },
        { key: "pernaDireitaMagra", label: "Perna direita", unit: "kg" },
        { key: "pernaEsquerdaMagra", label: "Perna esquerda", unit: "kg" },
        { key: "troncoMagra", label: "Tronco", unit: "kg" },
      ]
    },
    {
      title: "Análise de Gordura Regional",
      fields: [
        { key: "gorduraTronco", label: "Gordura tronco", unit: "kg" },
        { key: "gorduraBracoDireito", label: "Gordura do braço direito", unit: "kg" },
        { key: "gorduraBracoEsquerdo", label: "Gordura do braço esquerdo", unit: "kg" },
        { key: "gorduraPernaDireita", label: "Gordura da perna direita", unit: "kg" },
        { key: "gorduraPernaEsquerda", label: "Gordura da perna esquerda", unit: "kg" },
      ]
    },
    {
      title: "Obesidade",
      fields: [
        { key: "imc", label: "IMC", unit: "" },
        { key: "gorduraCorporal", label: "Gordura corporal", unit: "%" },
        { key: "taxaGorduraVisceral", label: "Taxa de gordura visceral (VFA)", unit: "cm²" },
        { key: "cinturaQuadril", label: "Cintura-quadril (WHR)", unit: "" },
      ]
    },
    {
      title: "Metabolismo",
      fields: [
        { key: "taxaMetabolicaBasal", label: "Taxa metabólica basal (TMB)", unit: "kcal" },
      ]
    }
  ];

  const completeFields = completeFieldGroups.flatMap(group => group.fields);

  const currentFields = balanceType === "completa" ? completeFields : simpleFields;

  const getSelectedAssessments = () => {
    return assessments.filter(a => selectedAssessmentIds.includes(a.id));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const { tiffanyGreen, darkText, lightText, bgLight, white, borderColor } = pdfColors;

    const selectedAssessments = getSelectedAssessments();
    const dates = selectedAssessments.map(a => formatDate(a.date));
    const currentFields = balanceType === "completa" ? completeFields : simpleFields;

    // ==================== PÁGINA 1 ====================
    let y = drawHeader(doc, professionalName, `Bioimpedância - ${balanceType === "simples" ? "Balança Simples" : "Completa"}`, 1);

    // === DADOS DO CLIENTE ===
    y = drawSectionTitle(doc, 'DADOS DO CLIENTE', y);

    const cardWidth = (pageWidth - 50) / 3;
    drawInfoCard(doc, 'Cliente', clientName, 20, y, cardWidth * 2 - 5);
    drawInfoCard(doc, 'Data', formatDate(new Date()), 20 + cardWidth * 2, y, cardWidth);

    y += 28;

    // === RESUMO PRINCIPAL ===
    if (selectedAssessments.length > 0) {
      const lastAssessment = selectedAssessments[selectedAssessments.length - 1];
      
      y = drawSectionTitle(doc, 'RESUMO DA AVALIAÇÃO', y);

      const highlightWidth = (pageWidth - 55) / 4;
      
      // Cards de destaque
      drawHighlightCard(doc, '% GORDURA', `${lastAssessment.data.gorduraCorporal || '0'}%`, 20, y, highlightWidth);
      drawInfoCard(doc, 'Peso', `${lastAssessment.data.peso || '0'} kg`, 25 + highlightWidth, y + 5, highlightWidth);
      drawInfoCard(doc, 'IMC', lastAssessment.data.imc || '0', 30 + highlightWidth * 2, y + 5, highlightWidth);
      drawInfoCard(doc, 'Músc. Esquel.', `${lastAssessment.data.musculoEsqueletico || '0'}%`, 35 + highlightWidth * 3, y + 5, highlightWidth);

      y += 38;
    }

    // === TABELA COMPARATIVA ===
    y = drawSectionTitle(doc, 'TABELA COMPARATIVA', y);

    if (balanceType === "completa") {
      // Renderização com grupos
      completeFieldGroups.forEach((group) => {
        // Verificar se precisa de nova página
        if (y > 250) {
          drawFooter(doc, professionalName);
          doc.addPage();
          y = drawHeader(doc, professionalName, `Bioimpedância - Completa`, doc.getNumberOfPages());
        }

        // Título do grupo
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...tiffanyGreen);
        doc.text(group.title, 20, y);
        y += 6;

        const colWidths = [60, ...dates.map(() => (pageWidth - 80) / Math.max(dates.length, 1))];
        y = drawTableRow(doc, ['Parâmetro', ...dates], y, colWidths, true);

        group.fields.forEach((field, i) => {
          const values = selectedAssessments.map(a => {
            const val = a.data[field.key as keyof BioimpedanceData] || '-';
            return `${val}${field.unit ? ` ${field.unit}` : ''}`;
          });
          y = drawTableRow(doc, [field.label, ...values], y, colWidths, false, i % 2 === 0);
        });

        y += 8;
      });
    } else {
      // Tabela simples
      const colWidths = [60, ...dates.map(() => (pageWidth - 80) / Math.max(dates.length, 1))];
      y = drawTableRow(doc, ['Parâmetro', ...dates], y, colWidths, true);

      simpleFields.forEach((field, i) => {
        const values = selectedAssessments.map(a => {
          const val = a.data[field.key as keyof BioimpedanceData] || '-';
          return `${val}${field.unit ? ` ${field.unit}` : ''}`;
        });
        y = drawTableRow(doc, [field.label, ...values], y, colWidths, false, i % 2 === 0);
      });
    }

    // === GRÁFICOS DE EVOLUÇÃO ===
    if (selectedAssessments.length > 1) {
      if (y > 200) {
        drawFooter(doc, professionalName);
        doc.addPage();
        y = drawHeader(doc, professionalName, `Bioimpedância - Evolução`, doc.getNumberOfPages());
      } else {
        y += 10;
      }

      y = drawSectionTitle(doc, 'EVOLUÇÃO COMPARATIVA', y);

      // Gráfico de barras para gordura corporal
      const drawBarChart = (title: string, values: number[], labels: string[], x: number, yPos: number, width: number, height: number) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkText);
        doc.text(title, x + width / 2, yPos, { align: 'center' });

        const chartY = yPos + 5;
        const chartHeight = height - 15;
        const barWidth = (width - 20) / values.length;
        const maxVal = Math.max(...values, 1);

        doc.setFillColor(...bgLight);
        doc.roundedRect(x, chartY, width, chartHeight + 10, 2, 2, 'F');

        values.forEach((val, i) => {
          const barHeight = (val / maxVal) * (chartHeight - 10);
          const barX = x + 10 + i * barWidth + barWidth * 0.15;
          const barY = chartY + chartHeight - barHeight - 5;

          const isImprovement = title.includes('Gordura') ? (i > 0 && val < values[i - 1]) : (i > 0 && val > values[i - 1]);
          doc.setFillColor(isImprovement ? 34 : 100, isImprovement ? 197 : 116, isImprovement ? 94 : 139);

          doc.roundedRect(barX, barY, barWidth * 0.7, barHeight, 1, 1, 'F');

          doc.setFontSize(7);
          doc.setTextColor(...darkText);
          doc.text(safeNumber(val), barX + barWidth * 0.35, barY - 2, { align: 'center' });

          doc.setFontSize(6);
          doc.setTextColor(...lightText);
          const shortLabel = labels[i].split('/').slice(0, 2).join('/');
          doc.text(shortLabel, barX + barWidth * 0.35, chartY + chartHeight + 5, { align: 'center' });
        });
      };

      const chartWidth = (pageWidth - 50) / 2;
      const chartHeight = 45;

      const gorduraValues = selectedAssessments.map(a => parseFloat(a.data.gorduraCorporal) || 0);
      const musculoValues = selectedAssessments.map(a => parseFloat(a.data.musculoEsqueletico) || 0);

      drawBarChart('% Gordura Corporal', gorduraValues, dates, 20, y, chartWidth, chartHeight);
      drawBarChart('% Músculo Esquelético', musculoValues, dates, 25 + chartWidth, y, chartWidth, chartHeight);

      y += chartHeight + 15;
    }

    // === ASSINATURA ===
    if (y > 230) {
      drawFooter(doc, professionalName);
      doc.addPage();
      y = drawHeader(doc, professionalName, 'Bioimpedância', doc.getNumberOfPages());
    }

    y += 20;
    drawSignature(doc, professionalName, 'Personal Trainer', y);

    drawFooter(doc, professionalName);

    // Salvar PDF
    doc.save(`bioimpedancia-${clientName.replace(/\s+/g, '-')}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);

    toast({
      title: "PDF Exportado!",
      description: "Relatório de bioimpedância baixado com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Balance Type Selector Modal */}
      <Dialog open={showBalanceSelector} onOpenChange={setShowBalanceSelector}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Selecione o tipo de balança</DialogTitle>
            <DialogDescription>
              Escolha a balança utilizada para carregar os campos de avaliação correspondentes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => handleSelectBalance("simples")}
              className="flex flex-col items-center p-4 md:p-6 border-2 border-border rounded-xl hover:border-cyan-500 hover:bg-muted/30 transition-all group"
            >
              <div className="w-full aspect-square mb-3 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={balancaSimples} 
                  alt="Balança Simples" 
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <span className="text-sm md:text-base font-medium text-foreground group-hover:text-cyan-500 transition-colors">
                Balança Simples
              </span>
            </button>
            
            <button
              onClick={() => handleSelectBalance("completa")}
              className="flex flex-col items-center p-4 md:p-6 border-2 border-border rounded-xl hover:border-cyan-500 hover:bg-muted/30 transition-all group"
            >
              <div className="w-full aspect-square mb-3 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={balancaCompleta} 
                  alt="Bioimpedância Completa" 
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <span className="text-sm md:text-base font-medium text-foreground group-hover:text-cyan-500 transition-colors text-center">
                Bioimpedância Completa
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col gap-2 p-3 md:p-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div>
            <h1 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1 md:gap-2">
              Bioimpedância
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Resultados para {balanceType === "simples" ? "Balança Simples" : "Bioimpedância Completa"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-0">
          <Button variant="outline" size="sm" className="text-xs">
            <Save className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Salvar Alterações</span>
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={handleExportPDF}>
            <Download className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Gerar Relatório PDF</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-6 max-w-4xl mx-auto">
        {/* Client Name and Balance Change */}
        <Card className="p-3 md:p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <label className="text-[10px] md:text-xs text-muted-foreground">Nome</label>
              <Select defaultValue={clientName}>
                <SelectTrigger className="w-full sm:w-[200px] mt-1">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maria Oliveira">Maria Oliveira</SelectItem>
                  <SelectItem value="João da Silva">João da Silva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="link" 
              className="text-cyan-500 hover:text-cyan-600 p-0 h-auto text-xs"
              onClick={handleChangeBalance}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Trocar Balança
            </Button>
          </div>
        </Card>

        {/* Assessment Moments Selection */}
        <Card className="p-3 md:p-4 mb-4">
          <div className="flex flex-wrap gap-2 md:gap-3 mb-2">
            {assessments.map((assessment, index) => {
              const isSelected = selectedAssessmentIds.includes(assessment.id);
              return (
                <button
                  key={assessment.id}
                  onClick={() => toggleAssessmentSelection(assessment.id)}
                  className={`px-3 py-2 md:px-4 md:py-3 rounded-lg border-2 transition-all min-w-[70px] md:min-w-[100px] ${
                    isSelected
                      ? "bg-cyan-500 border-cyan-500 text-white"
                      : "bg-background border-border hover:border-cyan-500/50"
                  }`}
                >
                  <p className={`text-[9px] md:text-[10px] ${isSelected ? "text-cyan-100" : "text-muted-foreground"}`}>
                    {formatMonthName(assessment.date)}
                  </p>
                  <p className={`text-lg md:text-xl font-bold ${isSelected ? "text-white" : "text-foreground"}`}>
                    {index + 1}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] md:text-xs text-cyan-500">
            {selectedAssessmentIds.length}/{assessments.length} avaliações selecionadas para comparação.
          </p>
        </Card>

        {/* Comparative Table */}
        <Card className="p-3 md:p-4">
          <h3 className="text-sm md:text-base font-semibold text-foreground mb-4">
            Tabela Comparativa de Bioimpedância
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs md:text-sm font-medium text-cyan-500">
                    Parâmetro
                  </th>
                  {getSelectedAssessments().map((assessment) => (
                    <th key={assessment.id} className="text-center py-2 text-xs md:text-sm font-medium text-muted-foreground min-w-[100px]">
                      {assessment.date.toLocaleDateString("pt-BR")}
                    </th>
                  ))}
                  {selectedAssessmentIds.length === 0 && (
                    <th className="text-center py-2 text-xs md:text-sm font-medium text-muted-foreground min-w-[100px]">
                      Nova Avaliação
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {balanceType === "completa" ? (
                  // Renderização com grupos para bioimpedância completa
                  completeFieldGroups.map((group) => (
                    <React.Fragment key={group.title}>
                      <tr>
                        <td colSpan={getSelectedAssessments().length + 1 || 2} className="pt-4 pb-2">
                          <span className="text-xs md:text-sm font-semibold text-cyan-500">
                            {group.title}
                          </span>
                        </td>
                      </tr>
                      {group.fields.map((field) => (
                        <tr key={field.key} className="border-b border-border/50">
                          <td className="py-3 text-xs md:text-sm text-foreground">
                            {field.label} {field.unit && <span className="text-muted-foreground text-[10px]">({field.unit})</span>}
                          </td>
                          {getSelectedAssessments().map((assessment) => (
                            <td key={assessment.id} className="text-center py-3">
                              <Input
                                type="text"
                                value={assessment.data[field.key as keyof BioimpedanceData] || "-"}
                                className="w-20 md:w-24 mx-auto text-center text-xs md:text-sm h-8"
                                readOnly
                              />
                            </td>
                          ))}
                          {selectedAssessmentIds.length === 0 && (
                            <td className="text-center py-3">
                              <Input
                                type="text"
                                value={formData[field.key as keyof BioimpedanceData] || ""}
                                onChange={(e) => handleInputChange(field.key as keyof BioimpedanceData, e.target.value)}
                                className="w-20 md:w-24 mx-auto text-center text-xs md:text-sm h-8"
                                placeholder="-"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  // Renderização simples para balança simples
                  currentFields.map((field) => (
                    <tr key={field.key} className="border-b border-border/50">
                      <td className="py-3 text-xs md:text-sm text-foreground">
                        {field.label} {field.unit && <span className="text-muted-foreground text-[10px]">({field.unit})</span>}
                      </td>
                      {getSelectedAssessments().map((assessment) => (
                        <td key={assessment.id} className="text-center py-3">
                          <Input
                            type="text"
                            value={assessment.data[field.key as keyof BioimpedanceData] || "-"}
                            className="w-20 md:w-24 mx-auto text-center text-xs md:text-sm h-8"
                            readOnly
                          />
                        </td>
                      ))}
                      {selectedAssessmentIds.length === 0 && (
                        <td className="text-center py-3">
                          <Input
                            type="text"
                            value={formData[field.key as keyof BioimpedanceData] || ""}
                            onChange={(e) => handleInputChange(field.key as keyof BioimpedanceData, e.target.value)}
                            className="w-20 md:w-24 mx-auto text-center text-xs md:text-sm h-8"
                            placeholder="-"
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BioimpedanceModule;
