import { Card } from "./ui/card";

interface ResultsDashboardProps {
  weight: string;
  bodyFatPercentage: number;
  measurementType?: "perimetry" | "skinfold" | "diameter";
  sex: string;
}

export function ResultsDashboard({ weight, bodyFatPercentage, measurementType = "perimetry", sex }: ResultsDashboardProps) {
  const weightNum = parseFloat(weight) || 0;
  const fatPercentage = bodyFatPercentage || 0;

  const fatMass = (weightNum * fatPercentage) / 100;
  const leanMass = weightNum - fatMass;
  const boneMass = weightNum * 0.15; // Aproximação ~15% do peso
  const muscularMass = leanMass - boneMass - (weightNum * 0.09); // Descontando massa residual

  const getBodyFatClassification = (percentage: number, sex: string = "M") => {
    if (percentage === 0) return "-";
    if (sex === "M") {
      if (percentage < 6) return "Essencial";
      if (percentage < 14) return "Atleta";
      if (percentage < 18) return "Fitness";
      if (percentage < 25) return "Aceitável";
      return "Obesidade";
    } else {
      if (percentage < 14) return "Essencial";
      if (percentage < 21) return "Atleta";
      if (percentage < 25) return "Fitness";
      if (percentage < 32) return "Aceitável";
      return "Obesidade";
    }
  };

  const getIMCClassification = (weight: number, height: number) => {
    if (!weight || !height) return "-";
    const imc = weight / Math.pow(height / 100, 2);
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Normal";
    if (imc < 30) return "Sobrepeso";
    return "Obesidade";
  };

  const idealWeight = weightNum > 0 ? (leanMass / (1 - 0.15)).toFixed(1) : "-";
  const fatLossNeeded = fatPercentage > 15 ? (fatMass - (weightNum * 0.15)).toFixed(1) : "0.0";

  const residualMass = weightNum * 0.09;

  return (
    <div className="space-y-4">
      {/* Mass Cards */}
      <div className="space-y-3">
        <Card className="p-4 shadow-card bg-card">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1">GORDURA</h3>
          <p className="text-2xl font-bold text-foreground">{fatPercentage.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">{fatMass.toFixed(1)} kg</p>
        </Card>

        <Card className="p-4 shadow-card bg-card">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1">MUSCULAR</h3>
          <p className="text-2xl font-bold text-foreground">{muscularMass.toFixed(1)} kg</p>
          <p className="text-sm text-muted-foreground">
            {weightNum > 0 ? ((muscularMass / weightNum) * 100).toFixed(1) : "0.0"}%
          </p>
        </Card>

        <Card className="p-4 shadow-card bg-card">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1">RESIDUAL</h3>
          <p className="text-2xl font-bold text-foreground">{residualMass.toFixed(1)} kg</p>
          <p className="text-sm text-muted-foreground">
            {weightNum > 0 ? ((residualMass / weightNum) * 100).toFixed(1) : "0.0"}%
          </p>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card className="p-4 shadow-card bg-muted/30">
        <h3 className="font-semibold text-foreground mb-3 text-sm">RESULTADOS</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Classificação % Gordura:</span>
            <span className="font-medium text-foreground">
              {getBodyFatClassification(fatPercentage, sex)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Classificação IMC:</span>
            <span className="font-medium text-foreground">-</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Massa gorda (kg / %):</span>
            <span className="font-medium text-foreground">
              {weightNum > 0 ? `${fatMass.toFixed(1)} kg / ${fatPercentage.toFixed(1)}%` : "0.0 kg / 0.0%"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Massa magra (kg / %):</span>
            <span className="font-medium text-foreground">
              {weightNum > 0 ? `${leanMass.toFixed(1)} kg / ${((leanMass / weightNum) * 100).toFixed(1)}%` : "0.0 kg / 100.0%"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Massa óssea (kg):</span>
            <span className="font-medium text-foreground">
              {weightNum > 0 ? `${boneMass.toFixed(1)} kg` : "- kg"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Massa muscular (kg):</span>
            <span className="font-medium text-foreground">
              {weightNum > 0 ? `${muscularMass.toFixed(1)} kg` : "- kg"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Peso desejável:</span>
            <span className="font-medium text-foreground">{idealWeight} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Perda de gordura necessária:</span>
            <span className="font-medium text-foreground">{fatLossNeeded} kg</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
