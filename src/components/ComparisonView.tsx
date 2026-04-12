import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { X, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Assessment {
  id: string;
  date: Date;
  clientData: any;
  perimetryData: any;
  skinfoldData: any;
  diameterData: any;
}

interface ComparisonViewProps {
  assessments: Assessment[];
  showComparison: boolean;
  onToggleComparison: () => void;
  onSelectAssessment: (assessmentId: string) => void;
}

export function ComparisonView({ assessments, showComparison, onToggleComparison, onSelectAssessment }: ComparisonViewProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const toggleDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const exists = selectedDates.find(d => format(d, "yyyy-MM-dd") === dateStr);

    if (exists) {
      setSelectedDates(selectedDates.filter(d => format(d, "yyyy-MM-dd") !== dateStr));
    } else if (selectedDates.length < 4) {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(d => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));
  };

  const selectedAssessments = assessments.filter(assessment =>
    selectedDates.some(date =>
      format(date, "yyyy-MM-dd") === format(assessment.date, "yyyy-MM-dd")
    )
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Ordenar avaliações por data
  const sortedAssessments = [...assessments].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Definição das medidas de perimetria
  const perimetryMeasurements = [
    { key: "shoulder", label: "Ombro" },
    { key: "chest", label: "Tórax" },
    { key: "waist", label: "Cintura" },
    { key: "abdomen", label: "Abdômen" },
    { key: "hip", label: "Quadril" },
    { key: "rightArmRelaxed", label: "Braço D. Relaxado" },
    { key: "rightArmContracted", label: "Braço D. Contraído" },
    { key: "leftArmRelaxed", label: "Braço E. Relaxado" },
    { key: "leftArmContracted", label: "Braço E. Contraído" },
    { key: "rightForearm", label: "Antebraço D." },
    { key: "leftForearm", label: "Antebraço E." },
    { key: "rightProximalThigh", label: "Coxa D. Proximal" },
    { key: "rightMedialThigh", label: "Coxa D. Medial" },
    { key: "leftProximalThigh", label: "Coxa E. Proximal" },
    { key: "leftMedialThigh", label: "Coxa E. Medial" },
    { key: "rightCalf", label: "Panturrilha D." },
    { key: "leftCalf", label: "Panturrilha E." },
  ];

  // Definição das medidas de dobras cutâneas
  const skinfoldMeasurements = [
    { key: "subscapular", label: "Subescapular" },
    { key: "biceps", label: "Bíceps" },
    { key: "triceps", label: "Tríceps" },
    { key: "midaxillary", label: "Axilar Média" },
    { key: "suprailiac", label: "Suprailíaca" },
    { key: "thigh", label: "Coxa" },
    { key: "abdominal", label: "Abdominal" },
    { key: "anteriorThigh", label: "Coxa Anterior" },
    { key: "calf", label: "Panturrilha" },
  ];

  // Definição das medidas de diâmetros
  const diameterMeasurements = [
    { key: "wrist", label: "Punho" },
    { key: "femur", label: "Fêmur" },
    { key: "humerus", label: "Úmero" },
  ];

  const calculateDifference = (current: string, previous: string) => {
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    const diff = curr - prev;
    if (diff === 0) return null;
    return {
      value: Math.abs(diff).toFixed(1),
      isPositive: diff > 0
    };
  };

  // Calcular % gordura para cada avaliação usando Jackson & Pollock 7 dobras
  const calculateFatPercentage = (assessment: Assessment) => {
    const sum =
      (parseFloat(assessment.skinfoldData?.chest) || 0) +
      (parseFloat(assessment.skinfoldData?.midaxillary) || 0) +
      (parseFloat(assessment.skinfoldData?.triceps) || 0) +
      (parseFloat(assessment.skinfoldData?.subscapular) || 0) +
      (parseFloat(assessment.skinfoldData?.abdominal) || 0) +
      (parseFloat(assessment.skinfoldData?.suprailiac) || 0) +
      (parseFloat(assessment.skinfoldData?.thigh) || 0);

    const age = parseFloat(assessment.clientData?.age) || 30;
    const sex = assessment.clientData?.sex || "M";

    if (sum <= 0) return 0;

    let DC = 0;
    if (sex === "M") {
      DC = 1.112 - (0.00043499 * sum) + (0.00000055 * Math.pow(sum, 2)) - (0.00028826 * age);
    } else {
      DC = 1.097 - (0.00046971 * sum) + (0.00000056 * Math.pow(sum, 2)) - (0.00012828 * age);
    }

    return Math.max(0, (495 / DC) - 450);
  };

  return (
    <Card className="p-4 md:p-6 shadow-elevated">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base md:text-lg font-bold text-foreground">
          Avaliações ({assessments.length})
        </h3>
        <div className="flex items-center gap-3">
          <Label htmlFor="compare-mode" className="text-sm font-medium text-foreground">
            Comparar
          </Label>
          <Switch
            id="compare-mode"
            checked={showComparison}
            onCheckedChange={onToggleComparison}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {showComparison && (
        <p className="text-xs text-muted-foreground mb-4">
          Selecione até 4 datas para comparar ({selectedDates.length}/4 selecionadas)
        </p>
      )}

      {/* Cards de avaliações com % gordura em destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {sortedAssessments.map((assessment) => {
          const isSelected = isDateSelected(assessment.date);
          const monthYear = format(assessment.date, "MMM. 'De' yy", { locale: ptBR });
          const fatPercentage = calculateFatPercentage(assessment);

          return (
            <button
              key={assessment.id}
              onClick={() => {
                if (showComparison) {
                  toggleDate(assessment.date);
                } else {
                  onSelectAssessment(assessment.id);
                }
              }}
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
              <span className={`text-xs md:text-sm font-medium capitalize mb-2 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {monthYear}
              </span>
              <span className={`text-3xl md:text-4xl font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                {fatPercentage.toFixed(0)}
                <span className="text-lg md:text-xl">%</span>
              </span>
              <span className={`text-xs md:text-sm mt-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                Gordura
              </span>
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedDates.map((date) => (
            <div
              key={date.toISOString()}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
            >
              {format(date, "dd/MM/yy")}
              <button
                onClick={() => toggleDate(date)}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showComparison && selectedAssessments.length >= 2 && (
        <div className="mt-4 space-y-3">
          <Tabs defaultValue="perimetry" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="perimetry" className="text-xs md:text-sm">Perimetria</TabsTrigger>
              <TabsTrigger value="skinfold" className="text-xs md:text-sm">Dobras</TabsTrigger>
              <TabsTrigger value="diameter" className="text-xs md:text-sm">Diâmetros</TabsTrigger>
            </TabsList>

            {/* Perimetria */}
            <TabsContent value="perimetry" className="mt-3">
              <div className="bg-muted/20 rounded-lg p-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Medida</th>
                      {selectedAssessments.map((assessment, idx) => (
                        <th key={assessment.id} className="text-center py-2 px-2 font-semibold">
                          <div className="text-xs text-muted-foreground">
                            {format(assessment.date, "dd/MM/yy")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">(cm)</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perimetryMeasurements.map((measurement) => (
                      <tr key={measurement.key} className="border-b border-border/50">
                        <td className="py-2 px-2 text-foreground">{measurement.label}</td>
                        {selectedAssessments.map((assessment, idx) => {
                          const value = assessment.perimetryData[measurement.key] || "-";
                          const prevValue = idx > 0 ? selectedAssessments[idx - 1].perimetryData[measurement.key] : null;
                          const diff = prevValue ? calculateDifference(value, prevValue) : null;

                          return (
                            <td key={assessment.id} className="text-center py-2 px-2">
                              <div className="font-medium text-foreground">{value}</div>
                              {diff && (
                                <div className={`text-xs ${diff.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff.isPositive ? '+' : '-'}{diff.value}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Dobras Cutâneas */}
            <TabsContent value="skinfold" className="mt-3">
              <div className="bg-muted/20 rounded-lg p-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Medida</th>
                      {selectedAssessments.map((assessment) => (
                        <th key={assessment.id} className="text-center py-2 px-2 font-semibold">
                          <div className="text-xs text-muted-foreground">
                            {format(assessment.date, "dd/MM/yy")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">(mm)</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {skinfoldMeasurements.map((measurement) => (
                      <tr key={measurement.key} className="border-b border-border/50">
                        <td className="py-2 px-2 text-foreground">{measurement.label}</td>
                        {selectedAssessments.map((assessment, idx) => {
                          const value = assessment.skinfoldData[measurement.key] || "-";
                          const prevValue = idx > 0 ? selectedAssessments[idx - 1].skinfoldData[measurement.key] : null;
                          const diff = prevValue ? calculateDifference(value, prevValue) : null;

                          return (
                            <td key={assessment.id} className="text-center py-2 px-2">
                              <div className="font-medium text-foreground">{value}</div>
                              {diff && (
                                <div className={`text-xs ${diff.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                                  {diff.isPositive ? '+' : '-'}{diff.value}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Diâmetros */}
            <TabsContent value="diameter" className="mt-3">
              <div className="bg-muted/20 rounded-lg p-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Medida</th>
                      {selectedAssessments.map((assessment) => (
                        <th key={assessment.id} className="text-center py-2 px-2 font-semibold">
                          <div className="text-xs text-muted-foreground">
                            {format(assessment.date, "dd/MM/yy")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">(cm)</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {diameterMeasurements.map((measurement) => (
                      <tr key={measurement.key} className="border-b border-border/50">
                        <td className="py-2 px-2 text-foreground">{measurement.label}</td>
                        {selectedAssessments.map((assessment, idx) => {
                          const value = assessment.diameterData[measurement.key] || "-";
                          const prevValue = idx > 0 ? selectedAssessments[idx - 1].diameterData[measurement.key] : null;
                          const diff = prevValue ? calculateDifference(value, prevValue) : null;

                          return (
                            <td key={assessment.id} className="text-center py-2 px-2">
                              <div className="font-medium text-foreground">{value}</div>
                              {diff && (
                                <div className={`text-xs ${diff.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff.isPositive ? '+' : '-'}{diff.value}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Gráficos Comparativos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Evolução da Composição Corporal</h4>

            {(() => {
              // Calcular dados para os gráficos
              const chartData = selectedAssessments.map((assessment) => {
                const weight = parseFloat(assessment.clientData?.weight) || 0;
                // Atualizando para usar JP7 garantindo consistência
                const fatPercentage = calculateFatPercentage(assessment);
                const fatMass = weight * (fatPercentage / 100);
                const leanMass = weight - fatMass;
                const residualMass = weight * 0.09;
                const muscularMass = leanMass - residualMass - (weight * 0.12);

                return {
                  date: format(assessment.date, "dd/MM/yy"),
                  gordura: parseFloat(fatMass.toFixed(1)),
                  muscular: parseFloat(muscularMass.toFixed(1)),
                  residual: parseFloat(residualMass.toFixed(1)),
                };
              });

              return (
                <div className="bg-muted/20 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        label={{ value: 'kg', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value} kg`]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        iconType="circle"
                      />
                      <Line
                        type="monotone"
                        dataKey="gordura"
                        name="Gordura"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="muscular"
                        name="Muscular"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="residual"
                        name="Residual"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>

          <Button className="w-full" size="sm">
            <FileDown className="w-3 h-3 mr-2" />
            Exportar Comparação PDF
          </Button>
        </div>
      )}

      {showComparison && selectedAssessments.length > 0 && selectedAssessments.length < 2 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Selecione pelo menos 2 datas
        </p>
      )}

      {showComparison && selectedDates.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Ative o modo Comparar e selecione as datas
        </p>
      )}
    </Card>
  );
}