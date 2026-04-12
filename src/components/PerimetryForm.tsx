import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PerimetryData } from "./MeasurementTabs";

interface PerimetryFormProps {
  data: PerimetryData;
  onChange: (data: PerimetryData) => void;
}

export function PerimetryForm({ data, onChange }: PerimetryFormProps) {
  const handleChange = (field: keyof PerimetryData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const calculateRCQ = () => {
    const waist = parseFloat(data.waist);
    const hip = parseFloat(data.hip);
    if (waist && hip) {
      return (waist / hip).toFixed(2);
    }
    return "—";
  };

  const getRCQClassification = (rcq: number, sex: string) => {
    if (sex === "M") {
      if (rcq < 0.9) return { level: "Baixo", color: "text-success" };
      if (rcq < 1.0) return { level: "Moderado", color: "text-warning" };
      return { level: "Alto", color: "text-destructive" };
    } else {
      if (rcq < 0.8) return { level: "Baixo", color: "text-success" };
      if (rcq < 0.85) return { level: "Moderado", color: "text-warning" };
      return { level: "Alto", color: "text-destructive" };
    }
  };

  const rcq = calculateRCQ();
  const rcqValue = parseFloat(rcq);

  // Cálculo de assimetrias
  const calculateAsymmetry = (right: string, left: string) => {
    const r = parseFloat(right);
    const l = parseFloat(left);
    if (r && l) {
      const diff = Math.abs(r - l);
      const avg = (r + l) / 2;
      const percent = ((diff / avg) * 100).toFixed(1);
      return `${diff.toFixed(1)} cm (${percent}%)`;
    }
    return "—";
  };

  const armRelaxedAsymmetry = calculateAsymmetry(data.rightArmRelaxed, data.leftArmRelaxed);
  const thighMedialAsymmetry = calculateAsymmetry(data.rightMedialThigh, data.leftMedialThigh);

  const measurements = [
    { label: "Ombro", field: "shoulder" as keyof PerimetryData },
    { label: "Tórax", field: "chest" as keyof PerimetryData },
    { label: "Cintura", field: "waist" as keyof PerimetryData },
    { label: "Abdômen", field: "abdomen" as keyof PerimetryData },
    { label: "Quadril", field: "hip" as keyof PerimetryData },
    { label: "Braço D (relaxado)", field: "rightArmRelaxed" as keyof PerimetryData },
    { label: "Braço D (contraído)", field: "rightArmContracted" as keyof PerimetryData },
    { label: "Braço E (relaxado)", field: "leftArmRelaxed" as keyof PerimetryData },
    { label: "Braço E (contraído)", field: "leftArmContracted" as keyof PerimetryData },
    { label: "Antebraço D", field: "rightForearm" as keyof PerimetryData },
    { label: "Antebraço E", field: "leftForearm" as keyof PerimetryData },
    { label: "Coxa Proximal D", field: "rightProximalThigh" as keyof PerimetryData },
    { label: "Coxa Medial D", field: "rightMedialThigh" as keyof PerimetryData },
    { label: "Coxa Proximal E", field: "leftProximalThigh" as keyof PerimetryData },
    { label: "Coxa Medial E", field: "leftMedialThigh" as keyof PerimetryData },
    { label: "Panturrilha D", field: "rightCalf" as keyof PerimetryData },
    { label: "Panturrilha E", field: "leftCalf" as keyof PerimetryData },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {measurements.map((measurement) => (
          <div key={measurement.field}>
            <Label htmlFor={measurement.field} className="text-sm">
              {measurement.label} (cm)
            </Label>
            <Input
              id={measurement.field}
              type="number"
              step="0.1"
              value={data[measurement.field]}
              onChange={(e) => handleChange(measurement.field, e.target.value)}
              placeholder="0.0"
              className="mt-1"
            />
          </div>
        ))}
      </div>

      {/* Seção: Resultados Calculados */}
      <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
        <h3 className="font-semibold text-foreground mb-4">Resultados Calculados</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">RCQ (Relação Cintura-Quadril)</p>
            <p className="text-lg font-bold text-foreground">{rcq}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Classificação de Risco</p>
            <p className={`text-lg font-semibold ${!isNaN(rcqValue) ? getRCQClassification(rcqValue, "M").color : ""}`}>
              {!isNaN(rcqValue) && rcq !== "—" ? getRCQClassification(rcqValue, "M").level : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assimetria de Braço (Relaxado)</p>
            <p className="text-lg font-bold text-foreground">{armRelaxedAsymmetry}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assimetria de Coxa (Medial)</p>
            <p className="text-lg font-bold text-foreground">{thighMedialAsymmetry}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
