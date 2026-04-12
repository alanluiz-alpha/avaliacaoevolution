import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SkinfoldData } from "./MeasurementTabs";

interface SkinfoldFormProps {
  data: SkinfoldData;
  onChange: (data: SkinfoldData) => void;
  clientAge?: number;
  clientSex?: string;
}

export function SkinfoldForm({ data, onChange, clientAge = 25, clientSex = "M" }: SkinfoldFormProps) {
  const [protocol, setProtocol] = useState("jackson-pollock-7");
  const [population, setPopulation] = useState("adult");

  const handleChange = (field: keyof SkinfoldData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Soma de TODAS as dobras (para referência)
  const calculateSum = () => {
    const values = Object.values(data).map(v => parseFloat(v) || 0);
    return values.reduce((sum, val) => sum + val, 0).toFixed(1);
  };

  // Soma apenas das 7 dobras do protocolo Jackson & Pollock
  const calculateSumJP7 = () => {
    const jp7Folds = ['chest', 'midaxillary', 'triceps', 'subscapular', 'abdominal', 'suprailiac', 'thigh'];
    const sum = jp7Folds.reduce((total, key) => {
      return total + (parseFloat(data[key as keyof SkinfoldData]) || 0);
    }, 0);
    return sum;
  };

  // Soma das dobras do protocolo ISAK 8
  const calculateSumISAK8 = () => {
    const isak8Folds: (keyof SkinfoldData)[] = ['triceps', 'subscapular', 'biceps', 'iliacCrest', 'supraspinale', 'abdominal', 'thigh', 'calf'];
    return isak8Folds.reduce((total, key) => total + (parseFloat(data[key]) || 0), 0);
  };

  const calculateBodyFat = (age: number, sex: string) => {
    const sumJP7 = calculateSumJP7();
    const sumISAK8 = calculateSumISAK8();
    
    if (!age) return "—";

    // ISAK 8 dobras - usa equação de Durnin & Womersley com log10 da soma
    if (protocol === "isak-8" && sumISAK8 > 0) {
      const logSum = Math.log10(sumISAK8);
      let DC: number;
      if (sex === "M") {
        DC = 1.1765 - (0.0744 * logSum);
      } else {
        DC = 1.1567 - (0.0717 * logSum);
      }
      const bodyFat = (495 / DC) - 450;
      return bodyFat.toFixed(1);
    }

    if (!sumJP7) return "—";

    // Jackson & Pollock 7 dobras - Masculino
    if (sex === "M" && protocol === "jackson-pollock-7") {
      const DC = 1.112 - (0.00043499 * sumJP7) + (0.00000055 * Math.pow(sumJP7, 2)) - (0.00028826 * age);
      const bodyFat = (495 / DC) - 450;
      return bodyFat.toFixed(1);
    }
    
    // Jackson & Pollock 7 dobras - Feminino
    if (sex === "F" && protocol === "jackson-pollock-7") {
      const DC = 1.097 - (0.00046971 * sumJP7) + (0.00000056 * Math.pow(sumJP7, 2)) - (0.00012828 * age);
      const bodyFat = (495 / DC) - 450;
      return bodyFat.toFixed(1);
    }

    return "—";
  };

  const measurements = [
    { label: "Subscapular", field: "subscapular" as keyof SkinfoldData },
    { label: "Tricipital", field: "triceps" as keyof SkinfoldData },
    { label: "Bicipital", field: "biceps" as keyof SkinfoldData },
    { label: "Peitoral", field: "chest" as keyof SkinfoldData },
    { label: "Axilar-média", field: "midaxillary" as keyof SkinfoldData },
    { label: "Supra-ilíaca", field: "suprailiac" as keyof SkinfoldData },
    { label: "Crista Ilíaca", field: "iliacCrest" as keyof SkinfoldData },
    { label: "Supraspinale", field: "supraspinale" as keyof SkinfoldData },
    { label: "Abdominal", field: "abdominal" as keyof SkinfoldData },
    { label: "Coxa", field: "thigh" as keyof SkinfoldData },
    { label: "Panturrilha", field: "calf" as keyof SkinfoldData },
  ];

  const getRequiredFolds = (protocolValue: string): (keyof SkinfoldData)[] => {
    const protocolFolds: Record<string, (keyof SkinfoldData)[]> = {
      // Adultos
      "jackson-pollock-3": ["chest", "abdominal", "thigh"],
      "durnin-womersley-4": ["biceps", "triceps", "subscapular", "suprailiac"],
      "jackson-pollock-7": ["chest", "midaxillary", "triceps", "subscapular", "abdominal", "suprailiac", "thigh"],
      "isak-8": ["triceps", "subscapular", "biceps", "iliacCrest", "supraspinale", "abdominal", "thigh", "calf"],
      "guedes-8": ["triceps", "subscapular", "suprailiac", "calf", "thigh", "abdominal", "midaxillary", "chest"],
      "faulkner-9": ["triceps", "subscapular", "suprailiac", "abdominal", "thigh", "chest", "midaxillary", "calf", "biceps"],
      
      // Crianças e Adolescentes
      "slaughter-2": ["triceps", "subscapular"],
      "deurenberg-3": ["triceps", "subscapular", "suprailiac", "biceps"],
      "lohman-child": ["triceps", "calf", "subscapular"],
      
      // Idosos
      "durnin-elderly": ["biceps", "triceps", "subscapular", "suprailiac"],
      "visser-2": ["triceps", "subscapular"],
      "guedes-elderly": ["triceps", "subscapular", "suprailiac", "abdominal", "thigh", "calf"],
      
      // Obesos
      "sloan-weir-2": ["subscapular", "suprailiac"],
      "lohman-obese": ["subscapular", "suprailiac", "thigh"],
      "petroski-7": ["subscapular", "triceps", "suprailiac", "abdominal", "thigh", "calf", "midaxillary"],
    };
    
    return protocolFolds[protocolValue] || [];
  };

  const requiredFolds = getRequiredFolds(protocol);
  const isFieldRequired = (field: keyof SkinfoldData) => requiredFolds.includes(field);

  const getProtocolsByPopulation = () => {
    const protocols = {
      adult: [
        { value: "jackson-pollock-3", label: "Jackson & Pollock (3 dobras)" },
        { value: "durnin-womersley-4", label: "Durnin & Womersley (4 dobras)" },
        { value: "jackson-pollock-7", label: "Jackson & Pollock (7 dobras)" },
        { value: "isak-8", label: "ISAK (8 dobras)" },
        { value: "guedes-8", label: "Guedes & Guedes (8 dobras)" },
        { value: "faulkner-9", label: "Faulkner (9 dobras)" },
      ],
      child: [
        { value: "slaughter-2", label: "Slaughter et al. (2 dobras)" },
        { value: "deurenberg-3", label: "Deurenberg et al. (3 ou 4 dobras)" },
        { value: "lohman-child", label: "Lohman (2 ou 3 dobras)" },
      ],
      elderly: [
        { value: "durnin-elderly", label: "Durnin & Womersley (4 dobras - adaptado)" },
        { value: "visser-2", label: "Visser et al. (2 dobras)" },
        { value: "guedes-elderly", label: "Guedes & Guedes (versão idoso)" },
      ],
      obese: [
        { value: "sloan-weir-2", label: "Sloan & Weir (2 dobras)" },
        { value: "lohman-obese", label: "Lohman (3 dobras)" },
        { value: "petroski-7", label: "Petroski (7 dobras)" },
      ],
    };
    return protocols[population as keyof typeof protocols] || protocols.adult;
  };

  return (
    <div className="space-y-6">
      {/* Seção: Seleção de Protocolo */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-1">Seleção de Protocolo</h3>
        <p className="text-sm text-muted-foreground mb-4">Escolha o público-alvo e o protocolo para destacar as medidas necessárias.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="population">Público-Alvo</Label>
            <Select value={population} onValueChange={setPopulation}>
              <SelectTrigger id="population" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">Adultos Saudáveis</SelectItem>
                <SelectItem value="child">Crianças e Adolescentes</SelectItem>
                <SelectItem value="elderly">Idosos</SelectItem>
                <SelectItem value="obese">Obesos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="protocol">Protocolo de Avaliação</Label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger id="protocol" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getProtocolsByPopulation().map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Seção: Medidas */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Medidas</h3>
        <div className="grid grid-cols-2 gap-4">
          {measurements.map((measurement) => {
            const isRequired = isFieldRequired(measurement.field);
            return (
              <div key={measurement.field}>
                <Label 
                  htmlFor={measurement.field} 
                  className={`text-sm ${isRequired ? "text-primary font-semibold" : "text-muted-foreground"}`}
                >
                  {measurement.label} (mm)
                </Label>
                <Input
                  id={measurement.field}
                  type="number"
                  step="0.1"
                  value={data[measurement.field]}
                  onChange={(e) => handleChange(measurement.field, e.target.value)}
                  placeholder="0.0"
                  className={`mt-1 ${
                    isRequired 
                      ? "border-cyan-500 border-2 bg-cyan-500/10 text-cyan-700 placeholder:text-cyan-400 focus-visible:ring-cyan-500" 
                      : ""
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção: Resultados */}
      <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
        <h3 className="font-semibold text-foreground mb-3">Resultados</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Soma das Dobras (mm)</p>
            <p className="text-2xl font-bold text-foreground">{calculateSum()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">% Gordura</p>
            <p className="text-2xl font-bold text-foreground">
              {calculateBodyFat(clientAge, clientSex)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
